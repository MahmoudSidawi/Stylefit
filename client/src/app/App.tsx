import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import PlaceholderPage from '../components/PlaceholderPage'
import CataloguePage from '../features/products/pages/CataloguePage'
import AuthPage from '../features/auth/pages/AuthPage'
import ProductDetails from '../pages/ProductDetails'
import WardrobePage from '../features/wardrobe/pages/WardrobePage'
import MatcherPage from '../features/matcher/pages/MatcherPage'
import CartPage from '../features/cart/pages/CartPage'
import Wishlist from '../pages/Wishlist'
import CheckoutPage from '../features/checkout/pages/CheckoutPage'
import Orders from '../pages/Orders'
import Profile from '../pages/Profile'
import AdminProducts from '../pages/admin/AdminProducts'
import AdminOrders from '../pages/admin/AdminOrders'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/catalogue" element={<CataloguePage key="storefront" />} />
        <Route
          path="/clothes"
          element={<CataloguePage key="all-clothes" allClothes />}
        />
        <Route path="/matcher" element={<MatcherPage />} />
        <Route path="/wardrobe" element={<WardrobePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route
          path="/login"
          element={<AuthPage key="login" initialMode="login" />}
        />
        <Route
          path="/register"
          element={<AuthPage key="register" initialMode="register" />}
        />
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/catalogue" replace />} />
          <Route path="/products/:productId" element={<ProductDetails />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route
            path="*"
            element={
              <PlaceholderPage
                title="Page not found"
                description="Use the navigation to return to a StyleFit page."
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
