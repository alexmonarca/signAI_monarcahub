import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Document, PLAN_LIMITS } from '../types';
import { 
  FileText, 
  Plus, 
  LogOut, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  LayoutDashboard,
  Settings,
  CreditCard,
  Loader2,
  TrendingUp,
  Users,
  Calendar,
  Share2,
  BrainCircuit,
  Trash2,
  Eye,
  Download,
  Link as LinkIcon,
  Mail,
  X,
  Menu
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { extractTextFromPDF, analyzeContract } from '../lib/ai';

interface DashboardProps {
  profile: UserProfile | null;
}

export default function Dashboard({ profile }: DashboardProps) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    if (profile) fetchDocuments();
  }, [profile]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: documents.length,
    signed: documents.filter(d => d.status === 'signed').length,
    pending: documents.filter(d => d.status === 'pending').length,
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) {
      console.warn('Upload cancelado: arquivo ou perfil não disponível.', { file, profile });
      return;
    }

    console.log('Iniciando upload do arquivo:', {
      name: file.name,
      type: file.type,
      size: file.size,
      profileId: profile.id,
      profileEmail: profile.email
    });

    if (profile.docs_this_month >= PLAN_LIMITS[profile.plan]) {
      alert('Você atingiu o limite de documentos do seu plano. Faça upgrade para continuar!');
      return;
    }

    setIsUploading(true);
    try {
      let content = '';
      let aiAnalysis = null;

      // Check if it's a PDF by extension if type is missing
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (isPDF) {
        try {
          content = await extractTextFromPDF(file);
          aiAnalysis = await analyzeContract(content);
        } catch (err: any) {
          console.error('AI Analysis failed:', err);
          // We continue anyway, but log it
        }
      } else {
        console.log('Arquivo não é PDF, pulando extração de texto.');
      }

      console.log('Enviando para o Supabase...');
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          owner_id: profile.id,
          title: file.name,
          status: 'pending',
          content: content,
          ai_analysis: aiAnalysis
        }])
        .select()
        .single();

      if (!error) {
        setDocuments([data, ...documents]);
        await supabase
          .from('profiles')
          .update({ docs_this_month: profile.docs_this_month + 1 })
          .eq('id', profile.id);
      } else {
        console.error('Supabase insert error:', error);
        alert(`Erro ao salvar no banco de dados: ${error.message}`);
      }
    } catch (err: any) {
      console.error('Error uploading:', err);
      alert(`Erro inesperado no upload: ${err.message || 'Verifique o console para mais detalhes.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!shareEmail || !shareDoc) return;
    
    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: shareEmail,
          subject: `Assinatura Pendente: ${shareDoc.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
              <h2 style="color: #0f172a;">Olá!</h2>
              <p style="color: #475569; line-height: 1.6;">
                Você foi convidado para assinar o documento <strong>${shareDoc.title}</strong> através da plataforma Sign AI.
              </p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${window.location.origin}/sign/${shareDoc.id}" 
                   style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Ver e Assinar Agora
                </a>
              </div>
              <p style="color: #94a3b8; font-size: 12px;">
                Se o botão acima não funcionar, copie e cole este link no seu navegador:<br>
                ${window.location.origin}/sign/${shareDoc.id}
              </p>
            </div>
          `
        })
      });

      if (response.ok) {
        alert('E-mail enviado com sucesso!');
        setShareDoc(null);
        setShareEmail('');
      } else {
        const error = await response.json();
        alert(`Erro ao enviar e-mail: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Erro ao conectar com o serviço de e-mail.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (!error) {
        setDocuments(documents.filter(d => d.id !== id));
        setDeleteDoc(null);
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const handleDownload = (doc: Document) => {
    const blob = new Blob([doc.content || ''], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'declined': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'signed': return 'Assinado';
      case 'declined': return 'Recusado';
      default: return 'Pendente';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar profile={profile} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <div>
              <h2 className="text-xl lg:text-2xl font-display font-bold text-slate-900">Olá, {profile?.email?.split('@')[0]}</h2>
              <p className="text-xs lg:text-sm text-slate-500 hidden sm:block">Bem-vindo de volta ao seu painel.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nome..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 w-64 transition-all"
              />
            </div>
            <label className="btn-primary py-2.5 px-5 flex items-center gap-2 cursor-pointer shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition-transform">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span className="font-bold text-sm">Novo Documento</span>
              <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} accept=".pdf,.doc,.docx" />
            </label>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <FileText className="text-blue-600 w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
              </div>
              <div className="text-3xl font-display font-bold text-slate-900">{stats.total}</div>
              <p className="text-sm text-slate-500 mt-1">Documentos carregados</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-600 w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assinados</span>
              </div>
              <div className="text-3xl font-display font-bold text-slate-900">{stats.signed}</div>
              <p className="text-sm text-slate-500 mt-1">Concluídos com sucesso</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                  <Clock className="text-amber-600 w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pendentes</span>
              </div>
              <div className="text-3xl font-display font-bold text-slate-900">{stats.pending}</div>
              <p className="text-sm text-slate-500 mt-1">Aguardando assinatura</p>
            </motion.div>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" /> Atividade Recente
              </h3>
              <button className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Ver todos</button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 bg-white rounded-3xl border border-slate-200">
                <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum documento encontrado</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">
                  {searchTerm ? 'Tente buscar por outro termo ou limpe o filtro.' : 'Faça o upload do seu primeiro documento para começar.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredDocs.map((doc, index) => (
                  <motion.div 
                    key={doc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between group hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50 transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 truncate group-hover:text-slate-900 transition-colors">
                          {doc.title.length > 15 ? `${doc.title.substring(0, 15)}...` : doc.title}
                        </h4>
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100">
                            {getStatusIcon(doc.status)}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {getStatusLabel(doc.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/document/${doc.id}`}
                          className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-2"
                          title="Ver detalhes e análise IA"
                        >
                          <BrainCircuit className="w-5 h-5" />
                          <span className="text-xs font-bold sm:hidden md:inline">Análise IA</span>
                        </Link>
                        {doc.status === 'pending' && (
                          <Link 
                            to={`/sign/${doc.id}`}
                            className="btn-primary py-2 px-6 text-xs shadow-none hover:shadow-lg hover:shadow-slate-900/20"
                          >
                            Assinar Agora
                          </Link>
                        )}
                      </div>
                      
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
                          className={`p-2.5 rounded-xl transition-all ${activeMenu === doc.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {activeMenu === doc.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-30" 
                              onClick={() => setActiveMenu(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40 overflow-hidden">
                              <button 
                                onClick={() => { setViewDoc(doc); setActiveMenu(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                              >
                                <Eye className="w-4 h-4" /> Abrir
                              </button>
                              <button 
                                onClick={() => { setShareDoc(doc); setActiveMenu(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                              >
                                <Share2 className="w-4 h-4" /> Compartilhar
                              </button>
                              <button 
                                onClick={() => { handleDownload(doc); setActiveMenu(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                              >
                                <Download className="w-4 h-4" /> Baixar
                              </button>
                              <div className="h-px bg-slate-100 my-1" />
                              <button 
                                onClick={() => { setDeleteDoc(doc); setActiveMenu(null); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> Excluir
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setViewDoc(null)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-4xl max-h-[80vh] rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{viewDoc.title}</h3>
              <button onClick={() => setViewDoc(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 font-serif whitespace-pre-wrap text-slate-700 leading-relaxed">
              {viewDoc.content || 'Este documento não possui conteúdo textual extraído.'}
            </div>
          </motion.div>
        </div>
      )}

      {shareDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => { setShareDoc(null); setShareEmail(''); }}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Compartilhar</h3>
              <button onClick={() => { setShareDoc(null); setShareEmail(''); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Email Sharing */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">Enviar por E-mail</label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="exemplo@email.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                  />
                  <button 
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !shareEmail}
                    className="btn-primary py-2.5 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">O destinatário receberá um link direto para assinar o documento.</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-bold tracking-widest">ou</span>
                </div>
              </div>

              {/* Link Sharing */}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/sign/${shareDoc.id}`);
                  alert('Link copiado para a área de transferência!');
                }}
                className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <LinkIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900">Copiar Link</div>
                  <div className="text-xs text-slate-500">Link direto para assinatura</div>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {deleteDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setDeleteDoc(null)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative z-10 p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir Documento?</h3>
            <p className="text-slate-500 text-sm mb-8">
              Esta ação não pode ser desfeita. O documento "{deleteDoc.title}" será removido permanentemente.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteDoc(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(deleteDoc.id)}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                Excluir
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
