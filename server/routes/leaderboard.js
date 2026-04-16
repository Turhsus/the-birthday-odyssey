import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, (req, res) => {
  // Teams that have found at least one moon
  const active = db.prepare(`
    SELECT mf.team_name AS team, COUNT(mf.id) AS moons, COUNT(DISTINCT mf.user_id) AS members
    FROM moon_finds mf
    GROUP BY mf.team_name
    ORDER BY moons DESC
  `).all()

  // Teams registered but with zero finds — include so they appear on the board
  const activeSet = new Set(active.map(t => t.team))
  const zeros = db.prepare(`
    SELECT team_name AS team, COUNT(*) AS members
    FROM users WHERE is_admin = 0
    GROUP BY team_name
  `).all()
    .filter(t => !activeSet.has(t.team))
    .map(t => ({ ...t, moons: 0 }))

  res.json({ leaderboard: [...active, ...zeros] })
})

export default router
