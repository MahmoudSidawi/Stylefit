import type { ReactNode } from 'react'

/** Shared storefront presentation for products and privately owned garments. */
export function CollectionCard({ className = '', image, title, aside, description, children }: {
  className?: string
  image: ReactNode
  title: ReactNode
  aside?: ReactNode
  description: ReactNode
  children: ReactNode
}) {
  return <article className={`product-card ${className}`.trim()}>
    <div className="product-image">{image}</div>
    <div className="product-meta">
      <div className="product-title"><h3>{title}</h3>{aside}</div>
      <p>{description}</p>
    </div>
    {children}
  </article>
}
