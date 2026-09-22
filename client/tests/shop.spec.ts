import { test, expect, type Page } from '@playwright/test'

const userId = '11111111-1111-4111-8111-111111111111'
const products = ['Cotton T-shirt', 'Straight Jeans', 'Everyday Dress'].map((name, i) => ({
  product_id: `00000000-0000-4000-8000-00000000000${i}`, name, description: 'An everyday basic.',
  category_id: ['tops', 'bottoms', 'dresses'][i], clothing_type: ['t-shirts', 'jeans', 'dresses'][i],
  style: 'casual', pattern: 'solid', is_active: true,
  product_variants: [{ variant_id: `00000000-0000-4000-9000-00000000000${i}`, size: 'M', color: 'Cream',
    price: 25 + i * 10, stock_quantity: 20, image_url: `/clothes/${['basic-tee', 'straight-jeans', 'everyday-dress'][i]}.svg`, is_active: true }],
}))
const dimension = { score: 86, explanation: 'These pieces work well together.' }
const analysis = { score: 86, explanation: 'A comfortable everyday outfit with coordinated colors.', colors: dimension,
  styles: dimension, patterns: dimension, clothing_types: dimension, occasion: dimension, suggestions: ['Try a relaxed top.'],
  provider: 'groq', model: 'test-model', used_profile: false, images_analyzed: 0, disclaimer: 'A subjective styling estimate, not a guarantee of garment fit.' }

async function setup(page: Page, signedIn = true) {
  const calls: { path: string; body: Record<string, unknown> | null }[] = []
  let quantity = 0
  let ordered = false
  if (signedIn) await page.addInitScript(({ userId }) => {
    const user = { id: userId, email: 'test@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }
    const expires = Math.floor(Date.now() / 1000) + 3600
    const token = [btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })), btoa(JSON.stringify({ sub: userId, exp: expires, role: 'authenticated', aud: 'authenticated' })), 'testsignature'].join('.')
    localStorage.setItem('sb-stylefit-test-auth-token', JSON.stringify({ access_token: token, token_type: 'bearer', refresh_token: 'test-refresh', expires_in: 3600, expires_at: expires, user }))
  }, { userId })
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const method = route.request().method()
    const body = route.request().postDataJSON() as Record<string, unknown> | null
    calls.push({ path, body })
    let response: unknown = null
    if (path === '/api/products') {
      const items = products.filter((p) => !url.searchParams.get('category') || p.category_id === url.searchParams.get('category'))
      response = { items, total: items.length, mode: 'live', limit: 100, offset: 0 }
    } else if (path === '/api/me') response = { user_id: userId, name: 'Test Customer', email: 'test@example.test', role: 'customer', height_cm: null, weight_kg: null, body_shape: null, clothing_size: null, skin_tone: null }
    else if (path === '/api/cart' && method === 'GET') response = quantity ? [{ cart_item_id: 'cart-1', variant_id: products[0].product_variants[0].variant_id, quantity, product_variants: { ...products[0].product_variants[0], products: products[0] } }] : []
    else if (path === '/api/cart/add') quantity += Number(body?.quantity)
    else if (path === '/api/cart' && method === 'PUT') quantity = Number(body?.quantity)
    else if (path === '/api/orders' && method === 'POST') { ordered = true; quantity = 0; response = 'order-123' }
    else if (path === '/api/orders') response = ordered ? [{ order_id: 'order-123', total_amount: 50, status: 'placed', is_paid: false, created_at: new Date().toISOString(), order_items: [{ product_name: 'Cotton T-shirt', size: 'M', color: 'Cream', quantity: 2, unit_price: 25 }] }] : []
    else if (path === '/api/wardrobe' || path === '/api/wishlist') response = []
    else if (path === '/api/matches') response = analysis
    else return route.fulfill({ status: 404, json: { detail: `Unmocked endpoint ${path}` } })
    await route.fulfill({ status: 200, json: response })
  })
  return calls
}

