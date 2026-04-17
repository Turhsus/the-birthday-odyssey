import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

function ensureActiveClues(teamId) {
  if (!teamId) return
  // Count active clues this team hasn't solved yet
  const { count } = db.prepare(`
    SELECT COUNT(*) AS count FROM active_clues ac
    WHERE ac.clue_id NOT IN (SELECT clue_id FROM moon_finds WHERE team_id = ?)
  `).get(teamId)

  if (count === 0) {
    const candidates = db.prepare(`
      SELECT id FROM clues
      WHERE solved = 0 AND id NOT IN (SELECT clue_id FROM active_clues)
      ORDER BY id LIMIT 2
    `).all()
    const ins = db.prepare('INSERT OR IGNORE INTO active_clues (clue_id) VALUES (?)')
    for (const { id } of candidates) ins.run(id)
  }
}

// Player: active clues + clues found by my team — PIN intentionally omitted
router.get('/', requireAuth, (req, res) => {
  const { teamId } = req.user
  ensureActiveClues(teamId)
  const clues = db.prepare(`
    SELECT
      c.id, c.text, c.solved, c.solved_by_team,
      (mf.id IS NOT NULL)      AS found_by_my_team,
      (ac.clue_id IS NOT NULL) AS is_active
    FROM clues c
    LEFT JOIN moon_finds   mf ON mf.clue_id = c.id AND mf.team_id = ?
    LEFT JOIN active_clues ac ON ac.clue_id = c.id
    WHERE ac.clue_id IS NOT NULL OR mf.id IS NOT NULL
    ORDER BY c.id
  `).all(teamId ?? -1)
  res.json({ clues })
})

// Admin: all clues with PIN
router.get('/all', requireAdmin, (req, res) => {
  const clues = db.prepare(`
    SELECT c.*, (ac.clue_id IS NOT NULL) AS is_active
    FROM clues c
    LEFT JOIN active_clues ac ON ac.clue_id = c.id
    ORDER BY c.id
  `).all()
  res.json({ clues })
})

// Player: submit a PIN — validates, records find, rotates active pool (all in one transaction)
router.post('/:id/submit', requireAuth, (req, res) => {
  const clueId = parseInt(req.params.id)
  const { pin } = req.body
  const { id: userId } = req.user

  if (!req.user.teamId) return res.status(400).json({ error: 'You must be on a team to submit PINs.' })

  const clue = db.prepare('SELECT * FROM clues WHERE id = ?').get(clueId)
  if (!clue) return res.status(404).json({ error: 'Clue not found' })

  const isActive = db.prepare('SELECT 1 FROM active_clues WHERE clue_id = ?').get(clueId)
  if (!isActive) return res.status(400).json({ error: 'This clue is no longer active.' })

  if (pin !== clue.pin) return res.json({ correct: false })

  const { teamId, teamName } = req.user
  db.transaction(() => {
    db.prepare("UPDATE clues SET solved = 1, solved_by_team = ?, solved_at = datetime('now') WHERE id = ?")
      .run(teamName, clueId)
    db.prepare('INSERT INTO moon_finds (clue_id, user_id, team_id, team_name) VALUES (?, ?, ?, ?)')
      .run(clueId, userId, teamId, teamName)
    db.prepare('DELETE FROM active_clues WHERE clue_id = ?').run(clueId)
    // Promote the next unsolved, inactive clue into the active pool
    const next = db.prepare(`
      SELECT id FROM clues
      WHERE solved = 0 AND id NOT IN (SELECT clue_id FROM active_clues)
      ORDER BY id LIMIT 1
    `).get()
    if (next) db.prepare('INSERT INTO active_clues (clue_id) VALUES (?)').run(next.id)
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
  if (!changes) return res.status(404).json({ error: 'Clue not found' })
  res.json({ ok: true })
})

// Admin: delete clue
router.delete('/:id', requireAdmin, (req, res) => {
  const { changes } = db.prepare('DELETE FROM clues WHERE id = ?').run(parseInt(req.params.id))
  if (!changes) return res.status(404).json({ error: 'Clue not found' })
  res.json({ ok: true })
})

export default router
