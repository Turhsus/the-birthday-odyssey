import { Router } from 'express'
import { db } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.team_name, u.created_at,
      COUNT(mf.id) AS moons
    FROM users u
    LEFT JOIN moon_finds mf ON mf.user_id = u.id
    WHERE u.is_admin = 0
    GROUP BY u.id
    ORDER BY moons DESC, u.username
  `).all()
  res.json({ users })
})

router.delete('/:id', requireAdmin, (req, res) => {
  const { changes } = db.prepare('DELETE FROM users WHERE id = ? AND is_admin = 0')
    .run(parseInt(req.params.id))
  if (!changes) return res.status(404).json({ error: 'User not found' })
  res.json({ ok: true })
})

export default router
