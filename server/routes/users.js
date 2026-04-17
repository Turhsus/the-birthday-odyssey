import { Router } from 'express'
import { db } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.team_id, COALESCE(t.name,'') AS team_name,
      t.name_locked, u.created_at, COUNT(mf.id) AS moons
    FROM users u
    LEFT JOIN teams t ON t.id = u.team_id
    LEFT JOIN moon_finds mf ON mf.user_id = u.id
    WHERE u.is_admin = 0
    GROUP BY u.id
    ORDER BY moons DESC, u.username
  `).all()
  res.json({ users })
})

// Admin: assign user to a team
router.put('/:id/team', requireAdmin, (req, res) => {
  const { teamId } = req.body
  const userId = parseInt(req.params.id)
  const { changes } = db.prepare('UPDATE users SET team_id = ? WHERE id = ? AND is_admin = 0')
    .run(teamId ?? null, userId)
  if (!changes) return res.status(404).json({ error: 'User not found.' })
  res.json({ ok: true })
})

router.delete('/:id', requireAdmin, (req, res) => {
  const { changes } = db.prepare('DELETE FROM users WHERE id = ? AND is_admin = 0')
    .run(parseInt(req.params.id))
  if (!changes) return res.status(404).json({ error: 'User not found.' })
  res.json({ ok: true })
})

export default router
