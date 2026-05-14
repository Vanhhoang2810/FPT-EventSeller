import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border text-sm font-medium whitespace-nowrap transition-all backdrop-blur-md outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Primary — green glass */
        default:
          "bg-primary/15 border-primary/40 text-primary-700 dark:text-primary-300 shadow-sm shadow-primary/10 hover:bg-primary/25 hover:border-primary/60 hover:shadow-[0_0_16px_rgba(5,150,105,0.25)]",

        /* Secondary — neutral frosted glass */
        secondary:
          "bg-foreground/5 border-foreground/12 text-foreground/80 hover:bg-foreground/10 hover:border-foreground/20 hover:text-foreground",

        /* Outline — minimal glass */
        outline:
          "bg-background/40 border-border text-foreground/70 hover:bg-background/60 hover:text-foreground dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10",

        /* Ghost — no border, subtle glass */
        ghost:
          "border-transparent bg-transparent text-foreground/60 hover:bg-foreground/8 hover:text-foreground dark:hover:bg-white/8",

        /* Destructive — red glass */
        destructive:
          "bg-destructive/10 border-destructive/30 text-destructive shadow-sm shadow-destructive/10 hover:bg-destructive/20 hover:border-destructive/50 hover:shadow-[0_0_16px_rgba(244,63,94,0.2)]",

        /* Link */
        link: "border-transparent bg-transparent text-primary underline-offset-4 hover:underline backdrop-blur-none",
      },
      size: {
        default: "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs:      "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm:      "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg:      "h-10 gap-2 px-4 text-base",
        icon:    "size-8",
        "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)]",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)]",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
