import * as React from "react"

import { cn } from "@/lib/utils"
import styles from "./input.module.css"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input type={type} ref={ref} className={cn(styles.input, className)} {...props} />
  ),
)
Input.displayName = "Input"

export { Input }
