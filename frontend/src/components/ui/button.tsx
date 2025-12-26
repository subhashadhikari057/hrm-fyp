import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-slate-100 text-slate-900 hover:bg-slate-800 hover:text-white",
        secondary:
          "bg-slate-200 text-slate-900 hover:bg-slate-800 hover:text-white",
        outline:
          "border border-slate-300 bg-white text-slate-900 hover:bg-slate-800 hover:text-white",
        ghost: "text-slate-900 hover:bg-slate-800 hover:text-white",
        link: "text-slate-900 underline-offset-4 hover:underline",
        cancel: "bg-slate-100 text-slate-900 hover:bg-red-200 hover:text-red-700",
        blue: "bg-blue-100 text-blue-900 hover:bg-blue-700 hover:text-white",
        green: "bg-green-100 text-green-900 hover:bg-green-700 hover:text-white",
        purple: "bg-purple-100 text-purple-900 hover:bg-purple-700 hover:text-white",
        orange:
          "bg-orange-100 text-orange-900 hover:bg-orange-700 hover:text-white",
        red: "bg-red-100 text-red-900 hover:bg-red-700 hover:text-white",
        yellow:
          "bg-yellow-100 text-yellow-900 hover:bg-yellow-600 hover:text-white",
        indigo:
          "bg-indigo-100 text-indigo-900 hover:bg-indigo-700 hover:text-white",
        pink: "bg-pink-100 text-pink-900 hover:bg-pink-700 hover:text-white",
        gray: "bg-gray-100 text-gray-900 hover:bg-gray-700 hover:text-white",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants>
>(({ className, variant, size, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(buttonVariants({ variant, size }), className)}
    {...props}
  />
))
Button.displayName = "Button"

export { Button, buttonVariants }
