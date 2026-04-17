import { db } from './db.js'

export function ensureActiveClues(teamId) {
  if (!teamId) return
  // Only count unsolved active clues — claimed ones don't hold a slot
  const { count } = db.prepare(`
    SELECT COUNT(*) AS count FROM active_clues ac
    JOIN clues c ON c.id = ac.clue_id
    WHERE ac.team_id = ? AND c.solved = 0
  `).get(teamId)

  const needed = 2 - count
  if (needed <= 0) return

  const candidates = db.prepare(`
    SELECT id FROM clues
    WHERE id NOT IN (SELECT clue_id FROM active_clues WHERE team_id = ?)
    AND   id NOT IN (SELECT clue_id FROM moon_finds   WHERE team_id = ?)
    ORDER BY RANDOM()
    LIMIT ?
  `).all(teamId, teamId, needed)

  const ins = db.prepare('INSERT OR IGNORE INTO active_clues (team_id, clue_id) VALUES (?, ?)')
  for (const { id } of candidates) ins.run(teamId, id)
}
