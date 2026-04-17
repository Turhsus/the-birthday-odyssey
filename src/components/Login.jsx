import { useState } from 'react'
import { useApp } from '../state/AppContext'

export default function Login() {
  const { play, loginAdmin } = useApp()
  const [tab, setTab]           = useState('player')
  const [mode, setMode]         = useState('login')  // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [teamName, setTeamName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  function switchTab(t) { setTab(t); setError('') }
  function switchMode(m) { setMode(m); setError(''); setPassword(''); setConfirmPw('') }

  async function handleSubmit() {
    setError('')
    if (tab === 'admin') {
      setLoading(true)
      try { await loginAdmin(adminPass) }
      catch (e) { setError(e.message) }
      finally { setLoading(false) }
      return
    }

    if (!username) { setError('Username is required.'); return }
    if (!password) { setError('Password is required.'); return }
    if (mode === 'register' && password !== confirmPw) {
      setError('Passwords do not match.'); return
    }

    setLoading(true)
    try { await play(username, password, mode === 'register') }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="view">
      <div className="login-wrap">
        <div className="login-moon-icon">🌕</div>
        <div className="login-title">Moon Hunt</div>
        <div className="login-sub">Find the moons. Claim the glory.</div>
        <div className="login-card">
          <div className="login-tabs">
            <button className={`tab-btn ${tab === 'player' ? 'active' : ''}`} onClick={() => switchTab('player')}>Player</button>
            <button className={`tab-btn ${tab === 'admin'  ? 'active' : ''}`} onClick={() => switchTab('admin')}>Admin</button>
          </div>

          {tab === 'player' ? (
            <>
              <div className="login-tabs" style={{ marginBottom: '1rem' }}>
                <button className={`tab-btn ${mode === 'login'    ? 'active' : ''}`} onClick={() => switchMode('login')}>Log In</button>
                <button className={`tab-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>Register</button>
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" value={username} onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="e.g. StarHunter42" />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="••••••••" />
              </div>

              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input className="form-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="••••••••" />
                </div>
              )}
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">Admin Password</label>
              <input className="form-input" type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="••••••••" />
            </div>
          )}

          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Launching…' : tab === 'admin' ? 'Launch Mission 🚀' : mode === 'register' ? 'Create Account 🚀' : 'Launch Mission 🚀'}
          </button>
          {error && <div className="error-msg">{error}</div>}
        </div>
      </div>
    </div>
  )
}
