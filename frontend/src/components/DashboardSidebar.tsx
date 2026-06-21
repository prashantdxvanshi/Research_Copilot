import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import CreateSessionForm from './CreateSessionForm'
import SessionList from './SessionList'

interface DashboardSidebarProps {
  isCreating: boolean
  setIsCreating: (val: boolean) => void
  selectedSessionId: string | null
}

export default function DashboardSidebar({ isCreating, setIsCreating, selectedSessionId }: DashboardSidebarProps) {
  const navigate = useNavigate()

  return (
    <motion.aside 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full md:w-[340px] flex flex-col gap-6 shrink-0 h-full"
    >
      {isCreating && (
        <div className="glass-panel p-5 shrink-0 bg-white shadow-sm border border-slate-200 rounded-xl">
          <CreateSessionForm onCreated={(id) => {
            navigate(`/dashboard/${id}`)
            setIsCreating(false)
          }} />
        </div>
      )}
      
      <div className="glass-panel p-0 flex-1 flex flex-col overflow-hidden bg-white shadow-sm border border-slate-200 rounded-xl">
        <div className="border-b border-slate-100 px-4 pt-4 flex gap-6">
          <button className="pb-3 border-b-2 border-slate-900 font-semibold text-sm text-slate-900">Active</button>
          <button className="pb-3 border-b-2 border-transparent font-medium text-sm text-slate-500 hover:text-slate-700">Archived</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <SessionList onSelect={(id) => navigate(`/dashboard/${id}`)} selectedId={selectedSessionId} />
        </div>
      </div>
    </motion.aside>
  )
}
