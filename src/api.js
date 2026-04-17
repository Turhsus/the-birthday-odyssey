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
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) throw new Error(data.error || `Server error (${res.status})`)
  return data
}

export const api = {
  // Auth
  play:           (username, password)           => request('/auth/play',           { method: 'POST', body: { username, password } }),
  loginAdmin:     (password)                     => request('/auth/login-admin',    { method: 'POST', body: { password } }),
  changePassword: (currentPassword, newPassword) => request('/auth/change-password',{ method: 'PUT',  body: { currentPassword, newPassword } }),

  // Clues
  getClues:    ()                            => request('/clues'),
  getAllClues:  ()                            => request('/clues/all'),
  submitPin:   (id, pin)                     => request(`/clues/${id}/submit`,  { method: 'POST', body: { pin } }),
  createClue:  (text, pin, location)         => request('/clues',               { method: 'POST', body: { text, pin, location } }),
  updateClue:  (id, text, pin, location)     => request(`/clues/${id}`,         { method: 'PUT',  body: { text, pin, location } }),
  deleteClue:  (id)                          => request(`/clues/${id}`,         { method: 'DELETE' }),

  // Users
  getUsers:        ()            => request('/users'),
  assignUserTeam:  (id, teamId)  => request(`/users/${id}/team`, { method: 'PUT', body: { teamId } }),
  removeUser:      (id)          => request(`/users/${id}`,      { method: 'DELETE' }),

  // Teams
  getTeams:    ()          => request('/teams'),
  createTeam:  (name)      => request('/teams',          { method: 'POST',   body: { name } }),
  renameTeam:  (id, name)  => request(`/teams/${id}/name`, { method: 'PUT', body: { name } }),
  deleteTeam:  (id)        => request(`/teams/${id}`,    { method: 'DELETE' }),

  // Admin
  resetGame: () => request('/admin/reset', { method: 'POST' }),

  // Leaderboard
  getLeaderboard: () => request('/leaderboard'),
}
