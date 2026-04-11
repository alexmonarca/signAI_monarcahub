import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  Settings as SettingsIcon, 
  LogOut,
  CreditCard,
  Sparkles,
  X
} from 'lucide-react';
import { UserProfile, PLAN_LIMITS } from '../types';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

interface SidebarProps {
  profile: UserProfile | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ profile, isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center justify-between">
        <Link to="/dashboard" onClick={onClose}>
          <Logo size="md" />
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        <Link 
          to="/dashboard" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
            isActive('/dashboard') 
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </Link>
        <Link 
          to="/create-contract" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ${
            isActive('/create-contract') 
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${isActive('/create-contract') ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-500'}`} /> 
          <span>Criar Contrato <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md ml-1 font-bold">IA</span></span>
        </Link>
        <Link 
          to="/analytics" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ${
            isActive('/analytics') 
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className={`w-5 h-5 ${isActive('/analytics') ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} /> Analytics
        </Link>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-medium transition-all group text-left">
          <Users className="w-5 h-5 text-slate-400 group-hover:text-slate-900" /> Equipe
        </button>
        <Link 
          to="/settings" 
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
            isActive('/settings') 
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <SettingsIcon className="w-5 h-5" /> Configurações
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-900 p-5 rounded-2xl mb-4 text-white relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PLANO {profile?.plan}</div>
            <div className="text-lg font-bold mb-3">
              {profile?.plan === 'free' ? 'Upgrade para Pro' : 'Plano Ativo'}
            </div>
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-emerald-400 h-full transition-all duration-1000" 
                style={{ width: `${Math.min(((profile?.docs_this_month || 0) / (PLAN_LIMITS[profile?.plan || 'free'] || 1)) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] font-medium text-slate-400">
              <span>{profile?.docs_this_month} de {profile?.plan === 'business' ? '∞' : PLAN_LIMITS[profile?.plan || 'free']} docs</span>
              <span>{Math.round(((profile?.docs_this_month || 0) / (PLAN_LIMITS[profile?.plan || 'free'] || 1)) * 100)}%</span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all"
        >
          <LogOut className="w-5 h-5" /> Sair da conta
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-[101] lg:hidden shadow-2xl flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
