import { useState } from 'react'
import { useApp } from '../state/AppContext'

export default function Login() {
  const { login, loginAdmin } = useApp()
  const [tab, setTab] = useState('player')
  const [username, setUsername] = useState('')
  const [teamName, setTeamName] = useState('')
  const [password, setPassword] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [error, setError] = useState('')

  function handleLogin() {
    if (tab === 'admin') {
      if (adminPass !== 'admin123') {
        setError('Invalid admin password. (Hint: admin123)')
        return
      }
      loginAdmin()
    } else {
      if (!username || !teamName) {
        setError('Please enter username and team name.')
        return
      }
      login(username, teamName)
    }
    setError('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="view">
      <div className="login-wrap">
        <div className="login-moon-icon">🌕</div>
        <div className="login-title">Moon Hunt</div>
        <div className="login-sub">Find the moons. Claim the glory.</div>
        <div className="login-card">
          <div className="login-tabs">
            <button className={`tab-btn ${tab === 'player' ? 'active' : ''}`} onClick={() => setTab('player')}>
              Player
            </button>
            <button className={`tab-btn ${tab === 'admin' ? 'active' : ''}`} onClick={() => setTab('admin')}>
              Admin
            </button>
          </div>

          {tab === 'player' ? (
            <>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. StarHunter42"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input
                  className="form-input"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. The Moonwalkers"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">Admin Password</label>
              <input
                className="form-input"
                type="password"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
              />
            </div>
          )}

          <button className="btn-primary" onClick={handleLogin}>Launch Mission 🚀</button>
          {error && <div className="error-msg">{error}</div>}
        </div>
      </div>
    </div>
  )
}
