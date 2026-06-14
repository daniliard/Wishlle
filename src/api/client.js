const CONFIGURED_BACKEND_URL = String(import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '')

// На Vercel ходимо до Railway через same-origin rewrite /backend.
// Так авторизація не залежить від CORS і працює також на preview-доменах Vercel.
const BACKEND_URL = import.meta.env.PROD
  ? '/backend'
  : (CONFIGURED_BACKEND_URL || 'http://localhost:8000')

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
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  let res
  try {
    res = await fetch(url, { ...options, headers })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`Не вдалося виконати запит ${url}. Причина: ${reason}`)
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
  const user = await request(`${BACKEND_URL}/api/profile/me`)
  localStorage.setItem('wishlle_user', JSON.stringify(user))
  return user
}

export async function updateMe(payload) {
  const updated = await request(`${BACKEND_URL}/api/profile/me`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  localStorage.setItem('wishlle_user', JSON.stringify(updated))
  return updated
}

export async function uploadAvatar(file) {
  const body = new FormData()
  body.append('file', file)
  const updated = await request(`${BACKEND_URL}/api/profile/avatar`, {
    method: 'POST',
    body,
  })
  localStorage.setItem('wishlle_user', JSON.stringify(updated))
  return updated
}

export async function removeAvatar() {
  const updated = await request(`${BACKEND_URL}/api/profile/avatar`, {
    method: 'DELETE',
  })
  localStorage.setItem('wishlle_user', JSON.stringify(updated))
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
  return request(`${BACKEND_URL}/api/wishlists`)
}

export async function createList(payload) {
  return request(`${BACKEND_URL}/api/wishlists`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateList(id, payload) {
  return request(`${BACKEND_URL}/api/wishlists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteList(id) {
  return request(`${BACKEND_URL}/api/wishlists/${id}`, { method: 'DELETE' })
}

// ── Wish Items ────────────────────────────────────────────────────────────
export async function getListItems(wishlistId) {
  return request(`${BACKEND_URL}/api/wishlists/${wishlistId}/items`)
}

export async function createItem(wishlistId, payload) {
  return request(`${BACKEND_URL}/api/wishlists/${wishlistId}/items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateItem(id, payload) {
  return request(`${BACKEND_URL}/api/wishlists/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteItem(id) {
  return request(`${BACKEND_URL}/api/wishlists/items/${id}`, { method: 'DELETE' })
}

// ── Friends ───────────────────────────────────────────────────────────────
export async function getFriends() {
  return request(`${BACKEND_URL}/api/friends`)
}

export async function searchUsers(query) {
  return request(`${BACKEND_URL}/api/friends/search?q=${encodeURIComponent(query)}`)
}

export async function addFriend(friendId) {
  return request(`${BACKEND_URL}/api/friends`, {
    method: 'POST',
    body: JSON.stringify({ friend_id: friendId }),
  })
}

export async function getFriendRequests() {
  return request(`${BACKEND_URL}/api/friends/requests`)
}

export async function acceptFriendRequest(requestId) {
  return request(`${BACKEND_URL}/api/friends/requests/${requestId}/accept`, {
    method: 'POST',
  })
}

export async function rejectFriendRequest(requestId) {
  return request(`${BACKEND_URL}/api/friends/requests/${requestId}`, {
    method: 'DELETE',
  })
}

export async function updateFriend(friendshipId, payload) {
  return request(`${BACKEND_URL}/api/friends/${friendshipId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function removeFriend(friendshipId) {
  return request(`${BACKEND_URL}/api/friends/${friendshipId}`, {
    method: 'DELETE',
  })
}

export async function getFriendDetails(friendId) {
  return request(`${BACKEND_URL}/api/friends/${friendId}/details`)
}

// ── Events ────────────────────────────────────────────────────────────────
export async function getMyEvents() {
  return request(`${BACKEND_URL}/api/events`)
}

export async function getEventInvitations() {
  return request(`${BACKEND_URL}/api/events/invitations`)
}

export async function getEventDetails(eventId) {
  return request(`${BACKEND_URL}/api/events/${eventId}`)
}

export async function createEvent(payload) {
  return request(`${BACKEND_URL}/api/events`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateEvent(eventId, payload) {
  return request(`${BACKEND_URL}/api/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteEvent(eventId) {
  return request(`${BACKEND_URL}/api/events/${eventId}`, { method: 'DELETE' })
}

export async function inviteToEvent(eventId, userIds) {
  return request(`${BACKEND_URL}/api/events/${eventId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ user_ids: userIds }),
  })
}

export async function respondToEvent(eventId, status) {
  return request(`${BACKEND_URL}/api/events/${eventId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

export async function removeEventParticipant(eventId, participantUserId) {
  return request(`${BACKEND_URL}/api/events/${eventId}/participants/${participantUserId}`, {
    method: 'DELETE',
  })
}

export async function syncBirthdayEvents() {
  return request(`${BACKEND_URL}/api/events/sync-birthdays`, { method: 'POST' })
}

// ── Catalog ───────────────────────────────────────────────────────────────
export async function getCatalog(params = {}) {
  const qs = new URLSearchParams()
  if (params.category && params.category !== 'all') qs.set('category', params.category)
  if (params.search) qs.set('search', params.search)
  if (params.featured) qs.set('featured', 'true')
  const query = qs.toString()
  return request(`${BACKEND_URL}/api/catalog${query ? '?' + query : ''}`)
}

export async function getCatalogCategories() {
  return request(`${BACKEND_URL}/api/catalog/categories`)
}

export async function addCatalogItemToList(itemId, wishlistId) {
  return request(`${BACKEND_URL}/api/catalog/${itemId}/add-to-list`, {
    method: 'POST',
    body: JSON.stringify({ wishlist_id: wishlistId }),
  })
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

// ── Reservations (резервування подарунків) ─────────────────────────────────
export async function viewFriendList(listId) {
  return request(`${BACKEND_URL}/api/reservations/list/${listId}`)
}

export async function reserveItem(itemId) {
  return request(`${BACKEND_URL}/api/reservations`, {
    method: 'POST',
    body: JSON.stringify({ item_id: itemId }),
  })
}

export async function cancelReservation(itemId) {
  return request(`${BACKEND_URL}/api/reservations/item/${itemId}`, {
    method: 'DELETE',
  })
}

export async function getMyReservations() {
  return request(`${BACKEND_URL}/api/reservations/mine`)
}

// ── Notifications (центр сповіщень) ─────────────────────────────────────────
export async function getNotifications(limit = 50) {
  return request(`${BACKEND_URL}/api/notifications?limit=${limit}`)
}

export async function getUnreadCount() {
  return request(`${BACKEND_URL}/api/notifications/unread`)
}

export async function markNotificationRead(id) {
  return request(`${BACKEND_URL}/api/notifications/${id}/read`, { method: 'POST' })
}

export async function markAllNotificationsRead() {
  return request(`${BACKEND_URL}/api/notifications/read-all`, { method: 'POST' })
}

export async function deleteNotification(id) {
  return request(`${BACKEND_URL}/api/notifications/${id}`, { method: 'DELETE' })
}
