import { useApp } from './state/AppContext'
import StarsBg from './components/StarsBg'
import Login from './components/Login'
import GameView from './components/GameView'
import Leaderboard from './components/Leaderboard'
import AdminView from './components/AdminView'
import EditModal from './components/EditModal'

export default function App() {
  const { currentView } = useApp()

  return (
    <div id="app">
      <StarsBg />
      {currentView === 'login' && <Login />}
      {currentView === 'game' && <GameView />}
      {currentView === 'board' && <Leaderboard />}
      {currentView === 'admin' && <AdminView />}
      <EditModal />
    </div>
  )
}
