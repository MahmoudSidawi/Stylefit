import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import CataloguePage from '../features/products/pages/CataloguePage'
import CartPage from '../features/cart/pages/CartPage'
import CheckoutPage from '../features/checkout/pages/CheckoutPage'
import PlaceholderPage from '../components/PlaceholderPage'
import AuthPage from '../features/auth/pages/AuthPage'
import { SessionProvider } from '../features/auth/SessionProvider'
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage'
import { LiveProduct, LiveWishlist, LiveOrders } from '../features/live/ShoppingPages'
const LiveWardrobe = lazy(() => import('../features/wardrobe/pages/WardrobePage'))
const LiveMatcher = lazy(() => import('../features/matcher/pages/MatcherPage'))
const LiveAdminProducts = lazy(() => import('../features/live/AdminPages').then((module) => ({ default: module.LiveAdminProducts })))
const LiveAdminUsers = lazy(() => import('../features/live/AdminPages').then((module) => ({ default: module.LiveAdminUsers })))
const LiveAdminOrders = lazy(() => import('../features/live/AdminPages').then((module) => ({ default: module.LiveAdminOrders })))
import { AdminLogin } from '../features/admin/AdminAccess'
import Profile from '../pages/Profile'
import { useSession } from '../features/auth/sessionContext'

export default function App() {
  return <SessionProvider><BrowserRouter><RoutedPages /></BrowserRouter></SessionProvider>
}

function RoutedPages() {
  const { session } = useSession()
  const accountKey = session?.user.id ?? 'guest'
  return <Suspense fallback={<p role="status">Loading page...</p>}><Routes>
    <Route index element={<Navigate to="/catalogue" replace />} />
    <Route path="/catalogue" element={<CataloguePage />} />
    <Route path="/clothes" element={<CataloguePage allClothes />} />
    <Route path="/products/:productId" element={<LiveProduct />} />
    <Route path="/cart" element={<CartPage key={accountKey} />} />
    <Route path="/checkout" element={<CheckoutPage key={accountKey} />} />
    <Route path="/wishlist" element={<LiveWishlist key={accountKey} />} />
    <Route path="/orders" element={<LiveOrders key={accountKey} />} />
    <Route path="/wardrobe" element={<LiveWardrobe key={accountKey} />} />
    <Route path="/matcher" element={<LiveMatcher key={accountKey} />} />
    <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin/users" element={<SessionProvider admin><LiveAdminUsers /></SessionProvider>} />
    <Route path="/admin/products" element={<SessionProvider admin><LiveAdminProducts /></SessionProvider>} />
    <Route path="/admin/orders" element={<SessionProvider admin><LiveAdminOrders /></SessionProvider>} />
    <Route path="/profile" element={<Profile key={accountKey} />} />
    <Route path="/login" element={<AuthPage key="login" initialMode="login" />} />
    <Route path="/register" element={<AuthPage key="register" initialMode="register" />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="*" element={<PlaceholderPage title="Page not found" description="Return to the clothes catalogue to continue shopping." />} />
  </Routes></Suspense>
}
