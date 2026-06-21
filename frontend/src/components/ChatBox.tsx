import { useEffect, useState, useRef } from 'react'
import { Send, Bot, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatBoxProps {
  sessionId: string
}

export default function ChatBox({ sessionId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/chat`)
        const data = await res.json()
        setMessages(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchHistory()
  }, [sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    
    const userMsg = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMsg })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full relative bg-slate-50">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
            <Bot className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Copilot Chat</h3>
            <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-70"
            >
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-200">
                <MessageSquare className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm max-w-[200px]">
                I've read the briefing. What would you like to know?
              </p>
            </motion.div>
          )}
          
          {messages.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role !== 'user' && (
                <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 shrink-0 mr-2 mt-auto mb-1 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-indigo-600" />
                </div>
              )}
              <div className={`max-w-[85%] px-4 py-3 text-sm shadow-sm
                ${m.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-2xl rounded-br-sm ml-auto font-medium' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-bl-sm'}`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
             <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 shrink-0 mr-2 mt-auto mb-1 flex items-center justify-center">
                <Bot className="w-3 h-3 text-indigo-600" />
              </div>
            <div className="bg-white border border-slate-200 text-slate-500 px-4 py-3 rounded-2xl rounded-bl-sm text-sm flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0 shadow-sm z-10">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm rounded-xl pl-4 pr-12 py-3 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none"
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="absolute right-1.5 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:hover:bg-slate-900"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
