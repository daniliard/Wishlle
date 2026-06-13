const BACKEND_URL  = import.meta.env.VITE_BACKEND_URL  || 'https://wishllebackend-production.up.railway.app'
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'https://directus-production-5c4b.up.railway.app'

export function getToken()      { return localStorage.getItem('wishlle_token') }
export function getUserId()     { return localStorage.getItem('wishlle_user_id') }
export function getCachedUser() {
  const u = localStorage.getItem('wishlle_user')
  return u ? JSON.parse(u) : null
}

function setAuth(token, userId, user) {
  localStorage.setItem('wishlle_token',   token)
  localStorage.setItem('wishlle_user_id', userId)
  localStorage.setItem('wishlle_user',    JSON.stringify(user))
}

export function removeAuth() {
  localStorage.removeItem('wishlle_token')
  localStorage.removeItem('wishlle_user_id')
  localStorage.removeItem('wishlle_user')
}

export function isLoggedIn() { return !!getToken() }

async function request(url, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  let res
  try {
    res = await fetch(url, { ...options, headers })
  } catch (error) {
    throw new Error('Не вдалося підключитися до бекенду. Перевір URL, CORS і стан Railway.')
  }

  if (res.status === 204) return null

  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { detail: text }
  }

  if (!res.ok) {
    // Не перезавантажуємо сторінку під час самого входу: інакше реальна
    // помилка Telegram/Directus губиться, а popup виглядає як завислий.
    if (res.status === 401 && token) removeAuth()

    throw new Error(
      data.detail ||
      data.errors?.[0]?.message ||
      `HTTP ${res.status}`,
    )
  }

  return data
}

async function directus(path, options = {}) {
  const res = await request(`${DIRECTUS_URL}${path}`, options)
  return res?.data ?? res
}

// ── Auth ──────────────────────────────────────────────────────────────────
export async function loginTelegram(initData) {
  const data = await request(`${BACKEND_URL}/api/auth/telegram`, {
    method: 'POST',
    body: JSON.stringify({ init_data: initData }),
  })
  setAuth(data.access_token, data.user_id, data.user)
  return data
}

export async function loginTelegramOIDC(idToken) {
  const data = await request(`${BACKEND_URL}/api/auth/telegram-oidc`, {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  })
  setAuth(data.access_token, data.user_id, data.user)
  return data
}

export async function loginGoogle(idToken) {
  const data = await request(`${BACKEND_URL}/api/auth/google`, {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  })
  setAuth(data.access_token, data.user_id, data.user)
  return data
}

export function logout() { removeAuth(); window.location.reload() }

// ── User ──────────────────────────────────────────────────────────────────
export async function getMe() {
  return getCachedUser()
}

export async function updateMe(payload) {
  const userId = getUserId()
  const updated = await directus(`/items/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  const current = getCachedUser() || {}
  localStorage.setItem('wishlle_user', JSON.stringify({ ...current, ...payload }))
  return updated
}

// ── Parser ────────────────────────────────────────────────────────────────
export async function parseUrl(url) {
  return request(`${BACKEND_URL}/api/parse-url`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

// ── Wish Lists ────────────────────────────────────────────────────────────
export async function getMyLists() {
  const userId = getUserId()
  return directus(`/items/wish_lists?filter[owner_id][_eq]=${userId}&sort[]=-date_created&fields[]=*`)
}

export async function createList(payload) {
  return directus('/items/wish_lists', {
    method: 'POST',
    body: JSON.stringify({ ...payload, owner_id: getUserId() }),
  })
}

export async function updateList(id, payload) {
  return directus(`/items/wish_lists/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteList(id) {
  return directus(`/items/wish_lists/${id}`, { method: 'DELETE' })
}

// ── Wish Items ────────────────────────────────────────────────────────────
export async function getListItems(wishlistId) {
  return directus(`/items/wish_items?filter[wishlist_id][_eq]=${wishlistId}&sort[]=-date_created`)
}

export async function createItem(payload) {
  return directus('/items/wish_items', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateItem(id, payload) {
  return directus(`/items/wish_items/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteItem(id) {
  return directus(`/items/wish_items/${id}`, { method: 'DELETE' })
}

export async function reserveItem(itemId) {
  await directus('/items/reservations', {
    method: 'POST',
    body: JSON.stringify({ item_id: itemId, reserved_by: getUserId() }),
  })
  return updateItem(itemId, { status: 'reserved' })
}

// ── Friends ───────────────────────────────────────────────────────────────
export async function getFriends() {
  const userId = getUserId()
  // expand friend user data
  return directus(`/items/friendships?filter[user_id][_eq]=${userId}&fields[]=*,friend.*`)
}

export async function addFriend(friendId) {
  return directus('/items/friendships', {
    method: 'POST',
    body: JSON.stringify({ user_id: getUserId(), friend_id: friendId }),
  })
}

// ── Events ────────────────────────────────────────────────────────────────
export async function getMyEvents() {
  const userId = getUserId()
  return directus(`/items/events?filter[owner_id][_eq]=${userId}&sort[]=event_date`)
}

export async function createEvent(payload) {
  return directus('/items/events', {
    method: 'POST',
    body: JSON.stringify({ ...payload, owner_id: getUserId() }),
  })
}

// ── Catalog ───────────────────────────────────────────────────────────────
export async function getCatalog() {
  return directus('/items/catalog_items?sort[]=sort_order&limit=50')
}

// ── Search users ──────────────────────────────────────────────────────────
export async function searchUsers(username) {
  return directus(`/items/users?filter[username][_icontains]=${encodeURIComponent(username)}&limit=10&fields[]=id,display_name,username,avatar_url`)
}

// ── Завершення браузерного OAuth (обмін code → токен) ───────────────────────
export async function finishBrowserLogin(code, codeVerifier) {
  const data = await request(`${BACKEND_URL}/api/auth/telegram/callback`, {
    method: 'POST',
    body: JSON.stringify({ code, code_verifier: codeVerifier }),
  })
  setAuth(data.access_token, data.user_id, data.user)
  return data
}
