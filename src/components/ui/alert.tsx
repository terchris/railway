import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm [&_p]:leading-relaxed [&_svg]:mt-0.5 [&_svg]:size-4",
  {
    variants: {
      variant: {
        default: "border-zinc-200 bg-zinc-50 text-zinc-900",
        destructive: "border-red-300 bg-red-50 text-red-950",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

function Alert({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

export { Alert, alertVariants }
