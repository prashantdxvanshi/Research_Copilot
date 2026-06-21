import { useEffect, useState } from 'react'
import { FolderKanban } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface Session {
  id: string
  company_name: string
  status: string
  objective: string
}

interface SessionListProps {
  onSelect: (id: string) => void
  selectedId: string | null
}

export default function SessionList({ onSelect, selectedId }: SessionListProps) {
  const [sessions, setSessions] = useState<Session[]>([])

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/`)
      const data = await res.json()
      setSessions(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence>
        {sessions.map((s, index) => {
          const isSelected = selectedId === s.id
          return (
            <motion.div 
              key={s.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => onSelect(s.id)}
              className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 border 
                ${isSelected 
                  ? 'bg-slate-50 border-slate-300 shadow-sm' 
                  : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="flex justify-between items-start gap-2">
                <p className={`font-semibold text-sm truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                  {s.company_name}
                </p>
                <div className="shrink-0 mt-0.5">
                  {s.status === 'completed' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Completed" />}
                  {s.status === 'failed' && <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" title="Failed" />}
                  {(s.status === 'created' || s.status === 'in_progress') && (
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]" title="In Progress" />
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate group-hover:text-slate-600 transition-colors">
                {s.objective}
              </p>
            </motion.div>
          )
        })}
      </AnimatePresence>
      {sessions.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-8 text-center px-4"
        >
          <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
            <FolderKanban className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">No Data</p>
        </motion.div>
      )}
    </div>
  )
}
