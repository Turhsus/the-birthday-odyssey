import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import clueRoutes from './routes/clues.js'
import userRoutes from './routes/users.js'
import teamRoutes from './routes/teams.js'
import leaderboardRoutes from './routes/leaderboard.js'
import adminRoutes from './routes/admin.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/clues', clueRoutes)
app.use('/api/users', userRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/admin', adminRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => console.log(`🌕 Moon Hunt API → http://localhost:${PORT}`))
