import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Copy, Check, FileDown, Save, AlertCircle, Menu } from 'lucide-react';
import { generateContract } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

interface CreateContractProps {
  profile: UserProfile | null;
}

export default function CreateContract({ profile }: CreateContractProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const isRestricted = profile?.plan === 'free';

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (isRestricted) {
      setError('Esta funcionalidade é exclusiva para planos Pro e Business.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateContract(prompt);
      setGeneratedText(result || '');
    } catch (err) {
      setError('Falha ao gerar o contrato. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!generatedText || !profile) return;

    try {
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          title: `Contrato Gerado - ${new Date().toLocaleDateString()}`,
          owner_id: profile.id,
          content: generatedText,
          status: 'pending'
        });

      if (insertError) throw insertError;
      navigate('/dashboard');
    } catch (err) {
      setError('Erro ao salvar o contrato no dashboard.');
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
          <h2 className="text-xl lg:text-2xl font-display font-bold text-slate-900 flex items-center gap-3">
            <Sparkles className="text-blue-600 w-6 h-6" />
            Criar Contrato com IA
          </h2>
        </header>

        <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="mb-2">
            <p className="text-slate-500">
              Descreva o tipo de contrato que você precisa e nossa IA jurídica redigirá para você.
            </p>
          </div>

          {isRestricted && (
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4 shadow-sm">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-1">Funcionalidade Premium</h3>
                <p className="text-blue-700 text-sm mb-4">
                  A geração de contratos por IA está disponível apenas para assinantes Pro e Business.
                </p>
                <button 
                  onClick={() => navigate('/settings')}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Fazer Upgrade Agora
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-widest">
                O que você deseja contratar?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Contrato de prestação de serviços de marketing digital entre a agência X e o cliente Y, com duração de 6 meses e multa por rescisão..."
                className="w-full h-40 px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-none mb-6 text-slate-700 leading-relaxed"
                disabled={isGenerating || isRestricted}
              />
              
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || isRestricted}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10 active:scale-[0.98]"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Redigindo contrato...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Gerar Minuta do Contrato
                  </>
                )}
              </button>

              {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {generatedText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">Minuta Gerada</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="p-2.5 hover:bg-white rounded-xl transition-all text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200"
                      title="Copiar texto"
                    >
                      {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/10 active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      Salvar no Dashboard
                    </button>
                  </div>
                </div>
                <div className="p-10 prose prose-slate max-w-none max-h-[700px] overflow-y-auto font-serif whitespace-pre-wrap text-slate-800 leading-relaxed text-lg">
                  {generatedText}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
