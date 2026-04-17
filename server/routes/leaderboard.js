import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, (req, res) => {
  // Teams with at least one find
  const active = db.prepare(`
    SELECT t.id AS team_id, COALESCE(t.name, '') AS team,
      COUNT(mf.id) AS moons, COUNT(DISTINCT mf.user_id) AS members
    FROM moon_finds mf
    JOIN teams t ON t.id = mf.team_id
    GROUP BY t.id
    ORDER BY moons DESC
  `).all()

  // Teams registered but with zero finds
  const activeIds = new Set(active.map(t => t.team_id))
  const zeros = db.prepare(`
    SELECT t.id AS team_id, COALESCE(t.name,'') AS team, COUNT(u.id) AS members
    FROM teams t
    LEFT JOIN users u ON u.team_id = t.id AND u.is_admin = 0
    GROUP BY t.id
  `).all()
    .filter(t => !activeIds.has(t.team_id))
    .map(t => ({ ...t, moons: 0 }))

  res.json({ leaderboard: [...active, ...zeros] })
})

export default router
