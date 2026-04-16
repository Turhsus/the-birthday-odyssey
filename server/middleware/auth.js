import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'moonhunt-dev-secret-change-in-prod'

export const signToken = payload => jwt.sign(payload, SECRET, { expiresIn: '7d' })

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(auth.slice(7), SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' })
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin access required' })
    next()
  })
}
