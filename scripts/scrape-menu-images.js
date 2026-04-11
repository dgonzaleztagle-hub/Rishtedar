/**
 * Rishtedar Menu Image Scraper
 * Intercepts Mercat API calls on delivery.rishtedar.cl to extract product images.
 * Downloads images to public/images/menu/ and outputs a mapping JSON.
 *
 * Usage: node scripts/scrape-menu-images.js
 */

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'menu')
const MAPPING_FILE = path.join(__dirname, 'menu-image-mapping.json')
const DELIVERY_URL = 'https://delivery.rishtedar.cl'

// Slugify a product name for use as filename
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 60)
}

// Download a file from URL to local path
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)
    proto.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close()
        fs.unlink(destPath, () => {})
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        file.close()
        fs.unlink(destPath, () => {})
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve(destPath)
      })
    }).on('error', (err) => {
      file.close()
      fs.unlink(destPath, () => {})
      reject(err)
    })
  })
}

async function scrape() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log('Launching Chromium...')
  const browser = await chromium.launch({ headless: false, slowMo: 200 })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  // Collected product data
  const products = []
  const seenIds = new Set()

  // Intercept all network responses
  page.on('response', async (response) => {
    const url = response.url()
    const ct = response.headers()['content-type'] || ''

    if (!ct.includes('application/json')) return
    if (response.status() !== 200) return

    try {
      const text = await response.text()
      if (!text || text.length < 50) return

      const data = JSON.parse(text)

      // Mercat API: products usually come as array or nested objects
      // Look for product structures with images
      const candidates = extractProducts(data)
      for (const p of candidates) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id)
          products.push(p)
          process.stdout.write(`  Found: ${p.name} (${p.id})\n`)
        }
      }
    } catch {
      // ignore parse errors
    }
  })

  console.log(`\nNavigating to ${DELIVERY_URL} ...`)
  await page.goto(DELIVERY_URL, { waitUntil: 'networkidle', timeout: 30000 })

  console.log('Waiting for page content...')
  await page.waitForTimeout(3000)

  // Try to find and click a store selector if present
  try {
    // Look for store/branch selection modals
    const storeButtons = await page.$$('[class*="store"], [class*="branch"], [class*="local"], [class*="sucursal"]')
    console.log(`Store selector elements found: ${storeButtons.length}`)

    if (storeButtons.length > 0) {
      // Click the first (Providencia)
      await storeButtons[0].click()
      await page.waitForTimeout(2000)
    }
  } catch (e) {
    console.log('No store selector found, continuing...')
  }

  // Scroll through the entire page to trigger lazy-loading
  console.log('Scrolling to trigger lazy loads...')
  await autoScroll(page)
  await page.waitForTimeout(2000)
  await autoScroll(page)
  await page.waitForTimeout(3000)

  // Also try to extract data directly from DOM
  console.log('Extracting product data from DOM...')
  const domProducts = await page.evaluate(() => {
    const results = []

    // Try to find Redux store if available
    const store = window.__REDUX_STORE__ || window.store
    if (store) {
      const state = store.getState()
      console.log('Redux state keys:', Object.keys(state))
    }

    // Scan all img tags for product images
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.dataset.src || ''
      const alt = img.alt || ''
      if (src && (src.includes('product') || src.includes('item') || src.includes('menu') || src.includes('dish') || src.includes('food'))) {
        results.push({ type: 'img', src, alt, name: alt })
      }
    })

    // Try to find product containers
    const productSelectors = [
      '[class*="product"]',
      '[class*="item"]',
      '[class*="dish"]',
      '[class*="menu-item"]',
      '[class*="menuItem"]',
      '[class*="ProductCard"]',
      '[data-product]',
      '[data-item]',
    ]

    for (const sel of productSelectors) {
      document.querySelectorAll(sel).forEach(el => {
        const img = el.querySelector('img')
        const name = el.querySelector('h2, h3, h4, [class*="name"], [class*="title"]')
        const price = el.querySelector('[class*="price"], [class*="Price"]')
        const desc = el.querySelector('p, [class*="desc"]')

        if (img && name) {
          results.push({
            type: 'dom',
            src: img.src || img.dataset.src,
            name: name.textContent?.trim(),
            price: price?.textContent?.trim(),
            description: desc?.textContent?.trim(),
          })
        }
      })
    }

    return results
  })

  console.log(`DOM extraction found ${domProducts.length} items`)

  // Take a screenshot for reference
  await page.screenshot({ path: path.join(__dirname, 'delivery-screenshot.png'), fullPage: false })
  console.log('Screenshot saved to scripts/delivery-screenshot.png')

  // Wait longer for more API calls
  await page.waitForTimeout(5000)

  console.log(`\nTotal products from API interception: ${products.length}`)
  console.log(`Total items from DOM extraction: ${domProducts.length}`)

  // Merge DOM results into products array (deduplicated by image URL)
  const allImages = new Map()

  for (const p of products) {
    if (p.imageUrl) allImages.set(p.imageUrl, { name: p.name, source: 'api' })
  }
  for (const p of domProducts) {
    if (p.src && p.name && !allImages.has(p.src)) {
      allImages.set(p.src, { name: p.name, source: 'dom' })
    }
  }

  console.log(`\nUnique images to download: ${allImages.size}`)

  // Download images
  const mapping = {}
  let downloaded = 0
  let failed = 0

  for (const [imageUrl, info] of allImages) {
    if (!imageUrl || !imageUrl.startsWith('http')) continue

    const slug = slugify(info.name || `item-${downloaded}`)
    const ext = imageUrl.match(/\.(jpe?g|png|webp)/i)?.[1] || 'jpg'
    const filename = `${slug}.${ext}`
    const destPath = path.join(OUTPUT_DIR, filename)

    // Skip if already downloaded
    if (fs.existsSync(destPath)) {
      mapping[info.name] = `/images/menu/${filename}`
      downloaded++
      console.log(`  Skipped (exists): ${filename}`)
      continue
    }

    try {
      await downloadFile(imageUrl, destPath)
      mapping[info.name] = `/images/menu/${filename}`
      downloaded++
      console.log(`  ✓ ${filename}`)
    } catch (err) {
      failed++
      console.log(`  ✗ ${info.name}: ${err.message}`)
    }
  }

  // Save mapping
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2), 'utf-8')

  console.log(`\n✅ Done: ${downloaded} downloaded, ${failed} failed`)
  console.log(`Mapping saved to: ${MAPPING_FILE}`)
  console.log('\nTop entries:')
  Object.entries(mapping).slice(0, 10).forEach(([name, url]) => console.log(`  "${name}": "${url}"`))

  await browser.close()
  return mapping
}

