const BASE = '/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('moonhunt_token')
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  // Auth
  play:       (username, teamName, password) => request('/auth/play',        { method: 'POST', body: { username, teamName, password } }),
  loginAdmin: (password)                     => request('/auth/login-admin', { method: 'POST', body: { password } }),

  // Clues
  getClues:   ()                             => request('/clues'),
  getAllClues: ()                             => request('/clues/all'),
  submitPin:  (id, pin)                      => request(`/clues/${id}/submit`, { method: 'POST', body: { pin } }),
  createClue: (text, pin, location)          => request('/clues',     { method: 'POST', body: { text, pin, location } }),
  updateClue: (id, text, pin, location)      => request(`/clues/${id}`, { method: 'PUT',  body: { text, pin, location } }),
  deleteClue: (id)                           => request(`/clues/${id}`, { method: 'DELETE' }),

  // Users
  getUsers:   ()                             => request('/users'),
  removeUser: (id)                           => request(`/users/${id}`, { method: 'DELETE' }),

  // Leaderboard
  getLeaderboard: ()                         => request('/leaderboard'),
}
