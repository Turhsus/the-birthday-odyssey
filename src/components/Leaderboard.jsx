import { useState } from 'react'
import { useApp } from '../state/AppContext'
import TopNav from './TopNav'
import BottomNav from './BottomNav'

const RANK_CLASSES = ['gold', 'silver', 'bronze']
const RANK_ICONS   = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const { leaderboard, gameOver } = useApp()
  const [expanded, setExpanded] = useState(null)

  function toggle(teamId) {
    setExpanded(prev => prev === teamId ? null : teamId)
  }

  return (
    <div className="view">
      <TopNav />
      <div style={{ padding: '1.25rem' }}>
        <div className="game-header">
          <div className="game-title">{gameOver ? '🏆 Final Standings' : 'Leaderboard'}</div>
          <div className="game-subtitle">{gameOver ? 'The hunt is over — here are the results!' : 'Top moon hunters this season'}</div>
        </div>
        <div>
          {leaderboard.map((t, i) => (
            <div key={t.team_id ?? t.team} className={`lb-card${expanded === t.team_id ? ' open' : ''}`}>
              <div className="lb-row lb-row-clickable" onClick={() => toggle(t.team_id)}>
                <div className={`lb-rank ${RANK_CLASSES[i] || ''}`}>
                  {i < 3 ? RANK_ICONS[i] : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="lb-name">{t.team || <em style={{ color: 'var(--text-muted)' }}>Unnamed</em>}</div>
                  <div className="lb-moons">{t.members} hunter{t.members !== 1 ? 's' : ''}</div>
                </div>
                <div className="lb-score">{t.moons} 🌕</div>
                <div className="lb-chevron" style={{ transform: expanded === t.team_id ? 'rotate(180deg)' : 'none' }}>▾</div>
              </div>
              {expanded === t.team_id && (
                <div className="lb-members">
                  {t.members_list && t.members_list.length > 0
                    ? t.members_list.map(name => (
                        <div key={name} className="lb-member-chip">👤 {name}</div>
                      ))
                    : <div className="lb-member-empty">No players assigned</div>
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <BottomNav activeTab="board" />
    </div>
  )
}
