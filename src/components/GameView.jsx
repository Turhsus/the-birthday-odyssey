import { useApp } from '../state/AppContext'
import TopNav from './TopNav'
import BottomNav from './BottomNav'
import ClueCard from './ClueCard'

export default function GameView() {
  const { user, team, clues, leaderboard } = useApp()

  // SQLite returns 1/0; treat 1 as truthy
  const activeClues = clues.filter(c => c.is_active)
  const foundClues  = clues.filter(c => !c.is_active && c.found_by_my_team)
  const rank        = leaderboard.findIndex(l => l.team === team) + 1

  return (
    <div className="view">
      <TopNav />
      <div style={{ padding: '1.25rem' }}>
        <div className="game-header">
          <div className="game-title">Active Missions</div>
          <div className="game-subtitle">Welcome, {user}! Your team: {team}</div>
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
