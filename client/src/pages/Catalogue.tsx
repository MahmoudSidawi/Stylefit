import { Link } from 'react-router-dom'
import PlaceholderPage from '../components/PlaceholderPage'

export default function Catalogue() {
  return (
    <PlaceholderPage
      title="Catalogue"
      description="Browse the product catalogue, categories, and search when store features are implemented."
    >
      <Link to="/products/placeholder">Open a placeholder product</Link>
    </PlaceholderPage>
  )
}

