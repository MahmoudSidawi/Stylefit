import type { ReactNode } from 'react'

type PlaceholderPageProps = {
  title: string
  description: string
  children?: ReactNode
}

export default function PlaceholderPage({
  title,
  description,
  children,
}: PlaceholderPageProps) {
  return (
    <section className="page">
      <p className="eyebrow">StyleFit · Project foundation</p>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
      <p className="notice">This page is a placeholder. Its features are not implemented yet.</p>
    </section>
  )
}

