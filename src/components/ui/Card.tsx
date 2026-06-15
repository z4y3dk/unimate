import { clsx } from 'clsx'
import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
}

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={clsx(
        'bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm',
        className
      )}
    >
      {children}
    </div>
  )
}
