import { Router } from 'express'
import { db } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/reset', requireAdmin, (req, res) => {
  db.transaction(() => {
    // Clear all game progress
    db.prepare('DELETE FROM moon_finds').run()
    db.prepare('DELETE FROM active_clues').run()

    // Reset all clues to unsolved (keep text/pin/location)
    db.prepare('UPDATE clues SET solved = 0, solved_by_team = NULL, solved_at = NULL').run()

    // Unassign all players from teams
    db.prepare('UPDATE users SET team_id = NULL WHERE is_admin = 0').run()

    // Rename teams to Team 1, Team 2, ... and unlock names
    const teams = db.prepare('SELECT id FROM teams ORDER BY id').all()
    const updateTeam = db.prepare('UPDATE teams SET name = ?, name_locked = 0 WHERE id = ?')
    teams.forEach(({ id }, i) => updateTeam.run(`Team ${i + 1}`, id))

    // Re-seed first 3 clues as active
    const first3 = db.prepare('SELECT id FROM clues ORDER BY id LIMIT 2').all()
    const insertActive = db.prepare('INSERT INTO active_clues (clue_id) VALUES (?)')
    for (const { id } of first3) insertActive.run(id)
  })()

  res.json({ ok: true })
})

export default router