// Extract product objects from arbitrary JSON structure
function extractProducts(data, depth = 0) {
  if (depth > 8) return []
  const results = []

  if (Array.isArray(data)) {
    for (const item of data) {
      // Check if this looks like a product
      if (item && typeof item === 'object') {
        if (hasProductShape(item)) {
          results.push(normalizeProduct(item))
        } else {
          results.push(...extractProducts(item, depth + 1))
        }
      }
    }
  } else if (data && typeof data === 'object') {
    if (hasProductShape(data)) {
      results.push(normalizeProduct(data))
    } else {
      for (const val of Object.values(data)) {
        results.push(...extractProducts(val, depth + 1))
      }
    }
  }

  return results
}

function hasProductShape(obj) {
  // A "product" has a name/title and an image URL
  const hasName = obj.name || obj.title || obj.product_name || obj.item_name
  const hasImage = obj.image || obj.img || obj.photo || obj.image_url || obj.imageUrl ||
    obj.thumbnail || obj.picture || obj.cover || obj.media
  return !!(hasName && hasImage)
}

function normalizeProduct(obj) {
  const name = obj.name || obj.title || obj.product_name || obj.item_name || 'Unknown'
  const imageRaw = obj.image || obj.img || obj.photo || obj.image_url || obj.imageUrl ||
    obj.thumbnail || obj.picture || obj.cover || obj.media || ''

  // imageRaw might be a string or object
  let imageUrl = ''
  if (typeof imageRaw === 'string') {
    imageUrl = imageRaw
  } else if (imageRaw && typeof imageRaw === 'object') {
    imageUrl = imageRaw.url || imageRaw.src || imageRaw.original || imageRaw.full || ''
  }

  return {
    id: obj.id || obj._id || obj.product_id || `${Date.now()}-${Math.random()}`,
    name: typeof name === 'string' ? name : String(name),
    imageUrl,
    price: obj.price || obj.unit_price || obj.amount || null,
    description: obj.description || obj.desc || obj.short_description || null,
    category: obj.category || obj.category_name || obj.section || null,
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0
      const distance = 300
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance)
        totalHeight += distance
        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 120)
    })
  })
  // Scroll back to top to trigger any "load on visible" elements
  await page.evaluate(() => window.scrollTo(0, 0))
}

scrape().catch((err) => {
  console.error('Scraper error:', err)
  process.exit(1)
})
