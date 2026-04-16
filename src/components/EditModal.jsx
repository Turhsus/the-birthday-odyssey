import { useState, useEffect } from 'react'
import { useApp } from '../state/AppContext'

export default function EditModal() {
  const { isModalOpen, editingId, clues, closeModal, saveClue } = useApp()
  const [text, setText] = useState('')
  const [pin, setPin] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    if (!isModalOpen) return
    if (editingId) {
      const c = clues.find(x => x.id === editingId)
      if (c) { setText(c.text); setPin(c.pin); setLocation(c.location) }
    } else {
      setText(''); setPin(''); setLocation('')
    }
  }, [editingId, isModalOpen])

  function handleSave() {
    if (!text || pin.length !== 4) {
      alert('Please fill in the clue text and a 4-digit PIN.')
      return
    }
    saveClue(text, pin, location)
  }

  if (!isModalOpen) return null

  return (
    <div className="modal-backdrop open">
      <div className="modal">
        <div className="modal-title">
          {editingId ? `Edit Moon #${editingId}` : 'Add New Moon'}
        </div>
        <div className="form-group">
          <label className="form-label">Clue Text</label>
          <textarea
            className="form-input"
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Moon PIN (4 digits)</label>
          <input
            className="form-input"
            value={pin}
            maxLength={4}
            placeholder="e.g. 7842"
            onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
            style={{ letterSpacing: '4px', fontFamily: "'Fredoka One', cursive" }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Location Hint (for admin)</label>
          <input
            className="form-input"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. Under the park bench near fountain"
          />
        </div>
        <div className="modal-btns">
          <button className="btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save Moon</button>
        </div>
      </div>
    </div>
  )
}
