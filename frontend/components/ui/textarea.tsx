import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground/90 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-20 w-full rounded-lg border bg-slate-900/45 px-3.5 py-2.5 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[color,box-shadow,border-color,background-color] outline-none focus-visible:border-sky-300/70 focus-visible:ring-sky-300/25 focus-visible:ring-[3px] focus-visible:bg-slate-900/72 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
