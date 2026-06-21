import { Bell, Settings, Search, Menu } from 'lucide-react'

export default function DashboardHeader() {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button className="text-slate-500 hover:text-slate-700">
          <Menu className="w-5 h-5" />
        </button>
        <button className="text-slate-500 hover:text-slate-700">
          <Search className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative cursor-pointer">
          <Bell className="w-5 h-5 text-slate-500" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white border-2 border-white">2</span>
        </div>
        <Settings className="w-5 h-5 text-slate-500 cursor-pointer" />
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 cursor-pointer overflow-hidden">
          <img src="https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  )
}
