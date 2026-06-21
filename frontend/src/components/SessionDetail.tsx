import { useEffect, useState } from 'react'
import ChatBox from './ChatBox'
import { ExternalLink, Database, Search, Loader2, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_BASE_URL } from '../api'

interface SessionData {
  id: string
  company_name: string
  website: string
  objective: string
  status: string
  current_step: string | null
  report: Record<string, string> | null
}

interface SessionDetailProps {
  sessionId: string
}

export default function SessionDetail({ sessionId }: SessionDetailProps) {
  const [session, setSession] = useState<SessionData | null>(null)
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const fetchSession = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`)
        const data = await res.json()
        setSession(data)
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval)
        }
      } catch (err) {
        console.error(err)
      }
    }
    
    fetchSession()
    interval = setInterval(fetchSession, 3000)
    
    return () => clearInterval(interval)
  }, [sessionId])

  if (!session) return (
    <div className="glass rounded-2xl h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-medium animate-pulse">Loading workspace...</p>
      </div>
    </div>
  )

  const isGenerating = session.status === 'created' || session.status === 'in_progress'

  return (
    <motion.div 
      key={sessionId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel bg-white shadow-sm border border-slate-200 rounded-xl h-full flex flex-col overflow-hidden relative"
    >
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{session.company_name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <a href={session.website} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center gap-1 transition-colors">
              <ExternalLink className="w-4 h-4" />
              {session.website}
            </a>
            <span className="text-slate-300">•</span>
            <span className="text-sm text-slate-600">{session.objective}</span>
          </div>
        </div>
        <div className="shrink-0">
          {isGenerating ? (
            <div className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold flex items-center gap-2 border border-slate-200 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              {session.current_step || "Researching"}
            </div>
          ) : session.status === 'failed' ? (
            <div className="px-4 py-2 bg-rose-50 text-rose-700 rounded-lg text-sm font-semibold flex items-center gap-2 border border-rose-100 shadow-sm">
              Failed
            </div>
          ) : (
            <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold flex items-center gap-2 border border-emerald-100 shadow-sm">
              Ready
            </div>
          )}
        </div>
      </div>
      
      {/* Split Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative z-10 bg-white">
        
        {/* Report Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {session.status === 'completed' && session.report ? (
              <motion.div 
                key="completed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-6 pb-8"
              >
                {Object.entries(session.report).map(([key, value], index) => (
                  <motion.div 
                    key={key} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-4 h-4 text-slate-400" />
                      <h4 className="font-bold text-slate-800 text-sm">{key}</h4>
                    </div>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed px-3.5">
                      {String(value)}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            ) : session.status === 'failed' ? (
              <motion.div 
                key="failed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center text-rose-600 font-medium bg-rose-50/50 rounded-2xl border border-rose-100"
              >
                The workflow encountered an error.
              </motion.div>
            ) : (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto"
              >
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="w-16 h-16 mb-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm"
                >
                  <Search className="w-8 h-8 text-slate-400" />
                </motion.div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {session.current_step || "Analyzing Data Sources"}
                </h3>
                <p className="text-slate-500 text-sm">
                  Our agent is scouring the web, extracting context, and synthesizing a comprehensive brief. This usually takes 30-60 seconds.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Chat Area */}
        <div className="w-full lg:w-[400px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50/50 flex flex-col h-[500px] lg:h-auto">
          {session.status === 'completed' ? (
            <ChatBox sessionId={sessionId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-4 border border-slate-200">
                <Lock className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">
                Chat interface will unlock once the briefing is generated.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
