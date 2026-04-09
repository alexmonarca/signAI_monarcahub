import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, PLAN_LIMITS } from '../types';
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  CreditCard, 
  Check,
  ArrowRight,
  Loader2,
  X,
  Copy,
  ExternalLink,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from '../components/Sidebar';

interface SettingsProps {
  profile: UserProfile | null;
}

export default function Settings({ profile }: SettingsProps) {
  const [loading, setLoading] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleCopyPix = () => {
    navigator.clipboard.writeText('pix@monarcahub.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpgrade = async (plan: 'pro' | 'business') => {
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan })
        .eq('id', profile.id);
      
      if (!error) {
        window.location.reload(); // Refresh to update profile in App.tsx
      }
    } catch (err) {
      console.error('Error upgrading:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar profile={profile} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center px-4 lg:px-8 sticky top-0 z-20 gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <h2 className="text-xl lg:text-2xl font-display font-bold text-slate-900">Configurações da Conta</h2>
        </header>

        <div className="flex-1 p-8 max-w-4xl space-y-8">
          {/* Profile Section */}
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                <User className="text-slate-500 w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Informações Pessoais</h3>
                <p className="text-sm text-slate-500">Gerencie seus dados e preferências.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm">
                    <Mail className="w-4 h-4" />
                    {profile?.email}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">ID do Usuário</label>
                  <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-[10px] font-mono truncate">
                    {profile?.id}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Subscription Section */}
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <CreditCard className="text-emerald-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Plano e Assinatura</h3>
                <p className="text-sm text-slate-500">Seu plano atual é o <span className="font-bold text-slate-900 uppercase">{profile?.plan}</span>.</p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Free Plan */}
                <div className={`p-6 rounded-2xl border-2 transition-all ${profile?.plan === 'free' ? 'border-slate-900 bg-slate-50' : 'border-slate-100'}`}>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Grátis</div>
                  <div className="text-2xl font-display font-bold mb-4">R$ 0<span className="text-sm font-normal text-slate-400">/mês</span></div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3 h-3 text-emerald-500" /> 3 documentos/mês
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3 h-3 text-emerald-500" /> Analista de contratos
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3 h-3 text-emerald-500" /> Assinatura manual
                    </li>
                  </ul>
                  {profile?.plan === 'free' ? (
                    <div className="w-full py-2 bg-slate-200 text-slate-500 text-center text-xs font-bold rounded-lg">PLANO ATUAL</div>
                  ) : null}
                </div>

                {/* Pro Plan */}
                <div className={`p-6 rounded-2xl border-2 transition-all ${profile?.plan === 'pro' ? 'border-slate-900 bg-slate-50' : 'border-slate-100'}`}>
                  <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Pro</div>
                  <div className="text-2xl font-display font-bold mb-4">R$ 29<span className="text-sm font-normal text-slate-400">/mês</span></div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3 h-3 text-emerald-500" /> 50 documentos/mês
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3 h-3 text-emerald-500" /> Criador de contratos IA
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3 h-3 text-emerald-500" /> Branding personalizado
                    </li>
                  </ul>
                  {profile?.plan === 'pro' ? (
                    <div className="w-full py-2 bg-slate-200 text-slate-500 text-center text-xs font-bold rounded-lg">PLANO ATUAL</div>
                  ) : (
                    <button 
                      onClick={() => setIsPixModalOpen(true)}
                      className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                      MUDAR PARA PRO
                    </button>
                  )}
                </div>

                {/* Business Plan */}
                <div className={`p-6 rounded-2xl border-2 transition-all ${profile?.plan === 'business' ? 'border-slate-900 bg-slate-50' : 'border-slate-100'}`}>
                  <div className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-1">Business</div>
                  <div className="text-2xl font-display font-bold mb-4">R$ 79<span className="text-sm font-normal text-slate-400">/mês</span></div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-xs text-slate-900 font-bold">
                      <Check className="w-3 h-3 text-emerald-500" /> Tudo do Grátis e Pro
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3 h-3 text-emerald-500" /> Ilimitado
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3 h-3 text-emerald-500" /> Suporte prioritário
                    </li>
                    <li className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3 h-3 text-emerald-500" /> API Access
                    </li>
                  </ul>
                  {profile?.plan === 'business' ? (
                    <div className="w-full py-2 bg-slate-200 text-slate-500 text-center text-xs font-bold rounded-lg">PLANO ATUAL</div>
                  ) : (
                    <a 
                      href="https://wa.me/5555996804923"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                      MUDAR PARA BUSINESS
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Security & Others */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group cursor-pointer hover:border-slate-300 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Shield className="text-blue-600 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Segurança</h4>
                  <p className="text-xs text-slate-500">Senha e 2FA</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-all" />
            </section>

            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group cursor-pointer hover:border-slate-300 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Bell className="text-amber-600 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Notificações</h4>
                  <p className="text-xs text-slate-500">Email e Push</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-all" />
            </section>
          </div>
        </div>
      </main>

      {/* PIX Modal */}
      <AnimatePresence>
        {isPixModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setIsPixModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Assinar Plano Pro</h3>
                <button onClick={() => setIsPixModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-8">
                <div className="bg-blue-50 p-6 rounded-2xl mb-6 border border-blue-100">
                  <p className="text-slate-700 text-sm leading-relaxed mb-4">
                    Faça um PIX com o valor para <span className="font-bold text-slate-900">pix@monarcahub.com</span>
                  </p>
                  <button 
                    onClick={handleCopyPix}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-blue-200 rounded-xl text-blue-600 font-bold text-sm hover:bg-blue-50 transition-all active:scale-95"
                  >
                    {copied ? (
                      <><Check className="w-4 h-4" /> Copiado!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copiar Chave PIX</>
                    )}
                  </button>
                </div>

                <div className="space-y-6">
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Depois envie o comprovante para o nosso WhatsApp para liberação imediata:
                  </p>
                  
                  <a 
                    href="https://wa.me/5555996804923" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    Enviar Comprovante no WhatsApp
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                      Assim que o pagamento for reconhecido no sistema, atualize sua página e sua assinatura <span className="font-bold">Pro</span> será reconhecida em seu painel.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
