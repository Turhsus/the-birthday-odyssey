import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { api } from '../api'
import TopNav from './TopNav'

export default function AdminView() {
  const { clues, users, teams, leaderboard, openEdit, openAddClue, deleteClue, removeUser, fetchAdminData } = useApp()

  // Password change
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [pwMsg, setPwMsg]         = useState(null)
  const [pwBusy, setPwBusy]       = useState(false)

  // Team creation
  const [newTeamName, setNewTeamName] = useState('')

  // Team renaming (admin)
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [teamDraft, setTeamDraft]         = useState('')

  // User → team assignment
  const [assigningUserId, setAssigningUserId] = useState(null)

  const totalMoons = clues.length
  const claimed    = clues.filter(c => c.solved).length

  async function handleResetGame() {
    if (!window.confirm('Reset the entire game?\n\n• All moon finds cleared\n• All clues queued (not deleted)\n• All players unassigned from teams\n• Team names reset to Team 1, Team 2, …\n\nThis cannot be undone.')) return
    try {
      await api.resetGame()
      fetchAdminData()
    } catch (e) { alert(e.message) }
  }

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

  async function handleChangePassword() {
    setPwBusy(true); setPwMsg(null)
    try {
      await api.changePassword(currentPw, newPw)
      setPwMsg({ ok: true, text: 'Password updated!' })
      setCurrentPw(''); setNewPw('')
    } catch (e) {
      setPwMsg({ ok: false, text: e.message })
    } finally { setPwBusy(false) }
  }

  async function handleCreateTeam() {
    try {
      await api.createTeam(newTeamName)
      setNewTeamName('')
      fetchAdminData()
    } catch (e) { alert(e.message) }
  }

  async function handleRenameTeam(id) {
    try {
      await api.renameTeam(id, teamDraft)
      setEditingTeamId(null); setTeamDraft('')
      fetchAdminData()
    } catch (e) { alert(e.message) }
  }

  async function handleDeleteTeam(id, name) {
    if (window.confirm(`Delete team "${name || 'Unnamed'}"? Members will be unassigned.`)) {
      try { await api.deleteTeam(id); fetchAdminData() } catch (e) { alert(e.message) }
    }
  }

  async function handleAssignTeam(userId, teamId) {
    try {
      await api.assignUserTeam(userId, teamId || null)
      setAssigningUserId(null)
      fetchAdminData()
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="view">
      <TopNav showTeam={false} />
      <div style={{ padding: '1.25rem' }}>
        <div className="game-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="game-title" style={{ color: 'var(--accent-pink)' }}>Mission Control</div>
            <div className="game-subtitle">Manage clues, moons, and hunters</div>
          </div>
          <button className="icon-btn danger" style={{ marginTop: 4 }} onClick={handleResetGame}>
            ↺ Reset Game
          </button>
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
            <div className="stat-num">{teams.length}</div>
            <div className="stat-label">Teams</div>
          </div>
        </div>

        <div className="admin-grid">
          {/* Clue management */}
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

          {/* Team management */}
          <div className="admin-panel" style={{ gridColumn: '1/-1' }}>
            <div className="admin-panel-title">🏁 Teams</div>
            {teams.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>No teams yet.</div>
            )}
            {teams.map(t => (
              <div className="clue-list-item" key={t.id}>
                <div>
                  {editingTeamId === t.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input className="form-input" style={{ padding: '2px 6px', fontSize: 13, height: 'auto' }}
                        value={teamDraft} onChange={e => setTeamDraft(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRenameTeam(t.id)} autoFocus />
                      <button className="icon-btn" onClick={() => handleRenameTeam(t.id)}>Save</button>
                      <button className="icon-btn" onClick={() => setEditingTeamId(null)}>✕</button>
                    </div>
                  ) : (
                    <div className="clue-edit-text">{t.name || <em style={{ color: 'var(--text-muted)' }}>Unnamed</em>}</div>
                  )}
                  <div className="clue-meta">
                    {t.member_count} member{t.member_count !== 1 ? 's' : ''} · {t.name_locked ? '🔒 Name locked' : 'Name unlocked'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="icon-btn" onClick={() => { setEditingTeamId(t.id); setTeamDraft(t.name || '') }}>Rename</button>
                  <button className="icon-btn danger" onClick={() => handleDeleteTeam(t.id, t.name)}>Del</button>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <input className="form-input" style={{ flex: 1 }} value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
                placeholder="New team name (optional)" />
              <button className="submit-btn" onClick={handleCreateTeam}>+ Add Team</button>
            </div>
          </div>

          {/* Hunter management */}
          <div className="admin-panel" style={{ gridColumn: '1/-1' }}>
            <div className="admin-panel-title">👾 Registered Hunters</div>
            {users.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No hunters yet.</div>
            )}
            {users.map(u => (
              <div className="user-row" key={u.id}>
                <div className="user-avatar">{u.username.slice(0, 2).toUpperCase()}</div>
                <div className="user-info" style={{ flex: 1 }}>
                  <div className="user-name">{u.username}</div>
                  {assigningUserId === u.id ? (
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      <select className="form-input" style={{ padding: '2px 6px', fontSize: 12, height: 'auto' }}
                        defaultValue={u.team_id ?? ''}
                        onChange={e => handleAssignTeam(u.id, e.target.value ? parseInt(e.target.value) : null)}>
                        <option value="">— No team —</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name || `Team #${t.id}`}</option>)}
                      </select>
                      <button className="icon-btn" onClick={() => setAssigningUserId(null)}>✕</button>
                    </div>
                  ) : (
                    <div className="user-team" style={{ cursor: 'pointer' }} onClick={() => setAssigningUserId(u.id)}>
                      {u.team_name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No team — click to assign</span>}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="pill pill-gold">{u.moons} 🌕</span>
                  <button className="icon-btn danger" onClick={() => handleRemoveUser(u.id, u.username)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Change admin password */}
          <div className="admin-panel" style={{ gridColumn: '1/-1' }}>
            <div className="admin-panel-title">🔑 Change Admin Password</div>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={currentPw}
                onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={newPw}
                onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
            </div>
            {pwMsg && <div className={`pin-feedback ${pwMsg.ok ? 'ok' : 'err'}`}>{pwMsg.text}</div>}
            <button className="submit-btn" style={{ marginTop: 8, width: '100%' }}
              onClick={handleChangePassword} disabled={pwBusy}>
              {pwBusy ? '…' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
