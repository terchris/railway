import * as React from "react"

import { cn } from "@/lib/utils"
import styles from "./alert.module.css"

type AlertVariant = "default" | "destructive"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
}

function Alert({ className, variant = "default", ...props }: AlertProps) {
  return (
    <div
      role="alert"
      data-color={variant === "destructive" ? "danger" : undefined}
      className={cn(styles.alert, className)}
      {...props}
    />
  )
}

export { Alert }
export type { AlertProps, AlertVariant }
