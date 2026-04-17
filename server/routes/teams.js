import { Router } from 'express'
import { db } from '../db.js'
import { signToken, requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

// Admin: all teams with member count
router.get('/', requireAdmin, (req, res) => {
  const teams = db.prepare(`
    SELECT t.id, t.name, t.name_locked,
      COUNT(u.id) AS member_count
    FROM teams t
    LEFT JOIN users u ON u.team_id = t.id AND u.is_admin = 0
    GROUP BY t.id
    ORDER BY t.created_at
  `).all()
  res.json({ teams })
})

// Admin: create team
router.post('/', requireAdmin, (req, res) => {
  const { name } = req.body
  const { lastInsertRowid } = db.prepare('INSERT INTO teams (name) VALUES (?)').run(name?.trim() || '')
  res.status(201).json({ id: lastInsertRowid })
})

// Player or admin: rename team
// Player: own team only, once (sets name_locked). Admin: any team, doesn't affect lock.
router.put('/:id/name', requireAuth, (req, res) => {
  const teamId = parseInt(req.params.id)
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Team name cannot be empty.' })

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId)
  if (!team) return res.status(404).json({ error: 'Team not found.' })

  if (!req.user.isAdmin) {
    if (req.user.teamId !== teamId) return res.status(403).json({ error: 'Not your team.' })
    if (team.name_locked) return res.status(403).json({ error: 'Your team name has already been changed once.' })
    db.prepare('UPDATE teams SET name = ?, name_locked = 1 WHERE id = ?').run(name.trim(), teamId)
    // Issue fresh token so the player's displayed team name updates immediately
    const newToken = signToken({ id: req.user.id, username: req.user.username, teamId, teamName: name.trim(), isAdmin: false })
    return res.json({ ok: true, name: name.trim(), token: newToken })
  }

  db.prepare('UPDATE teams SET name = ? WHERE id = ?').run(name.trim(), teamId)
  res.json({ ok: true, name: name.trim() })
})

// Admin: delete team (users on it become unassigned)
router.delete('/:id', requireAdmin, (req, res) => {
  const { changes } = db.prepare('DELETE FROM teams WHERE id = ?').run(parseInt(req.params.id))
  if (!changes) return res.status(404).json({ error: 'Team not found.' })
  res.json({ ok: true })
})

export default router
