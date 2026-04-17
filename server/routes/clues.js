import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { ensureActiveClues } from '../utils.js'

const router = Router()

// Player: clues active for my team + clues my team has found — PIN intentionally omitted
router.get('/', requireAuth, (req, res) => {
  const { teamId } = req.user
  // Moons are not assigned here — use Start Game to assign initial clues
  const clues = db.prepare(`
    SELECT
      c.id, c.text, c.solved,
      (mf.id       IS NOT NULL) AS found_by_my_team,
      (ac.team_id  IS NOT NULL) AS is_active
    FROM clues c
    LEFT JOIN moon_finds   mf ON mf.clue_id = c.id AND mf.team_id = ?
    LEFT JOIN active_clues ac ON ac.clue_id = c.id AND ac.team_id = ?
    WHERE ac.team_id IS NOT NULL OR mf.id IS NOT NULL
    ORDER BY c.id
  `).all(teamId ?? -1, teamId ?? -1)

  const { total } = db.prepare('SELECT COUNT(*) AS total FROM clues').get()
  const { solved } = db.prepare('SELECT COUNT(*) AS solved FROM clues WHERE solved = 1').get()
  const gameOver = total > 0 && solved === total

  res.json({ clues, gameOver })
})

// Admin: all clues with PIN + how many teams have each one active
router.get('/all', requireAdmin, (req, res) => {
  const clues = db.prepare(`
    SELECT c.*, COUNT(ac.team_id) AS active_count
    FROM clues c
    LEFT JOIN active_clues ac ON ac.clue_id = c.id
    GROUP BY c.id
    ORDER BY c.id
  `).all()
  res.json({ clues })
})

// Player: submit a PIN
router.post('/:id/submit', requireAuth, (req, res) => {
  const clueId   = parseInt(req.params.id)
  const { pin }  = req.body
  const { id: userId, teamId, teamName } = req.user

  if (!teamId) return res.status(400).json({ error: 'You must be on a team to submit PINs.' })

  const clue = db.prepare('SELECT * FROM clues WHERE id = ?').get(clueId)
  if (!clue) return res.status(404).json({ error: 'Clue not found.' })

  const isActive = db.prepare('SELECT 1 FROM active_clues WHERE team_id = ? AND clue_id = ?').get(teamId, clueId)
  if (!isActive) return res.status(400).json({ error: 'This clue is not active for your team.' })
  if (clue.solved)  return res.json({ correct: false, claimed: true })

  if (pin !== clue.pin) return res.json({ correct: false })

  // Find all other teams that have this clue active before we claim it
  const affectedTeams = db.prepare('SELECT team_id FROM active_clues WHERE clue_id = ? AND team_id != ?')
    .all(clueId, teamId).map(r => r.team_id)

  db.transaction(() => {
    db.prepare('DELETE FROM active_clues WHERE team_id = ? AND clue_id = ?').run(teamId, clueId)
    db.prepare('INSERT INTO moon_finds (clue_id, user_id, team_id, team_name) VALUES (?, ?, ?, ?)').run(clueId, userId, teamId, teamName)
    if (!clue.solved) {
      db.prepare("UPDATE clues SET solved = 1, solved_by_team = ?, solved_at = datetime('now') WHERE id = ?").run(teamName, clueId)
    }
    ensureActiveClues(teamId)
    for (const otherTeamId of affectedTeams) ensureActiveClues(otherTeamId)
  })()

  res.json({ correct: true })
})

// Admin: create clue
router.post('/', requireAdmin, (req, res) => {
  const { text, pin, location } = req.body
  if (!text || !pin || pin.length !== 4) {
    return res.status(400).json({ error: 'text and a 4-digit pin are required.' })
  }
  const { lastInsertRowid } = db.prepare('INSERT INTO clues (text, pin, location) VALUES (?, ?, ?)')
    .run(text, pin, location || '')
  res.status(201).json({ id: lastInsertRowid })
})

// Admin: update clue
router.put('/:id', requireAdmin, (req, res) => {
  const { text, pin, location } = req.body
  const { changes } = db.prepare('UPDATE clues SET text = ?, pin = ?, location = ? WHERE id = ?')
    .run(text, pin, location || '', parseInt(req.params.id))
  if (!changes) return res.status(404).json({ error: 'Clue not found.' })
  res.json({ ok: true })
})

// Admin: delete clue
router.delete('/:id', requireAdmin, (req, res) => {
  const { changes } = db.prepare('DELETE FROM clues WHERE id = ?').run(parseInt(req.params.id))
  if (!changes) return res.status(404).json({ error: 'Clue not found.' })
  res.json({ ok: true })
})

export default router
