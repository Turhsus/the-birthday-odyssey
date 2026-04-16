import { createContext, useContext, useState, useCallback } from 'react'
import { initialClues, initialUsers, initialLeaderboard } from '../data/initialData'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentView, setCurrentView] = useState('login')
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [clues, setClues] = useState(initialClues)
  const [users, setUsers] = useState(initialUsers)
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard)
  const [activeClues, setActiveClues] = useState([1, 2, 3])
  const [foundClues, setFoundClues] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const login = useCallback((username, teamName) => {
    setUser(username)
    setTeam(teamName)
    setIsAdmin(false)
    setCurrentView('game')
  }, [])

  const loginAdmin = useCallback(() => {
    setIsAdmin(true)
    setCurrentView('admin')
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setTeam(null)
    setIsAdmin(false)
    setFoundClues([])
    setActiveClues([1, 2, 3])
    setCurrentView('login')
  }, [])

  const submitPin = useCallback((clueId, pin) => {
    const clue = clues.find(c => c.id === clueId)
    if (!clue || pin !== clue.pin) return false

    setClues(prev => prev.map(c =>
      c.id === clueId ? { ...c, solved: true, solvedBy: team } : c
    ))

    setFoundClues(prev => {
      const next = clues.find(c =>
        !c.solved && !activeClues.includes(c.id) && !prev.includes(c.id) && c.id !== clueId
      )
      setActiveClues(prevActive => {
        const updated = prevActive.filter(x => x !== clueId)
        return next ? [...updated, next.id] : updated
      })
      return [...prev, clueId]
    })

    setLeaderboard(prev => {
      const exists = prev.find(l => l.team === team)
      const updated = exists
        ? prev.map(l => l.team === team ? { ...l, moons: l.moons + 1 } : l)
        : [...prev, { team, moons: 1, members: 1 }]
      return [...updated].sort((a, b) => b.moons - a.moons)
    })

    return true
  }, [clues, activeClues, team])

  const openEdit = useCallback((id) => {
    setEditingId(id)
    setIsModalOpen(true)
  }, [])

  const openAddClue = useCallback(() => {
    setEditingId(null)
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingId(null)
  }, [])

  const saveClue = useCallback((text, pin, location) => {
    if (editingId) {
      setClues(prev => prev.map(c =>
        c.id === editingId ? { ...c, text, pin, location } : c
      ))
    } else {
      setClues(prev => {
        const newId = Math.max(...prev.map(c => c.id)) + 1
        return [...prev, { id: newId, text, pin, location, solved: false, solvedBy: null }]
      })
    }
    closeModal()
  }, [editingId, closeModal])

  const deleteClue = useCallback((id) => {
    setClues(prev => prev.filter(c => c.id !== id))
    setActiveClues(prev => prev.filter(x => x !== id))
  }, [])

  const removeUser = useCallback((name) => {
    setUsers(prev => prev.filter(u => u.name !== name))
  }, [])

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      user, team, isAdmin,
      clues, users, leaderboard,
      activeClues, foundClues,
      editingId, isModalOpen,
      login, loginAdmin, logout,
      submitPin,
      openEdit, openAddClue, closeModal, saveClue,
      deleteClue, removeUser,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
