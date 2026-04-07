import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-none font-sans text-sm font-medium tracking-widest uppercase transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-brand-700 text-ivory hover:bg-brand-800 active:bg-brand-900',
        outline:
          'border border-brand-700 text-brand-700 hover:bg-brand-700 hover:text-ivory',
        gold:
          'bg-gold-600 text-warm-950 hover:bg-gold-700 active:bg-gold-800',
        ghost:
          'text-warm-700 hover:text-brand-700 hover:bg-warm-100',
        link:
          'text-brand-700 underline-offset-4 hover:underline p-0 h-auto tracking-normal normal-case text-base',
        nav:
          'text-warm-700 hover:text-brand-700 tracking-wide uppercase text-xs font-medium p-0 h-auto rounded-none',
      },
      size: {
        default: 'h-12 px-8 py-3',
        sm: 'h-9 px-5 text-xs',
        lg: 'h-14 px-10',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
