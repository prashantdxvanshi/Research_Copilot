import { motion } from 'framer-motion'
import { ArrowRight, Bot, Zap, Globe, ShieldCheck } from 'lucide-react'

interface HomePageProps {
  onGetStarted: () => void
}

export default function HomePage({ onGetStarted }: HomePageProps) {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
      {/* Top Nav */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">Z</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Zylabs</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
        </nav>
        <button 
          onClick={onGetStarted}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
        >
          Open Copilot
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-8">
            <Bot className="w-4 h-4" />
            <span>AI Research Copilot</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            Your sellers run the conversation. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              We do everything else.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Production-grade AI workflow powered by LangGraph. Instantly research companies, generate deep-dive briefings, and unlock actionable sales insights.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full text-base font-medium transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5"
            >
              Start Researching
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-32 grid md:grid-cols-3 gap-8 text-left border-t border-slate-100 pt-16"
        >
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Briefings</h3>
            <p className="text-slate-500 leading-relaxed">
              Generate comprehensive research reports in seconds. We scour the web and synthesize the data so you don't have to.
            </p>
          </div>
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
              <Globe className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">LangGraph Powered</h3>
            <p className="text-slate-500 leading-relaxed">
              Built on advanced cyclic graphs. Our AI agent researches, self-corrects, and verifies output quality automatically.
            </p>
          </div>
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Enterprise Grade</h3>
            <p className="text-slate-500 leading-relaxed">
              Secure, fast, and production-ready. Features complete persistence, structured logging, and strict error handling.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
