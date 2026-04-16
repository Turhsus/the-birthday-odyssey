import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentView, setCurrentViewRaw] = useState('login')
  const [user, setUser]       = useState(null)
  const [team, setTeam]       = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [clues, setClues]             = useState([])
  const [users, setUsers]             = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [editingId, setEditingId]     = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('moonhunt_session')
    if (!saved) return
    try {
      const s = JSON.parse(saved)
      if (s.isAdmin) {
        setIsAdmin(true)
        setCurrentViewRaw('admin')
      } else if (s.username && s.teamName) {
        setUser(s.username)
        setTeam(s.teamName)
        setCurrentViewRaw('game')
      }
    } catch {}
  }, [])

  // ── Data fetchers ──────────────────────────────────────────────────────────

  const clearSession = useCallback(() => {
    localStorage.removeItem('moonhunt_token')
    localStorage.removeItem('moonhunt_session')
    setUser(null); setTeam(null); setIsAdmin(false)
    setClues([]); setUsers([]); setLeaderboard([])
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
      const [cd, ud, lb] = await Promise.all([api.getAllClues(), api.getUsers(), api.getLeaderboard()])
      setClues(cd.clues)
      setUsers(ud.users)
      setLeaderboard(lb.leaderboard)
    } catch (e) {
      if (e.message.includes('Unauthorized') || e.message.includes('Token')) clearSession()
    }
  }, [clearSession])

  // Re-fetch whenever the active view changes
  useEffect(() => {
    if (currentView === 'game' || currentView === 'board') fetchPlayerData()
    else if (currentView === 'admin') fetchAdminData()
  }, [currentView, fetchPlayerData, fetchAdminData])

  // ── Auth actions ───────────────────────────────────────────────────────────

  const play = useCallback(async (username, teamName, password) => {
    const data = await api.play(username, teamName, password)
    localStorage.setItem('moonhunt_token', data.token)
    localStorage.setItem('moonhunt_session', JSON.stringify({ username: data.username, teamName: data.teamName }))
    setUser(data.username)
    setTeam(data.teamName)
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
    return data.correct
  }, [fetchPlayerData])

  // ── Admin actions ──────────────────────────────────────────────────────────

  const openEdit     = useCallback((id) => { setEditingId(id); setIsModalOpen(true) }, [])
  const openAddClue  = useCallback(() => { setEditingId(null); setIsModalOpen(true) }, [])
  const closeModal   = useCallback(() => { setIsModalOpen(false); setEditingId(null) }, [])

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
      user, team, isAdmin,
      clues, users, leaderboard,
      editingId, isModalOpen,
      play, loginAdmin, logout,
      submitPin,
      openEdit, openAddClue, closeModal, saveClue,
      deleteClue, removeUser,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
