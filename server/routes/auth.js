import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db.js'
import { signToken, requireAdmin } from '../middleware/auth.js'

const router = Router()

function userWithTeam(username) {
  return db.prepare(`
    SELECT u.id, u.username, u.is_admin, u.password_hash,
      t.id AS team_id, COALESCE(t.name, '') AS team_name, t.name_locked
    FROM users u
    LEFT JOIN teams t ON t.id = u.team_id
    WHERE u.username = ?
  `).get(username)
}

// Player: login only
router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }
  const existing = userWithTeam(username)
  if (!existing || existing.is_admin) {
    return res.status(401).json({ error: 'No account found with that username.' })
  }
  if (!bcrypt.compareSync(password, existing.password_hash)) {
    return res.status(401).json({ error: 'Wrong password.' })
  }
  const token = signToken({ id: existing.id, username: existing.username, teamId: existing.team_id, teamName: existing.team_name, isAdmin: false })
  res.json({ token, username: existing.username, teamName: existing.team_name, teamId: existing.team_id, nameLocked: !!existing.name_locked })
})

// Player: register only
router.post('/register', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) {
    return res.status(409).json({ error: 'Username already taken.' })
  }
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)'
  ).run(username, bcrypt.hashSync(password, 10))
  const token = signToken({ id: lastInsertRowid, username, teamId: null, teamName: '', isAdmin: false })
  res.status(201).json({ token, username, teamName: '', teamId: null, nameLocked: false })
})

// Admin login
router.post('/login-admin', (req, res) => {
  const { password } = req.body
  const admin = db.prepare('SELECT * FROM users WHERE is_admin = 1 LIMIT 1').get()
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Incorrect password.' })
  }
  const token = signToken({ id: admin.id, username: 'admin', teamId: null, teamName: 'Admin', isAdmin: true })
  res.json({ token })
})

// Admin: change password
router.put('/change-password', requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new password are required.' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' })
  }
  const admin = db.prepare('SELECT * FROM users WHERE is_admin = 1 LIMIT 1').get()
  if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' })
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE is_admin = 1')
    .run(bcrypt.hashSync(newPassword, 10))
  res.json({ ok: true })
})

export default router
