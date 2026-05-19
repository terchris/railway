import { Slot } from "@radix-ui/react-slot"
import * as React from "react"

import { cn } from "@/lib/utils"
import styles from "./button.module.css"

type Variant = "default" | "secondary" | "outline"
type Size = "default" | "lg" | "sm"

const VARIANT_CLASS: Record<Variant, string> = {
  default: styles.variantDefault,
  secondary: styles.variantSecondary,
  outline: styles.variantOutline,
}

const SIZE_CLASS: Record<Size, string> = {
  default: styles.sizeDefault,
  lg: styles.sizeLg,
  sm: styles.sizeSm,
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(styles.button, VARIANT_CLASS[variant], SIZE_CLASS[size], className)}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button }
