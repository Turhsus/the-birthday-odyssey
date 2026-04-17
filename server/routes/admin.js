import { Router } from 'express'
import { db } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'
import { ensureActiveClues } from '../utils.js'

const router = Router()

router.post('/start', requireAdmin, (req, res) => {
  // 1. Assign unassigned players to teams, keeping sizes as balanced as possible
  const teams = db.prepare('SELECT id FROM teams ORDER BY id').all()
  if (teams.length === 0) {
    return res.status(400).json({ error: 'Create at least one team before starting.' })
  }

  const unassigned = db.prepare(
    'SELECT id FROM users WHERE team_id IS NULL AND is_admin = 0 ORDER BY RANDOM()'
  ).all()

  if (unassigned.length > 0) {
    // Build a size map of current team populations
    const sizeRows = db.prepare(
      'SELECT team_id, COUNT(*) AS size FROM users WHERE is_admin = 0 AND team_id IS NOT NULL GROUP BY team_id'
    ).all()
    const sizes = Object.fromEntries(teams.map(t => [t.id, 0]))
    for (const r of sizeRows) sizes[r.team_id] = r.size

    const assignUser = db.prepare('UPDATE users SET team_id = ? WHERE id = ?')
    for (const { id } of unassigned) {
      // Greedy: always assign to the team with the fewest members
      const [minId] = Object.entries(sizes).sort((a, b) => a[1] - b[1])[0]
      assignUser.run(parseInt(minId), id)
      sizes[minId]++
    }
  }

  // 2. Assign starting moons to every team (fills up to the 2-moon cap)
  for (const { id } of teams) ensureActiveClues(id)

  res.json({ ok: true })
})

router.post('/reset', requireAdmin, (req, res) => {
  db.transaction(() => {
    db.prepare('DELETE FROM moon_finds').run()
    db.prepare('DELETE FROM active_clues').run()
    db.prepare('UPDATE clues SET solved = 0, solved_by_team = NULL, solved_at = NULL').run()
    db.prepare('UPDATE users SET team_id = NULL WHERE is_admin = 0').run()

    const teams = db.prepare('SELECT id FROM teams ORDER BY id').all()
    const updateTeam = db.prepare('UPDATE teams SET name = ?, name_locked = 0 WHERE id = ?')
    teams.forEach(({ id }, i) => updateTeam.run(`Team ${i + 1}`, id))
  })()

  res.json({ ok: true })
})

export default router
