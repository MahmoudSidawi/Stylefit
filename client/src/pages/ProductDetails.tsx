import { useParams } from 'react-router-dom'
import PlaceholderPage from '../components/PlaceholderPage'

export default function ProductDetails() {
  const { productId } = useParams<{ productId: string }>()

  return (
    <PlaceholderPage
      title="Product details"
      description="Product information will appear here when the catalogue is connected."
    >
      <p>Product reference: {productId}</p>
    </PlaceholderPage>
  )
}

