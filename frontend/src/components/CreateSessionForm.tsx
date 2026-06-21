import { useState } from 'react'
import { motion } from 'framer-motion'
import { API_BASE_URL } from '../api'

interface CreateSessionFormProps {
  onCreated: (id: string) => void
}

export default function CreateSessionForm({ onCreated }: CreateSessionFormProps) {
  const [company, setCompany] = useState('')
  const [website, setWebsite] = useState('')
  const [objective, setObjective] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: company, website, objective })
      })
      const data = await res.json()
      console.log("data is ",data)
      await fetch(`${API_BASE_URL}/workflow/${data.id}/execute`, { method: 'POST' })
      
      onCreated(data.id)
      setCompany('')
      setWebsite('')
      setObjective('')
    } catch (err) {
      console.error(err)
      setError("Failed to create session. Ensure backend is running.")
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = "w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none placeholder:text-slate-400"
  const labelClasses = "block mb-1.5 text-xs font-semibold text-slate-700"

  return (
    <motion.form 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit} 
      className="flex flex-col gap-4"
    >
      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100"
        >
          {error}
        </motion.div>
      )}
      <div>
        <label className={labelClasses}>Company</label>
        <input 
          required 
          type="text" 
          placeholder="e.g. Acme Corp"
          value={company}
          onChange={e => setCompany(e.target.value)}
          className={inputClasses} 
        />
      </div>
      <div>
        <label className={labelClasses}>Website</label>
        <input 
          required 
          type="url" 
          placeholder="https://acme.com"
          value={website}
          onChange={e => setWebsite(e.target.value)}
          className={inputClasses} 
        />
      </div>
      <div>
        <label className={labelClasses}>Objective</label>
        <textarea 
          required 
          rows={2}
          placeholder="What do you want to learn?"
          value={objective}
          onChange={e => setObjective(e.target.value)}
          className={`${inputClasses} resize-none`} 
        />
      </div>
      <motion.button 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type="submit" 
        disabled={loading}
        className="w-full bg-[#1E293B] hover:bg-slate-800 text-white font-medium rounded-lg py-2.5 flex items-center justify-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
      >
        <span className="flex items-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Initializing...
            </>
          ) : 'Start Research'}
        </span>
      </motion.button>
    </motion.form>
  )
}
