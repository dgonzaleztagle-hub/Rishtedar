export type DishId =
  | 'butter-chicken'
  | 'chicken-biryani'
  | 'saag-paneer'
  | 'chana-masala'
  | 'dal-makhani'

export type IngredientId =
  | 'chicken'
  | 'basmati-rice'
  | 'paneer'
  | 'chickpeas'
  | 'black-lentils'
  | 'saag'
  | 'masala-base'
  | 'garam-masala'
  | 'makhani-cream'

export type CustomerMood = 'happy' | 'neutral' | 'impatient'
export type ChefMood = 'happy' | 'busy' | 'panicked'
export type DifficultyTier = 1 | 2 | 3 | 4

export interface IngredientToken {
  id: IngredientId
  label: string
  shortLabel: string
  badgeLabel: string
  accent: string
  fill: string
  glyph: string
  assetPath: string
}

export interface RecipeDefinition {
  id: DishId
  name: string
  ingredients: IngredientId[]
  assetPath: string
  visualStyle: {
    bowl: string
    sauce: string
    garnish: string
  }
  scoreBase: number
}

export interface CustomerOrder {
  recipeId: DishId
  createdAt: number
  patienceMs: number
  status: 'waiting' | 'served' | 'left'
}

export interface PreparedDish {
  selectedIngredients: IngredientId[]
  isComplete: boolean
  recipeMatch: DishId | null
}

export interface GameDifficultyState {
  tier: DifficultyTier
  spawnIntervalMs: number
  patienceMultiplier: number
  recipeComplexityWeight: number
}

export interface GameRunResult {
  score: number
  maxCombo: number
  dishesServed: number
  counted: boolean
}

export const INGREDIENTS: IngredientToken[] = [
  {
    id: 'chicken',
    label: 'Pollo',
    shortLabel: 'Po',
    badgeLabel: 'Po',
    accent: '#ffd0a8',
    fill: '#71311f',
    glyph: 'Po',
    assetPath: '/game-assets/ingredients/chicken.png',
  },
  {
    id: 'basmati-rice',
    label: 'Arroz basmati',
    shortLabel: 'Ar',
    badgeLabel: 'Ar',
    accent: '#fff4d5',
    fill: '#b69352',
    glyph: 'Ar',
    assetPath: '/game-assets/ingredients/basmati-rice.png',
  },
  {
    id: 'paneer',
    label: 'Paneer',
    shortLabel: 'Pa',
    badgeLabel: 'Pa',
    accent: '#fff3d2',
    fill: '#ba8d4d',
    glyph: 'Pa',
    assetPath: '/game-assets/ingredients/paneer.png',
  },
  {
    id: 'chickpeas',
    label: 'Garbanzos',
    shortLabel: 'Ga',
    badgeLabel: 'Ga',
    accent: '#f4df79',
    fill: '#9f7a32',
    glyph: 'Ga',
    assetPath: '/game-assets/ingredients/chickpeas.png',
  },
  {
    id: 'black-lentils',
    label: 'Lentejas negras',
    shortLabel: 'Le',
    badgeLabel: 'Le',
    accent: '#a99bc2',
    fill: '#433456',
    glyph: 'Le',
    assetPath: '/game-assets/ingredients/black-lentils.png',
  },
  {
    id: 'saag',
    label: 'Saag',
    shortLabel: 'Sa',
    badgeLabel: 'Sa',
    accent: '#9fd58a',
    fill: '#305b35',
    glyph: 'Sa',
    assetPath: '/game-assets/ingredients/saag.png',
  },
  {
    id: 'masala-base',
    label: 'Masala base',
    shortLabel: 'Ma',
    badgeLabel: 'Ma',
    accent: '#f0a14a',
    fill: '#8f3e17',
    glyph: 'Ma',
    assetPath: '/game-assets/ingredients/masala-base.png',
  },
  {
    id: 'garam-masala',
    label: 'Garam masala',
    shortLabel: 'Gr',
    badgeLabel: 'Gr',
    accent: '#d3aa6b',
    fill: '#5a3921',
    glyph: 'Gr',
    assetPath: '/game-assets/ingredients/garam-masala.png',
  },
  {
    id: 'makhani-cream',
    label: 'Makhani',
    shortLabel: 'Mk',
    badgeLabel: 'Mk',
    accent: '#ffd4ad',
    fill: '#a64c2e',
    glyph: 'Mk',
    assetPath: '/game-assets/ingredients/makhani-cream.png',
  },
]

export const RECIPES: RecipeDefinition[] = [
  {
    id: 'butter-chicken',
    name: 'Butter Chicken',
    ingredients: ['chicken', 'masala-base', 'makhani-cream'],
    assetPath: '/game-assets/dishes/butter-chicken.png',
    visualStyle: { bowl: '#8d3a25', sauce: '#d56d3f', garnish: '#ffd19c' },
    scoreBase: 145,
  },
  {
    id: 'chicken-biryani',
    name: 'Chicken Biryani',
    ingredients: ['chicken', 'basmati-rice', 'garam-masala'],
    assetPath: '/game-assets/dishes/chicken-biryani.png',
    visualStyle: { bowl: '#5e4623', sauce: '#d5ab50', garnish: '#f7f1cb' },
    scoreBase: 155,
  },
  {
    id: 'saag-paneer',
    name: 'Saag Paneer',
    ingredients: ['paneer', 'saag', 'garam-masala'],
    assetPath: '/game-assets/dishes/saag-paneer.png',
    visualStyle: { bowl: '#274b2a', sauce: '#3d7a42', garnish: '#f5e8c2' },
    scoreBase: 140,
  },
  {
    id: 'chana-masala',
    name: 'Chana Masala',
    ingredients: ['chickpeas', 'masala-base', 'garam-masala'],
    assetPath: '/game-assets/dishes/chana-masala.png',
    visualStyle: { bowl: '#6c351f', sauce: '#bb6f32', garnish: '#f4d171' },
    scoreBase: 145,
  },
  {
    id: 'dal-makhani',
    name: 'Dal Makhani',
    ingredients: ['black-lentils', 'makhani-cream', 'masala-base'],
    assetPath: '/game-assets/dishes/dal-makhani.png',
    visualStyle: { bowl: '#3a243e', sauce: '#5b3561', garnish: '#ffd6be' },
    scoreBase: 150,
  },
]

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((ingredient) => [ingredient.id, ingredient])
) as Record<IngredientId, IngredientToken>

export const RECIPE_BY_ID = Object.fromEntries(
  RECIPES.map((recipe) => [recipe.id, recipe])
) as Record<DishId, RecipeDefinition>

export function isExactRecipeMatch(ingredients: IngredientId[]): DishId | null {
  const normalized = [...ingredients].sort().join('|')
  const match = RECIPES.find(
    (recipe) => [...recipe.ingredients].sort().join('|') === normalized
  )
  return match?.id ?? null
}

export function getRecipePreview(recipeId: DishId): string {
  return RECIPE_BY_ID[recipeId].ingredients
    .map((ingredientId) => INGREDIENT_BY_ID[ingredientId].shortLabel)
    .join(' · ')
}
