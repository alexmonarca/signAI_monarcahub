import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserProfile, Document } from '../types';
import { 
  ArrowLeft, 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Mail, 
  Loader2,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  Zap,
  Download,
  Clock,
  Fingerprint,
  PenTool,
  Upload as UploadIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import Sidebar from '../components/Sidebar';
import { handleDocumentDownload } from '../lib/download';

interface DocumentDetailsProps {
  profile: UserProfile | null;
}

export default function DocumentDetails({ profile }: DocumentDetailsProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isSendingCopy, setIsSendingCopy] = useState(false);
  const [copySent, setCopySent] = useState(false);

  useEffect(() => {
    if (id) fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDocument(data);
    } catch (err) {
      console.error('Error fetching document:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !inviteEmail || !profile) return;

    setIsInviting(true);
    try {
      // 1. Update database
      const { error } = await supabase
        .from('documents')
        .update({ signer_email: inviteEmail })
        .eq('id', document.id);

      if (error) throw error;
      
      // 2. Send email via n8n webhook
      const shareLink = `${window.location.origin}/#/sign/${document.id}`;
      await fetch('https://webhook.monarcahub.com/webhook/enviar-compartilhamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_destinatario: inviteEmail,
          link_assinatura: shareLink,
          nome_documento: document.title,
          remetente_nome: profile.full_name || profile.email,
          remetente_email: profile.email
        })
      });

      setInviteSuccess(true);
      setDocument({ ...document, signer_email: inviteEmail });
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err) {
      console.error('Error inviting signer:', err);
      alert('Erro ao convidar signatário.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleSendCopyManually = async () => {
    if (!document?.signer_email) return;
    setIsSendingCopy(true);
    
    const manualPayload = {
      document_id: id,
      document_title: document.title,
      signed_at: document.signed_at || new Date().toISOString(),
      send_copy_to: document.signer_email,
      is_copy_request: true,
      manual_send: true
    };

    console.log('Enviando reenvio manual de cópia:', manualPayload);

    try {
      // 1. Send webhook
      const response = await fetch('https://webhook.monarcahub.com/webhook/doc-signed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualPayload)
      });

      if (!response.ok) {
        console.warn('Webhook de reenvio manual respondeu com erro:', response.status);
      }

      // 2. Update database
      await supabase
        .from('documents')
        .update({ copy_requested: true })
        .eq('id', id);

      setCopySent(true);
      setDocument({ ...document, copy_requested: true });
      setTimeout(() => setCopySent(false), 3000);
    } catch (err) {
      console.error('Error sending copy:', err);
      alert('Erro ao enviar cópia.');
    } finally {
      setIsSendingCopy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar profile={profile} />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => document && handleDocumentDownload(document)}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center gap-2"
                title="Baixar Documento"
              >
                <Download className="w-5 h-5" />
                <span className="text-xs font-bold">Baixar PDF</span>
              </button>
              <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Document Info & AI Analysis */}
            <div className="lg:col-span-2 space-y-8">
              {/* Document Info Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm"
              >
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-display font-bold text-slate-900 truncate">{document.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" /> {new Date(document.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-slate-500">
                        <User className="w-4 h-4" /> {profile?.email}
                      </span>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        document.status === 'signed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        document.status === 'declined' ? 'bg-red-50 text-red-600 border border-red-100' :
                        'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {document.status === 'signed' ? 'Assinado' : document.status === 'declined' ? 'Recusado' : 'Pendente'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* AI Analysis Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="bg-slate-900 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <BrainCircuit className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">Análise Inteligente (Sign AI)</h3>
                      <p className="text-xs text-slate-400">Processado pelo Gemini 3 Flash</p>
                    </div>
                  </div>
                  <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>

                <div className="p-8 space-y-8">
                  {!document.ai_analysis ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-500 text-sm">Nenhuma análise disponível para este documento.</p>
                    </div>
                  ) : (
                    <>
                      <section>
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Resumo do Contrato</h4>
                        <p className="text-slate-700 leading-relaxed">{document.ai_analysis.summary}</p>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section>
                          <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Pontos Positivos
                          </h4>
                          <ul className="space-y-3">
                            {document.ai_analysis.positive_points.map((point, i) => (
                              <li key={i} className="flex gap-3 text-sm text-slate-600">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 flex-shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </section>

                        <section>
                          <h4 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> Pontos de Atenção
                          </h4>
                          <ul className="space-y-3">
                            {document.ai_analysis.attention_points.map((point, i) => (
                              <li key={i} className="flex gap-3 text-sm text-slate-600">
                                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </section>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column: Actions & Signers */}
            <div className="space-y-8">
              {/* Invite Card */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" /> Convidar Signatário
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Envie este documento para outra pessoa assinar. Ela receberá um link por e-mail.
                </p>

                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">E-mail do Signatário</label>
                    <input 
                      type="email" 
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="exemplo@email.com"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isInviting || inviteSuccess}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      inviteSuccess ? 'bg-emerald-500 text-white' : 'btn-primary'
                    }`}
                  >
                    {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                     inviteSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {inviteSuccess ? 'Enviado com Sucesso!' : 'Enviar Convite'}
                  </button>
                </form>

                {document.signer_email && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Signatário Atual</h4>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{document.signer_email}</p>
                        <p className="text-[10px] text-slate-500">
                          {document.status === 'signed' ? 'Documento Assinado' : 'Aguardando assinatura'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Signature Analytics Card */}
              {document.status === 'signed' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm"
                >
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" /> Detalhes da Assinatura
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-500">Data/Hora</span>
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {document.signed_at ? new Date(document.signed_at).toLocaleString('pt-BR') : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        {document.signature_method === 'draw' ? <PenTool className="w-4 h-4 text-slate-400" /> :
                         document.signature_method === 'document' ? <Fingerprint className="w-4 h-4 text-slate-400" /> :
                         <UploadIcon className="w-4 h-4 text-slate-400" />}
                        <span className="text-xs text-slate-500">Método</span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 uppercase">
                        {document.signature_method === 'draw' ? 'Rabisco Digital' :
                         document.signature_method === 'document' ? 'CPF/CNPJ' : 'Upload de Arquivo'}
                      </span>
                    </div>

                    {document.signature_details && (
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="w-4 h-4 text-slate-400" />
                          <span className="text-xs text-slate-500">Identificador</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-slate-900 truncate">
                          {document.signature_details}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleSendCopyManually}
                      disabled={isSendingCopy || copySent}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                        copySent ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'btn-secondary'
                      }`}
                    >
                      {isSendingCopy ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                       copySent ? <CheckCircle2 className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                      {copySent ? 'Cópia Enviada!' : 'Reenviar Cópia ao Signatário'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Security Info */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white">
                <ShieldCheck className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="font-bold mb-2">Assinatura Segura</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Todos os documentos no Sign AI são protegidos por criptografia de ponta a ponta e possuem validade jurídica conforme a legislação vigente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
