import { useApp } from '../state/AppContext'
import TopNav from './TopNav'

export default function AdminView() {
  const { clues, users, leaderboard, openEdit, openAddClue, deleteClue, removeUser } = useApp()

  const totalMoons = clues.length
  const claimed    = clues.filter(c => c.solved).length
  const teams      = leaderboard.length

  async function handleDelete(id) {
    if (window.confirm('Remove this moon from the hunt?')) {
      try { await deleteClue(id) } catch (e) { alert(e.message) }
    }
  }

  async function handleRemoveUser(id, name) {
    if (window.confirm(`Remove hunter ${name}?`)) {
      try { await removeUser(id) } catch (e) { alert(e.message) }
    }
  }

  return (
    <div className="view">
      <TopNav showTeam={false} />
      <div style={{ padding: '1.25rem' }}>
        <div className="game-header">
          <div className="game-title" style={{ color: 'var(--accent-pink)' }}>Mission Control</div>
          <div className="game-subtitle">Manage clues, moons, and hunters</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-num" style={{ color: 'var(--accent-teal)' }}>{totalMoons}</div>
            <div className="stat-label">Total Moons</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: 'var(--accent-pink)' }}>{claimed}</div>
            <div className="stat-label">Claimed</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{teams}</div>
            <div className="stat-label">Teams</div>
          </div>
        </div>

        <div className="admin-grid">
          <div className="admin-panel" style={{ gridColumn: '1/-1' }}>
            <div className="admin-panel-title">🗺 Clue Management</div>
            {clues.map(c => (
              <div className="clue-list-item" key={c.id}>
                <div>
                  <div className="clue-edit-text">{c.text}</div>
                  <div className="clue-meta">
                    PIN: {c.pin} · {c.solved ? `✓ Claimed by ${c.solved_by_team}` : c.is_active ? '🟢 Active' : 'Queued'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="icon-btn" onClick={() => openEdit(c.id)}>Edit</button>
                  <button className="icon-btn danger" onClick={() => handleDelete(c.id)}>Del</button>
                </div>
              </div>
            ))}
            <button className="submit-btn" style={{ marginTop: 12, width: '100%', textAlign: 'center' }} onClick={openAddClue}>
              + Add New Clue
            </button>
          </div>

          <div className="admin-panel" style={{ gridColumn: '1/-1' }}>
            <div className="admin-panel-title">👾 Registered Hunters</div>
            {users.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hunters yet.</div>
            )}
            {users.map(u => (
              <div className="user-row" key={u.id}>
                <div className="user-avatar">{u.username.slice(0, 2).toUpperCase()}</div>
                <div className="user-info">
                  <div className="user-name">{u.username}</div>
                  <div className="user-team">{u.team_name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="pill pill-gold">{u.moons} 🌕</span>
                  <button className="icon-btn danger" onClick={() => handleRemoveUser(u.id, u.username)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
