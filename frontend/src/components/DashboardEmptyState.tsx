import { motion } from 'framer-motion'

export default function DashboardEmptyState() {
  return (
    <motion.div 
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="glass-panel bg-white shadow-sm border border-slate-200 rounded-xl h-full flex flex-col items-center justify-center text-center p-8"
    >
      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: [-2, 2, -2] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="w-48 h-32 mb-6 flex items-center justify-center relative opacity-50 grayscale"
      >
        {/* Mimic empty state illustration */}
        <div className="w-32 h-20 bg-slate-200 rounded-lg shadow-sm border border-slate-300 relative overflow-hidden">
          <div className="h-4 bg-slate-300 flex items-center px-2 gap-1 border-b border-slate-300">
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
          <div className="flex p-2 gap-2">
            <div className="flex-1 space-y-1">
              <div className="h-2 bg-white rounded-sm w-full"></div>
              <div className="h-2 bg-white rounded-sm w-3/4"></div>
              <div className="h-2 bg-white rounded-sm w-5/6"></div>
            </div>
            <div className="w-8 h-8 bg-slate-300 rounded-sm"></div>
          </div>
        </div>
        <div className="absolute top-2 right-4 w-2 h-2 rounded-sm border border-slate-300 rotate-45"></div>
        <div className="absolute bottom-4 left-6 w-1.5 h-1.5 rounded-full border border-slate-300"></div>
        <div className="absolute bottom-2 right-8 w-1.5 h-1.5 rounded-sm border border-slate-300 rotate-12"></div>
      </motion.div>
      <h3 className="text-xl font-bold text-slate-400 mb-1 tracking-tight">No Data</h3>
    </motion.div>
  )
}
