import { useApp } from '../state/AppContext'

export default function TopNav({ showTeam = true }) {
  const { team, isAdmin, logout } = useApp()

  return (
    <div className="top-nav">
      <div className="logo">
        Moon<span>Hunt</span>
        {isAdmin && (
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-pink)', fontFamily: "'Nunito', sans-serif", fontWeight: 700, marginLeft: 6 }}>
            ADMIN
          </span>
        )}
      </div>
      <div className="nav-right">
        {showTeam && team && <div className="team-badge">{team}</div>}
        <button className="nav-btn" onClick={logout}>Exit</button>
      </div>
    </div>
  )
}
