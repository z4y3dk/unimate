import { clsx } from 'clsx'

interface SkeletonLoaderProps {
  className?: string
}

export default function SkeletonLoader({ className }: SkeletonLoaderProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200 dark:bg-white/10 rounded-lg',
        className
      )}
    />
  )
}
