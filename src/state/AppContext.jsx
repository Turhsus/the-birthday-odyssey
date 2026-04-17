import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentView, setCurrentViewRaw] = useState('login')
  const [user, setUser]                 = useState(null)
  const [team, setTeam]                 = useState(null)
  const [teamId, setTeamId]             = useState(null)
  const [teamNameLocked, setTeamNameLocked] = useState(false)
  const [isAdmin, setIsAdmin]           = useState(false)
  const [clues, setClues]               = useState([])
  const [users, setUsers]               = useState([])
  const [teams, setTeams]               = useState([])
  const [leaderboard, setLeaderboard]   = useState([])
  const [editingId, setEditingId]       = useState(null)
  const [isModalOpen, setIsModalOpen]   = useState(false)

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('moonhunt_session')
    if (!saved) return
    try {
      const s = JSON.parse(saved)
      if (s.isAdmin) {
        setIsAdmin(true)
        setCurrentViewRaw('admin')
      } else if (s.username) {
        setUser(s.username)
        setTeam(s.teamName)
        setTeamId(s.teamId)
        setTeamNameLocked(!!s.nameLocked)
        setCurrentViewRaw('game')
      }
    } catch {}
  }, [])

  // ── Data fetchers ──────────────────────────────────────────────────────────

  const clearSession = useCallback(() => {
    localStorage.removeItem('moonhunt_token')
    localStorage.removeItem('moonhunt_session')
    setUser(null); setTeam(null); setTeamId(null); setTeamNameLocked(false)
    setIsAdmin(false)
    setClues([]); setUsers([]); setTeams([]); setLeaderboard([])
    setCurrentViewRaw('login')
  }, [])

  const fetchPlayerData = useCallback(async () => {
    try {
      const [cd, lb] = await Promise.all([api.getClues(), api.getLeaderboard()])
      setClues(cd.clues)
      setLeaderboard(lb.leaderboard)
    } catch (e) {
      if (e.message.includes('Unauthorized') || e.message.includes('Token')) clearSession()
    }
  }, [clearSession])

  const fetchAdminData = useCallback(async () => {
    try {
      const [cd, ud, td, lb] = await Promise.all([api.getAllClues(), api.getUsers(), api.getTeams(), api.getLeaderboard()])
      setClues(cd.clues)
      setUsers(ud.users)
      setTeams(td.teams)
      setLeaderboard(lb.leaderboard)
    } catch (e) {
      if (e.message.includes('Unauthorized') || e.message.includes('Token')) clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    if (currentView === 'game' || currentView === 'board') {
      fetchPlayerData()
      const id = setInterval(fetchPlayerData, 10000)
      return () => clearInterval(id)
    } else if (currentView === 'admin') {
      fetchAdminData()
      const id = setInterval(fetchAdminData, 10000)
      return () => clearInterval(id)
    }
  }, [currentView, fetchPlayerData, fetchAdminData])

  // ── Auth actions ───────────────────────────────────────────────────────────

  const play = useCallback(async (username, password, isRegister = false) => {
    const data = await (isRegister ? api.register(username, password) : api.login(username, password))
    localStorage.setItem('moonhunt_token', data.token)
    localStorage.setItem('moonhunt_session', JSON.stringify({ username: data.username, teamName: data.teamName, teamId: data.teamId, nameLocked: data.nameLocked }))
    setUser(data.username)
    setTeam(data.teamName)
    setTeamId(data.teamId)
    setTeamNameLocked(!!data.nameLocked)
    setIsAdmin(false)
    setCurrentViewRaw('game')
  }, [])

  const loginAdmin = useCallback(async (password) => {
    const data = await api.loginAdmin(password)
    localStorage.setItem('moonhunt_token', data.token)
    localStorage.setItem('moonhunt_session', JSON.stringify({ isAdmin: true }))
    setIsAdmin(true)
    setCurrentViewRaw('admin')
  }, [])

  const logout = useCallback(() => clearSession(), [clearSession])
  const setCurrentView = useCallback((view) => setCurrentViewRaw(view), [])

  // ── Game actions ───────────────────────────────────────────────────────────

  const submitPin = useCallback(async (clueId, pin) => {
    const data = await api.submitPin(clueId, pin)
    if (data.correct) fetchPlayerData()
    return data
  }, [fetchPlayerData])

  const renameTeam = useCallback(async (name) => {
    const data = await api.renameTeam(teamId, name)
    localStorage.setItem('moonhunt_token', data.token)
    const session = JSON.parse(localStorage.getItem('moonhunt_session') || '{}')
    localStorage.setItem('moonhunt_session', JSON.stringify({ ...session, teamName: data.name, nameLocked: true }))
    setTeam(data.name)
    setTeamNameLocked(true)
  }, [teamId])

  // ── Admin actions ──────────────────────────────────────────────────────────

  const openEdit    = useCallback((id) => { setEditingId(id); setIsModalOpen(true) }, [])
  const openAddClue = useCallback(() => { setEditingId(null); setIsModalOpen(true) }, [])
  const closeModal  = useCallback(() => { setIsModalOpen(false); setEditingId(null) }, [])

  const saveClue = useCallback(async (text, pin, location) => {
    if (editingId) await api.updateClue(editingId, text, pin, location)
    else           await api.createClue(text, pin, location)
    closeModal()
    fetchAdminData()
  }, [editingId, closeModal, fetchAdminData])

  const deleteClue = useCallback(async (id) => {
    await api.deleteClue(id)
    setClues(prev => prev.filter(c => c.id !== id))
  }, [])

  const removeUser = useCallback(async (id) => {
    await api.removeUser(id)
    setUsers(prev => prev.filter(u => u.id !== id))
  }, [])

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      user, team, teamId, teamNameLocked, isAdmin,
      clues, users, teams, leaderboard,
      editingId, isModalOpen,
      play, loginAdmin, logout,
      submitPin, renameTeam,
      openEdit, openAddClue, closeModal, saveClue,
      deleteClue, removeUser, fetchAdminData,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
