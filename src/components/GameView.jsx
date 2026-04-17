import { useState } from 'react'
import { useApp } from '../state/AppContext'
import TopNav from './TopNav'
import BottomNav from './BottomNav'
import ClueCard from './ClueCard'

export default function GameView() {
  const { user, team, teamId, teamNameLocked, clues, leaderboard, renameTeam } = useApp()
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft]       = useState('')
  const [renameErr, setRenameErr] = useState('')

  const activeClues = clues.filter(c => c.is_active)
  const foundClues  = clues.filter(c => !c.is_active && c.found_by_my_team)
  const rank        = leaderboard.findIndex(l => l.team_id === teamId || l.team === team) + 1

  async function handleRename() {
    if (!draft.trim()) { setRenameErr('Name cannot be empty.'); return }
    try {
      await renameTeam(draft.trim())
      setRenaming(false); setDraft(''); setRenameErr('')
    } catch (e) { setRenameErr(e.message) }
  }

  return (
    <div className="view">
      <TopNav />
      <div style={{ padding: '1.25rem' }}>
        <div className="game-header">
          <div className="game-title">Active Missions</div>
          <div className="game-subtitle">
            Welcome, {user}!{' '}
            {teamId ? (
              renaming ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <input
                    className="pin-input"
                    style={{ width: 120, padding: '2px 6px', fontSize: 13 }}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRename()}
                    autoFocus
                    placeholder="Team name"
                  />
                  <button className="icon-btn" onClick={handleRename}>Save</button>
                  <button className="icon-btn" onClick={() => { setRenaming(false); setRenameErr('') }}>✕</button>
                </span>
              ) : (
                <span>
                  Team: {team || <em style={{ color: 'var(--text-muted)' }}>Unnamed</em>}
                  {!teamNameLocked && (
                    <button
                      className="icon-btn"
                      style={{ marginLeft: 6, fontSize: 11 }}
                      onClick={() => { setDraft(team || ''); setRenaming(true) }}
                    >
                      Rename
                    </button>
                  )}
                </span>
              )
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>No team assigned yet</span>
            )}
          </div>
          {renameErr && <div className="pin-feedback err" style={{ marginTop: 4 }}>{renameErr}</div>}
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{foundClues.length}</div>
            <div className="stat-label">Found</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{activeClues.length}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">#{rank || '–'}</div>
            <div className="stat-label">Rank</div>
          </div>
        </div>

        <div className="clues-section">
          <div className="section-title">Your Clues</div>
          {activeClues.length === 0 && foundClues.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              No active clues right now. Check back soon!
            </div>
          ) : (
            <>
              {activeClues.map(c => <ClueCard key={c.id} clue={c} />)}
              {foundClues.map(c  => <ClueCard key={c.id} clue={c} />)}
            </>
          )}
        </div>
      </div>
      <BottomNav activeTab="hunt" />
    </div>
  )
}
