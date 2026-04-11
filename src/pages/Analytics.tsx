import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Document } from '../types';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Mail, 
  Download, 
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  Fingerprint,
  PenTool,
  Upload as UploadIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import Sidebar from '../components/Sidebar';
import { handleDocumentDownload } from '../lib/download';

interface AnalyticsProps {
  profile: UserProfile | null;
}

export default function Analytics({ profile }: AnalyticsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'signed'>('all');

  useEffect(() => {
    if (profile) fetchDocuments();
  }, [profile]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents for analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: documents.length,
    signed: documents.filter(d => d.status === 'signed').length,
    pending: documents.filter(d => d.status === 'pending').length,
    conversion: documents.length > 0 ? Math.round((documents.filter(d => d.status === 'signed').length / documents.length) * 100) : 0
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.signer_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar profile={profile} />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">Analytics</h1>
              <p className="text-slate-500">Acompanhe o desempenho e histórico dos seus documentos.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar documento ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 outline-none transition-all w-64"
                />
              </div>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 outline-none transition-all cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendentes</option>
                <option value="signed">Assinados</option>
              </select>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Enviados" 
              value={stats.total} 
              icon={<FileText className="w-5 h-5 text-blue-600" />}
              trend="+12%"
              trendUp={true}
            />
            <StatCard 
              title="Assinados" 
              value={stats.signed} 
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              trend="+8%"
              trendUp={true}
            />
            <StatCard 
              title="Pendentes" 
              value={stats.pending} 
              icon={<Clock className="w-5 h-5 text-amber-600" />}
              trend="-2%"
              trendUp={false}
            />
            <StatCard 
              title="Taxa de Conversão" 
              value={`${stats.conversion}%`} 
              icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
              trend="+5%"
              trendUp={true}
            />
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Histórico de Atividades</h3>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Exportar CSV</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documento</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signatário</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Método</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cópia Enviada</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-white transition-colors">
                            <FileText className="w-4 h-4 text-slate-500" />
                          </div>
                          <span className="text-sm font-bold text-slate-900 truncate max-w-[120px] sm:max-w-[300px]">{doc.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-600">{doc.signer_email || 'Não convidado'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          doc.status === 'signed' ? 'bg-emerald-50 text-emerald-600' :
                          doc.status === 'declined' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {doc.status === 'signed' ? 'Assinado' : doc.status === 'declined' ? 'Recusado' : 'Pendente'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {doc.status === 'signed' ? (
                          <div className="flex items-center gap-2 text-slate-500">
                            {doc.signature_method === 'draw' ? <PenTool className="w-3.5 h-3.5" /> :
                             doc.signature_method === 'document' ? <Fingerprint className="w-3.5 h-3.5" /> :
                             <UploadIcon className="w-3.5 h-3.5" />}
                            <span className="text-xs">
                              {doc.signature_method === 'draw' ? 'Rabisco' :
                               doc.signature_method === 'document' ? 'CPF/CNPJ' : 'Upload'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {doc.status === 'signed' ? (
                          doc.copy_requested ? (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">Sim</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">Não</span>
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500">
                          {new Date(doc.signed_at || doc.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleDocumentDownload(doc)}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                            title="Baixar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => window.location.hash = `#/document/${doc.id}`}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                            title="Ver Detalhes"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDocs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-slate-200" />
                          <p className="text-slate-500 text-sm">Nenhum documento encontrado com esses filtros.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }: { title: string, value: string | number, icon: React.ReactNode, trend: string, trendUp: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
      </div>
    </motion.div>
  );
}
