import { useApp } from '../state/AppContext'
import TopNav from './TopNav'
import BottomNav from './BottomNav'

const RANK_CLASSES = ['gold', 'silver', 'bronze']
const RANK_ICONS = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const { leaderboard, gameOver } = useApp()

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
            <div className="lb-row" key={t.team}>
              <div className={`lb-rank ${RANK_CLASSES[i] || ''}`}>
                {i < 3 ? RANK_ICONS[i] : i + 1}
              </div>
              <div>
                <div className="lb-name">{t.team}</div>
                <div className="lb-moons">{t.members} hunter{t.members !== 1 ? 's' : ''}</div>
              </div>
              <div className="lb-score">{t.moons} 🌕</div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav activeTab="board" />
    </div>
  )
}
