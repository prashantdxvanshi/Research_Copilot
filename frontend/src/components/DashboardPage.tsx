import { useState } from 'react'
import { Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardHeader from './DashboardHeader'
import DashboardSidebar from './DashboardSidebar'
import DashboardEmptyState from './DashboardEmptyState'
import SessionDetail from './SessionDetail'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const [isCreating, setIsCreating] = useState(false)

  const selectedSessionId = sessionId || null

  return (
    <div className="min-h-screen bg-[#F8F9FA] relative flex flex-col font-sans">
      <DashboardHeader />

      {/* Main Container */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6 flex flex-col">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 
              onClick={() => navigate('/')}
              className="text-[28px] font-bold text-slate-900 tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
            >
              Research Copilot
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <span className="cursor-pointer hover:text-slate-800 transition-colors" onClick={() => navigate('/dashboard')}>Dashboard</span>
              <span>•</span>
              <span className="text-slate-400">Sessions</span>
            </div>
          </div>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="bg-[#1E293B] hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Research
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-180px)]">
          <DashboardSidebar 
            isCreating={isCreating} 
            setIsCreating={setIsCreating} 
            selectedSessionId={selectedSessionId} 
          />

          {/* Main Content Area */}
          <motion.main 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 h-full overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {selectedSessionId ? (
                <SessionDetail key={selectedSessionId} sessionId={selectedSessionId} />
              ) : (
                <DashboardEmptyState />
              )}
            </AnimatePresence>
          </motion.main>
        </div>
      </div>
    </div>
  )
}
