import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db.js'
import { signToken } from '../middleware/auth.js'

const router = Router()

// Player: join (auto-register) or login with existing credentials
router.post('/play', (req, res) => {
  const { username, teamName, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }

  const existing = db.prepare('SELECT * FROM users WHERE username = ? AND is_admin = 0').get(username)

  if (existing) {
    if (!bcrypt.compareSync(password, existing.password_hash)) {
      return res.status(401).json({ error: 'Wrong password for this username.' })
    }
    const token = signToken({ id: existing.id, username: existing.username, teamName: existing.team_name, isAdmin: false })
    return res.json({ token, username: existing.username, teamName: existing.team_name })
  }

  // New player — register
  if (!teamName) return res.status(400).json({ error: 'Team name is required for new players.' })
  try {
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO users (username, team_name, password_hash) VALUES (?, ?, ?)'
    ).run(username, teamName, bcrypt.hashSync(password, 10))
    const token = signToken({ id: lastInsertRowid, username, teamName, isAdmin: false })
    res.status(201).json({ token, username, teamName, isNew: true })
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already taken.' })
    throw e
  }
})

// Admin login
router.post('/login-admin', (req, res) => {
  const { password } = req.body
  const admin = db.prepare('SELECT * FROM users WHERE is_admin = 1 LIMIT 1').get()
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Incorrect password.' })
  }
  const token = signToken({ id: admin.id, username: 'admin', teamName: 'Admin', isAdmin: true })
  res.json({ token })
})

export default router
