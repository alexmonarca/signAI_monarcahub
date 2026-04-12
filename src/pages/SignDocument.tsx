import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Document, UserProfile } from '../types';
import SignatureCanvas from 'react-signature-canvas';
import { 
  ArrowLeft, 
  FileText, 
  Check, 
  RotateCcw, 
  Download, 
  Loader2,
  ShieldCheck,
  BrainCircuit,
  Upload,
  FileUp,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeContract } from '../lib/ai';
import { handleDocumentDownload } from '../lib/download';

interface SignDocumentProps {
  profile: UserProfile | null;
}

export default function SignDocument({ profile }: SignDocumentProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [signMethod, setSignMethod] = useState<'draw' | 'upload' | 'document'>('draw');
  const [uploadedSign, setUploadedSign] = useState<string | null>(null);
  const [docNumber, setDocNumber] = useState('');
  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [copyEmail, setCopyEmail] = useState('');
  const [isSendingCopy, setIsSendingCopy] = useState(false);
  const [copySent, setCopySent] = useState(false);
  const sigPad = useRef<any>(null);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setDoc(data);
    } catch (err) {
      console.error('Error fetching document:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    sigPad.current?.clear();
  };

  const save = async () => {
    let signatureData = '';

    if (signMethod === 'draw') {
      if (sigPad.current?.isEmpty()) {
        alert('Por favor, faça sua assinatura primeiro.');
        return;
      }
      try {
        signatureData = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
      } catch (err) {
        console.warn('getTrimmedCanvas failed, falling back to raw canvas:', err);
        signatureData = sigPad.current?.getCanvas().toDataURL('image/png');
      }
    } else if (signMethod === 'upload') {
      if (!uploadedSign) {
        alert('Por favor, faça o upload do documento assinado.');
        return;
      }
      signatureData = uploadedSign;
    } else {
      if (!docNumber || docNumber.length < 11) {
        alert('Por favor, insira um CPF ou CNPJ válido.');
        return;
      }
      signatureData = `SIGNED_WITH_DOC:${docNumber}`;
    }

    setIsSaving(true);
    const signatureMethod = signMethod;
    const signatureDetails = signMethod === 'document' ? docNumber : (signMethod === 'upload' ? 'Uploaded File' : 'Hand drawn');

    try {
      const signedAt = new Date().toISOString();
      const { error } = await supabase
        .from('documents')
        .update({ 
          status: 'signed',
          signature_data: signatureData,
          signed_at: signedAt,
          signature_method: signatureMethod,
          signature_details: signatureDetails
        })
        .eq('id', id);

      if (error) throw error;
      
      // Notify owner via webhook
      const webhookPayload = {
        document_id: id,
        document_title: doc?.title,
        signed_at: signedAt,
        signature_method: signatureMethod,
        signature_details: signatureDetails,
        owner_id: doc?.owner_id,
        signer_email: profile?.email || 'Public User'
      };
      
      console.log('Enviando webhook de assinatura:', webhookPayload);

      try {
        const response = await fetch('https://webhook.monarcahub.com/webhook/doc-signed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        });
        
        if (!response.ok) {
          console.warn('Webhook respondeu com erro:', response.status);
        } else {
          console.log('Webhook de notificação enviado com sucesso');
        }
      } catch (webhookErr) {
        console.warn('Failed to notify owner via webhook:', webhookErr);
      }

      setIsSigned(true);
      // Only navigate if user is logged in
      if (profile) {
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Error saving signature:', err);
      alert('Erro ao salvar assinatura.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedSign(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAiAnalysis = async () => {
    if (!doc?.content) return;
    
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeContract(doc.content);
      if (analysis) {
        const { error } = await supabase
          .from('documents')
          .update({ ai_analysis: analysis })
          .eq('id', id);
        
        if (!error) {
          setDoc({ ...doc, ai_analysis: analysis });
          setIsAiExpanded(true);
        }
      }
    } catch (err) {
      console.error('Error analyzing contract:', err);
      alert('Erro ao analisar contrato.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendCopy = async () => {
    const emailToUse = profile?.email || copyEmail;
    if (!emailToUse) return;
    setIsSendingCopy(true);
    
    const copyPayload = {
      document_id: id,
      document_title: doc?.title,
      signed_at: new Date().toISOString(),
      send_copy_to: emailToUse,
      is_copy_request: true,
      file_url: doc?.file_url,
      signature_data: doc?.signature_data,
      content: doc?.content
    };

    console.log('Solicitando cópia via webhook:', copyPayload);

    try {
      // 1. Notify owner/signer via webhook
      const response = await fetch('https://webhook.monarcahub.com/webhook/doc-signed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyPayload)
      });

      if (!response.ok) {
        console.warn('Webhook de cópia respondeu com erro:', response.status);
      }

      // 2. Update database to track that copy was requested
      await supabase
        .from('documents')
        .update({ copy_requested: true })
        .eq('id', id);

      setCopySent(true);
    } catch (err) {
      console.error('Error sending copy:', err);
      alert('Erro ao solicitar cópia.');
    } finally {
      setIsSendingCopy(false);
    }
  };

  if (isSigned) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 md:p-12 rounded-3xl shadow-xl text-center max-w-md w-full my-auto"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-4">Documento Assinado!</h2>
          <p className="text-sm md:text-base text-slate-600 mb-8">
            Sua assinatura foi processada com sucesso. O proprietário do documento será notificado.
          </p>

          {!copySent ? (
            <div className="mb-8 p-4 md:p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left">
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                Deseja receber uma cópia?
              </h4>
              
              {profile ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] md:text-xs text-slate-500 mb-4">
                    Enviaremos o documento assinado para seu e-mail: <strong>{profile.email}</strong>
                  </p>
                  <button 
                    onClick={handleSendCopy}
                    disabled={isSendingCopy}
                    className="w-full px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {isSendingCopy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enviar para meu e-mail'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-[10px] md:text-xs text-slate-500">
                    Crie sua conta para receber sua cópia e gerenciar seus documentos com validade jurídica.
                  </p>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="email" 
                      placeholder="Seu melhor e-mail"
                      value={copyEmail}
                      onChange={(e) => setCopyEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button 
                      onClick={async () => {
                        if (!copyEmail) {
                          alert('Por favor, insira seu e-mail.');
                          return;
                        }
                        await handleSendCopy();
                        // Redirect to signup with email pre-filled and a clear instruction
                        navigate(`/auth?signup=true&email=${encodeURIComponent(copyEmail)}&fromSign=true`);
                      }}
                      disabled={isSendingCopy || !copyEmail}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSendingCopy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Receber Cópia e Criar Conta</>}
                    </button>
                    <p className="text-[9px] text-slate-400 text-center">
                      Ao clicar, você será direcionado para finalizar seu cadastro rápido.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs md:text-sm flex items-center gap-2 justify-center">
              <Check className="w-4 h-4" /> Cópia solicitada com sucesso!
            </div>
          )}

          <div className="space-y-3">
            {!profile && (
              <Link to="/auth" className="btn-primary w-full py-3 block text-sm">
                Criar minha conta grátis
              </Link>
            )}
            {profile && (
              <Link to="/dashboard" className="btn-primary w-full py-3 block text-sm">
                Voltar ao Painel
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-slate-400 shrink-0" />
            <h2 className="font-bold text-slate-900 truncate text-sm md:text-base">{doc?.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => doc && handleDocumentDownload(doc)}
            className="btn-secondary py-1.5 px-3 md:px-4 text-[10px] md:text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Baixar Original</span><span className="sm:hidden">Baixar</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Document Preview */}
          <div className="md:col-span-2 space-y-6 order-2 md:order-1">
            {doc?.ai_analysis ? (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setIsAiExpanded(!isAiExpanded)}
                  className="w-full p-6 flex items-center justify-between hover:bg-blue-100/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-blue-900">Resumo da IA</h3>
                  </div>
                  {isAiExpanded ? <ChevronUp className="w-5 h-5 text-blue-400" /> : <ChevronDown className="w-5 h-5 text-blue-400" />}
                </button>
                
                <AnimatePresence>
                  {isAiExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 pt-0 space-y-4 border-t border-blue-100/50 mt-2">
                        <div>
                          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Resumo Geral</h4>
                          <p className="text-sm text-blue-800/80 leading-relaxed">{doc.ai_analysis.summary}</p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Pontos Positivos</h4>
                            <ul className="space-y-1">
                              {doc.ai_analysis.positive_points.map((point, i) => (
                                <li key={i} className="text-xs text-emerald-800/70 flex gap-2">
                                  <span className="text-emerald-500">•</span> {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Pontos de Atenção</h4>
                            <ul className="space-y-1">
                              {doc.ai_analysis.attention_points.map((point, i) => (
                                <li key={i} className="text-xs text-amber-800/70 flex gap-2">
                                  <span className="text-amber-500">•</span> {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : profile ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Análise IA disponível</h4>
                    <p className="text-xs text-slate-500">Gere um resumo inteligente deste contrato.</p>
                  </div>
                </div>
                <button 
                  onClick={handleAiAnalysis}
                  disabled={isAnalyzing}
                  className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                  Resumir agora
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center justify-between opacity-75 grayscale-[0.5]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">Análise IA (Exclusivo)</h4>
                    <p className="text-[10px] text-slate-500">Crie uma conta gratuita para usar o Analista IA.</p>
                  </div>
                </div>
                <Link 
                  to="/auth?signup=true"
                  className="btn-secondary py-2 px-4 text-[10px] font-bold"
                >
                  Criar Conta
                </Link>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px] md:min-h-[600px] flex flex-col">
              <div className="bg-slate-50 p-3 md:p-4 border-b border-slate-100 flex justify-between items-center">
                <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Visualização do Documento</span>
                <span className="text-[10px] md:text-xs text-slate-400">Página 1 de 1</span>
              </div>
              <div className="flex-1 p-0 flex flex-col items-center justify-start overflow-hidden">
                {doc?.file_url ? (
                  <iframe 
                    src={`${doc.file_url}#toolbar=0`}
                    className="w-full h-full min-h-[500px] md:min-h-[800px] border-none"
                    title="Document Preview"
                  />
                ) : doc?.content ? (
                  <div className="p-4 md:p-12 w-full space-y-4 overflow-y-auto max-h-[500px] md:max-h-[800px] scroll-smooth">
                    <div className="text-left w-full space-y-4 overflow-x-hidden">
                      <h3 className="text-lg md:text-xl font-bold text-slate-900 border-b pb-4 mb-6 break-words">{doc.title}</h3>
                      <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap font-sans leading-relaxed text-sm md:text-base break-words">
                        {doc.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 md:p-12 flex flex-col items-center justify-center space-y-6">
                    <FileText className="w-24 h-24 text-slate-100" />
                    <div className="max-w-sm space-y-2 text-center">
                      <h3 className="text-xl font-bold text-slate-900">{doc?.title}</h3>
                      <p className="text-slate-500 text-sm">
                        Visualização não disponível.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Signature Pad */}
          <div className="space-y-6 order-1 md:order-2">
            <div className="card md:sticky md:top-24">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-900">Assinar Documento</h3>
              </div>

              {/* Method Switcher */}
              <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button 
                  onClick={() => setSignMethod('draw')}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${signMethod === 'draw' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Rabisco
                </button>
                <button 
                  onClick={() => setSignMethod('document')}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${signMethod === 'document' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  CPF/CNPJ
                </button>
                <button 
                  onClick={() => setSignMethod('upload')}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${signMethod === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Upload
                </button>
              </div>

              {signMethod === 'draw' ? (
                <>
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden mb-4">
                    <SignatureCanvas 
                      ref={sigPad}
                      penColor="#0f172a"
                      canvasProps={{
                        className: "w-full h-48 cursor-crosshair"
                      }}
                    />
                  </div>

                  <div className="flex gap-2 mb-6">
                    <button 
                      onClick={clear}
                      className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3 h-3" /> LIMPAR
                    </button>
                  </div>
                </>
              ) : signMethod === 'document' ? (
                <div className="mb-6 space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Número do Documento</label>
                    <div className="relative">
                      <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="000.000.000-00"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    Ao usar seu documento oficial, sua assinatura será validada através da autenticação de identidade da Sign AI.
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block">
                    <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${uploadedSign ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                      {uploadedSign ? (
                        <>
                          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mb-3">
                            <Check className="text-white w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-emerald-900">Arquivo Carregado</p>
                          <p className="text-xs text-emerald-600 mt-1">Clique para trocar</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-300 mb-3" />
                          <p className="text-sm font-bold text-slate-900">Upload do Assinado</p>
                          <p className="text-xs text-slate-500 mt-1">PDF, JPG ou PNG</p>
                        </>
                      )}
                      <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
                    </div>
                  </label>
                </div>
              )}

              <div className="space-y-3">
                <button 
                  onClick={save}
                  disabled={isSaving}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Finalizar Assinatura
                </button>
                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                  Ao clicar em finalizar, você concorda que esta assinatura digital tem plena validade jurídica conforme os termos de uso da Sign AI.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                  <ShieldCheck className="text-white w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 mb-1">Assinatura Segura</h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Sua assinatura será vinculada ao seu ID de usuário e timestamp para garantir a integridade do documento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
