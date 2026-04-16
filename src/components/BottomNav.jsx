import { useApp } from '../state/AppContext'

export default function BottomNav({ activeTab }) {
  const { setCurrentView } = useApp()

  return (
    <div className="bottom-nav">
      <button
        className={`bnav-btn ${activeTab === 'hunt' ? 'active' : ''}`}
        onClick={() => setCurrentView('game')}
      >
        <span className="icon">🌕</span>Hunt
      </button>
      <button
        className={`bnav-btn ${activeTab === 'board' ? 'active' : ''}`}
        onClick={() => setCurrentView('board')}
      >
        <span className="icon">🏆</span>Board
      </button>
    </div>
  )
}
