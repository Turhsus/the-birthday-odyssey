import { useState } from 'react'
import { useApp } from '../state/AppContext'

export default function ClueCard({ clue }) {
  const { submitPin } = useApp()
  const [pin, setPin] = useState('')
  const [feedback, setFeedback] = useState(null)

  function handleSubmit() {
    if (pin.length < 4) {
      setFeedback({ ok: false, msg: 'Enter the full 4-digit PIN.' })
      return
    }
    const ok = submitPin(clue.id, pin)
    if (ok) {
      setFeedback({ ok: true, msg: 'Moon found! Well done!' })
    } else {
      setFeedback({ ok: false, msg: 'Wrong PIN. Keep searching!' })
      setPin('')
      setTimeout(() => setFeedback(null), 1500)
    }
  }

  if (clue.solved) {
    return (
      <div className="clue-card solved">
        <div className="clue-header">
          <div className="moon-dot" style={{ borderColor: 'rgba(45,229,160,0.5)' }}>✓</div>
          <div>
            <div className="clue-num">Moon #{clue.id} — Claimed!</div>
            <div className="clue-text" style={{ color: 'var(--text-muted)' }}>{clue.text}</div>
          </div>
        </div>
        <div className="clue-solved-badge">✓ Found by your team</div>
      </div>
    )
  }

  return (
    <div className="clue-card">
      <div className="clue-header">
        <div className="moon-dot">🌕</div>
        <div>
          <div className="clue-num">Moon #{clue.id}</div>
          <div className="clue-text">{clue.text}</div>
        </div>
      </div>
      <div className="pin-row">
        <input
          className="pin-input"
          value={pin}
          maxLength={4}
          placeholder="PIN"
          onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <button className="submit-btn" onClick={handleSubmit}>Submit</button>
      </div>
      {feedback && (
        <div className={`pin-feedback ${feedback.ok ? 'ok' : 'err'}`}>{feedback.msg}</div>
      )}
    </div>
  )
}
