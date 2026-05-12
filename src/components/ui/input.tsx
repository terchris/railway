import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = "Input"

export { Input }