test('guest catalogue filters categories and private pages require sign-in', async ({ page }) => {
  await setup(page, false)
  await page.goto('/clothes')
  await expect(page.locator('.product-card')).toHaveCount(3)
  await page.getByRole('radio', { name: /Dresses/ }).check()
  await expect(page.locator('.product-card')).toHaveCount(1)
  await page.goto('/matcher')
  await expect(page.getByRole('main').getByRole('link', { name: 'Sign in', exact: true })).toBeVisible()
  await expect(page.getByText('Check outfit with AI', { exact: true })).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/clothes')
  await expect(page.locator('.product-card')).toHaveCount(3)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('authenticated cart and cash-on-delivery checkout call the backend', async ({ page }) => {
  const calls = await setup(page)
  await page.goto('/clothes')
  await page.getByRole('button', { name: 'Add to Bag', exact: true }).first().click()
  await expect(page.getByRole('link', { name: 'Bag (1)', exact: true })).toBeVisible()
  await page.goto('/cart')
  await page.getByRole('button', { name: 'Increase Cotton T-shirt size M' }).click()
  await expect(page.locator('.summary-total strong')).toHaveText('$50.00')
  await page.getByRole('link', { name: 'Continue to Checkout', exact: true }).click()
  await page.getByLabel('Recipient name').fill('Test Customer')
  await page.getByLabel('Phone', { exact: true }).fill('+961 1234567')
  await page.getByLabel('Delivery address').fill('Building 12, Example Street')
  await page.getByRole('button', { name: /Place order.*Cash on delivery/ }).click()
  await expect(page.getByRole('heading', { name: 'Your order is placed.' })).toBeVisible()
  const checkout = calls.find((call) => call.path === '/api/orders' && call.body)
  expect(checkout?.body).toEqual({ recipient_name: 'Test Customer', phone: '+961 1234567', delivery_address: 'Building 12, Example Street' })
  await page.getByRole('link', { name: 'View your orders' }).click()
  await expect(page.getByText('Order order-123', { exact: true })).toBeVisible()
})

test('AI selection sends only IDs and clears stale analysis when changed', async ({ page }) => {
  const calls = await setup(page)
  await page.goto('/matcher')
  await page.getByRole('button', { name: 'Add Cotton T-shirt to canvas', exact: true }).click()
  await page.getByRole('button', { name: 'Add Straight Jeans to canvas', exact: true }).click()
  await page.getByRole('button', { name: 'Check outfit with AI', exact: true }).click()
  await expect(page.locator('.harmony-gauge strong')).toHaveText('86%')
  expect(calls.find((call) => call.path === '/api/matches')?.body).toEqual({
    items: products.slice(0, 2).map((product) => ({ source: 'store', variant_id: product.product_variants[0].variant_id })), occasion: 'weekend', include_profile: false,
  })
  await page.getByRole('combobox', { name: 'Outfit occasion', exact: true }).selectOption('work')
  await expect(page.locator('.harmony-gauge strong')).not.toHaveText('86%')
  await page.goto('/admin/products')
  await expect(page.getByText('Administrator access is required.', { exact: true })).toBeVisible()
})


test('original editorial homepage and product preview use account cart writes', async ({ page }) => {
  const calls = await setup(page)
  await page.goto('/catalogue')
  await expect(page.getByRole('heading', { name: 'Spring Architecture' })).toBeVisible()
  await expect(page.locator('.collection-hero')).toBeVisible()
  await page.getByRole('button', { name: 'Preview Cotton T-shirt' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Add to bag', exact: true }).click()
  await expect(dialog.getByText('Added size M to your bag.')).toBeVisible()
  expect(calls.find((call) => call.path === '/api/cart/add')?.body).toEqual({ variant_id: products[0].product_variants[0].variant_id, quantity: 1 })
})

test('wardrobe uses the original overview and only shows saved account garments', async ({ page }) => {
  await setup(page)
  await page.goto('/wardrobe')
  await expect(page.locator('.wardrobe-features')).toBeVisible()
  await expect(page.locator('.wardrobe-card')).toHaveCount(0)
  await page.getByRole('button', { name: 'Add Clothes', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByLabel('Garment name', { exact: true })).toBeVisible()
  await expect(page.getByText('Your photo is saved privately to your account.', { exact: false })).toBeVisible()
})


test('restored wardrobe uploads a photo and applies reviewed AI tags through the API', async ({ page }) => {
  await setup(page)
  let record: Record<string, unknown> | null = null
  let applied: Record<string, unknown> | null = null
  await page.route('**/api/wardrobe**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const method = route.request().method()
    if (path === '/api/wardrobe/images') return route.fulfill({ json: { image_url: userId + '/photo.png' } })
    if (path === '/api/wardrobe' && method === 'POST') {
      record = { ...route.request().postDataJSON(), wardrobe_item_id: 'garment-1' }
      return route.fulfill({ json: [record] })
    }
    if (path === '/api/wardrobe') return route.fulfill({ json: record ? [record] : [] })
    if (path.endsWith('/image')) return route.fulfill({ json: { url: '/clothes/basic-tee.svg', expires_in: 300 } })
    if (path.endsWith('/analyze')) return route.fulfill({ json: { name: 'Soft Cotton Tee', category_id: 'tops', clothing_type: 't-shirts', color: 'white', style: 'casual', pattern: 'solid', description: 'A plain cotton tee.', confidence: 'high' } })
    if (path === '/api/wardrobe/garment-1' && method === 'PUT') {
      applied = route.request().postDataJSON()
      record = { ...record, ...applied }
      return route.fulfill({ json: record })
    }
    return route.fulfill({ status: 404, json: { detail: 'Unknown wardrobe request' } })
  })
  await page.goto('/wardrobe')
  await page.getByRole('button', { name: 'Add Clothes', exact: true }).click()
  await page.getByLabel('Garment name', { exact: true }).fill('My Cotton Tee')
  await page.getByLabel('Fabric / material').fill('Cotton')
  await page.getByLabel('Size', { exact: true }).fill('M')
  await page.getByLabel('Garment photo file').setInputFiles({ name: 'tee.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64') })
  await page.getByRole('button', { name: 'Add to Wardrobe', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'My Cotton Tee', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Suggest details with AI', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Use these details' }).click()
  await expect(page.getByRole('heading', { name: 'Soft Cotton Tee', exact: true })).toBeVisible()
  expect(applied).toMatchObject({ name: 'Soft Cotton Tee', image_url: userId + '/photo.png', category_id: 'tops' })
  expect(applied).not.toHaveProperty('wardrobe_item_id')
})
