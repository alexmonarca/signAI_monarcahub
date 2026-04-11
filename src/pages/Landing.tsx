import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Check, Shield, Zap, FileText, ArrowRight, BrainCircuit, Palette, X, Copy, ExternalLink, Globe } from 'lucide-react';
import { UserProfile, PLAN_PRICES } from '../types';
import Logo from '../components/Logo';

type Currency = 'BRL' | 'USD' | 'EUR';

interface LandingProps {
  profile: UserProfile | null;
}

const translations = {
  BRL: {
    heroTag: 'Assinaturas digitais simplificadas',
    heroTitle1: 'Assine documentos em',
    heroTitle2: 'segundos',
    heroTitle3: 'com IA.',
    heroSubtitle: 'A maneira mais rápida e segura de gerenciar suas assinaturas eletrônicas. Comece gratuitamente e escale conforme seu negócio cresce.',
    ctaStart: 'Criar conta grátis',
    ctaPricing: 'Ver planos',
    login: 'Entrar',
    startFree: 'Começar Grátis',
    featuresTitle: 'Potencialize sua gestão com IA',
    featuresSubtitle: 'Recursos inteligentes para acelerar seus processos jurídicos.',
    feature1Title: 'Analista de Contratos IA',
    feature1Desc: 'Nossa IA resume seus documentos e esclarece pontos positivos e de atenção automaticamente.',
    feature2Title: 'Criador de Contratos IA',
    feature2Desc: 'Gere minutas completas em segundos apenas descrevendo o que você precisa.',
    feature3Title: 'Branding Personalizado',
    feature3Desc: 'Insira sua logo e identidade visual em documentos, e-mails e páginas de assinatura.',
    pricingTitle: 'Planos para todos os tamanhos',
    pricingSubtitle: 'Escolha o plano ideal para suas necessidades.',
    footerCopyright: '© 2026 Sign AI. Um produto Monarca Hub.',
    footerTerms: 'Termos',
    footerPrivacy: 'Privacidade',
    footerContact: 'Contato',
    modalTitle: 'Assinar Plano Pro',
    modalPixDesc: 'Faça um PIX com o valor para',
    modalCopyKey: 'Copiar Chave PIX',
    modalCopied: 'Copiado!',
    modalWhatsappDesc: 'Depois envie o comprovante para o nosso WhatsApp para liberação imediata:',
    modalWhatsappBtn: 'Enviar Comprovante no WhatsApp',
    modalFooterNote: 'Assim que o pagamento for reconhecido no sistema, atualize sua página e sua assinatura Pro será reconhecida em seu painel.',
    planFreeName: 'Grátis',
    planFreeDesc: 'Para uso pessoal básico',
    planProName: 'Pro',
    planProDesc: 'Para profissionais liberais',
    planBusinessName: 'Business',
    planBusinessDesc: 'Para empresas em escala',
    mostPopular: 'MAIS POPULAR',
    startNow: 'Começar agora',
    subscribePro: 'Assinar Pro',
    talkToSales: 'Falar com vendas',
    features: {
      docsMonth: 'documentos/mês',
      basicSign: 'Assinatura básica',
      aiAnalyst: 'Analista de contratos',
      emailSupport: 'Suporte via email',
      unlimitedSigns: 'Assinaturas ilimitadas',
      aiCreator: 'Criador de contratos com IA',
      customBranding: 'Branding personalizado',
      allFreePro: 'Tudo do Plano Grátis e Pro',
      unlimitedDocs: 'Documentos ilimitados',
      prioritySupport: 'Suporte prioritário',
      apiIntegration: 'API de integração',
      multipleUsers: 'Múltiplos usuários',
    }
  },
  USD: {
    heroTag: 'Simplified digital signatures',
    heroTitle1: 'Sign documents in',
    heroTitle2: 'seconds',
    heroTitle3: 'with AI.',
    heroSubtitle: 'The fastest and safest way to manage your electronic signatures. Start for free and scale as your business grows.',
    ctaStart: 'Create free account',
    ctaPricing: 'View plans',
    login: 'Login',
    startFree: 'Start Free',
    featuresTitle: 'Power your management with AI',
    featuresSubtitle: 'Smart features to accelerate your legal processes.',
    feature1Title: 'AI Contract Analyst',
    feature1Desc: 'Our AI summarizes your documents and clarifies positive and attention points automatically.',
    feature2Title: 'AI Contract Creator',
    feature2Desc: 'Generate complete drafts in seconds just by describing what you need.',
    feature3Title: 'Custom Branding',
    feature3Desc: 'Insert your logo and visual identity in documents, emails, and signature pages.',
    pricingTitle: 'Plans for all sizes',
    pricingSubtitle: 'Choose the ideal plan for your needs.',
    footerCopyright: '© 2026 Sign AI. A Monarca Hub product.',
    footerTerms: 'Terms',
    footerPrivacy: 'Privacy',
    footerContact: 'Contact',
    modalTitle: 'Subscribe to Pro Plan',
    modalPixDesc: 'Make a PIX payment (or international transfer) to',
    modalCopyKey: 'Copy Payment Key',
    modalCopied: 'Copied!',
    modalWhatsappDesc: 'Then send the receipt to our WhatsApp for immediate activation:',
    modalWhatsappBtn: 'Send Receipt via WhatsApp',
    modalFooterNote: 'Once the payment is recognized in the system, refresh your page and your Pro subscription will be active in your dashboard.',
    planFreeName: 'Free',
    planFreeDesc: 'For basic personal use',
    planProName: 'Pro',
    planProDesc: 'For freelancers',
    planBusinessName: 'Business',
    planBusinessDesc: 'For scaling businesses',
    mostPopular: 'MOST POPULAR',
    startNow: 'Start now',
    subscribePro: 'Subscribe Pro',
    talkToSales: 'Talk to sales',
    features: {
      docsMonth: 'documents/month',
      basicSign: 'Basic signature',
      aiAnalyst: 'AI contract analyst',
      emailSupport: 'Email support',
      unlimitedSigns: 'Unlimited signatures',
      aiCreator: 'AI contract creator',
      customBranding: 'Custom branding',
      allFreePro: 'Everything in Free and Pro',
      unlimitedDocs: 'Unlimited documents',
      prioritySupport: 'Priority support',
      apiIntegration: 'API integration',
      multipleUsers: 'Multiple users',
    }
  },
  EUR: {
    heroTag: 'Firmas digitales simplificadas',
    heroTitle1: 'Firme documentos en',
    heroTitle2: 'segundos',
    heroTitle3: 'con IA.',
    heroSubtitle: 'La forma más rápida y segura de gestionar sus firmas electrónicas. Comience gratis y escale a medida que su negocio crezca.',
    ctaStart: 'Crear cuenta gratis',
    ctaPricing: 'Ver planes',
    login: 'Entrar',
    startFree: 'Empezar Gratis',
    featuresTitle: 'Potencie su gestión con IA',
    featuresSubtitle: 'Funciones inteligentes para acelerar sus procesos legales.',
    feature1Title: 'Analista de Contratos IA',
    feature1Desc: 'Nuestra IA resume sus documentos y aclara puntos positivos e importantes automáticamente.',
    feature2Title: 'Creador de Contratos IA',
    feature2Desc: 'Genere borradores completos en segundos con solo describir lo que necesita.',
    feature3Title: 'Branding Personalizado',
    feature3Desc: 'Inserte su logo e identidad visual en documentos, correos electrónicos e páginas de firma.',
    pricingTitle: 'Planes para todos los tamaños',
    pricingSubtitle: 'Elija el plan ideal para sus necesidades.',
    footerCopyright: '© 2026 Sign AI. Un producto de Monarca Hub.',
    footerTerms: 'Términos',
    footerPrivacy: 'Privacidad',
    footerContact: 'Contacto',
    modalTitle: 'Suscribirse al Plan Pro',
    modalPixDesc: 'Realice um pago PIX (o transferencia internacional) a',
    modalCopyKey: 'Copiar clave de pago',
    modalCopied: '¡Copiado!',
    modalWhatsappDesc: 'Luego envíe el comprobante a nuestro WhatsApp para la activación inmediata:',
    modalWhatsappBtn: 'Enviar comprobante por WhatsApp',
    modalFooterNote: 'Una vez que se reconozca el pago en el sistema, actualice su página e su suscripción Pro se activará en su panel.',
    planFreeName: 'Gratis',
    planFreeDesc: 'Para uso personal básico',
    planProName: 'Pro',
    planProDesc: 'Para profesionales independientes',
    planBusinessName: 'Business',
    planBusinessDesc: 'Para empresas en crecimiento',
    mostPopular: 'MÁS POPULAR',
    startNow: 'Empezar ahora',
    subscribePro: 'Suscribirse a Pro',
    talkToSales: 'Hablar con ventas',
    features: {
      docsMonth: 'documentos/mes',
      basicSign: 'Firma básica',
      aiAnalyst: 'Analista de contratos IA',
      emailSupport: 'Soporte por email',
      unlimitedSigns: 'Firmas ilimitadas',
      aiCreator: 'Creador de contratos con IA',
      customBranding: 'Branding personalizado',
      allFreePro: 'Todo lo de los planes Gratis y Pro',
      unlimitedDocs: 'Documentos ilimitados',
      prioritySupport: 'Soporte prioritario',
      apiIntegration: 'API de integración',
      multipleUsers: 'Múltiples usuarios',
    }
  }
};

const FlagButtons = ({ currency, setCurrency }: { currency: Currency, setCurrency: (c: Currency) => void }) => (
  <>
    <button 
      onClick={() => setCurrency('BRL')}
      className={`transition-opacity ${currency === 'BRL' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
      title="Português / BRL"
    >
      <img src="https://flagcdn.com/w40/br.png" alt="Brasil" className="w-5 h-auto rounded-sm shadow-sm" referrerPolicy="no-referrer" />
    </button>
    <button 
      onClick={() => setCurrency('USD')}
      className={`transition-opacity ${currency === 'USD' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
      title="English / USD"
    >
      <img src="https://flagcdn.com/w40/us.png" alt="USA" className="w-5 h-auto rounded-sm shadow-sm" referrerPolicy="no-referrer" />
    </button>
    <button 
      onClick={() => setCurrency('USD')}
      className={`transition-opacity ${currency === 'USD' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
      title="English / USD"
    >
      <img src="https://flagcdn.com/w40/gb.png" alt="UK" className="w-5 h-auto rounded-sm shadow-sm" referrerPolicy="no-referrer" />
    </button>
    <button 
      onClick={() => setCurrency('EUR')}
      className={`transition-opacity ${currency === 'EUR' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
      title="Español / EUR"
    >
      <img src="https://flagcdn.com/w40/es.png" alt="Espanha" className="w-5 h-auto rounded-sm shadow-sm" referrerPolicy="no-referrer" />
    </button>
  </>
);

export default function Landing({ profile }: LandingProps) {
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currency, setCurrency] = useState<Currency>('BRL');

  useEffect(() => {
    const lang = navigator.language.toLowerCase();
    if (lang.includes('pt')) {
      setCurrency('BRL');
    } else if (lang.includes('es')) {
      setCurrency('EUR');
    } else {
      setCurrency('USD');
    }
  }, []);

  useEffect(() => {
    const langMap = {
      BRL: 'pt-BR',
      USD: 'en-US',
      EUR: 'es-ES'
    };
    document.documentElement.lang = langMap[currency];
  }, [currency]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText('pix@monarcahub.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between min-h-[4rem] sm:h-16 items-center py-2 sm:py-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
              <div className="flex items-center gap-4">
                <Link to="/" className="flex items-center">
                  <Logo size="md" />
                </Link>
                
                {/* Flags - Desktop: Right of logo */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                  <FlagButtons currency={currency} setCurrency={setCurrency} />
                </div>
              </div>

              {/* Mobile Flags Container - Below logo */}
              <div className="flex sm:hidden items-center gap-2 px-2 py-1 bg-slate-50 rounded-full border border-slate-100 w-fit">
                <FlagButtons currency={currency} setCurrency={setCurrency} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              {profile ? (
                <Link to="/dashboard" className="btn-primary py-2">Dashboard</Link>
              ) : (
                <>
                  <Link to="/auth" className="text-slate-600 font-medium hover:text-slate-900">
                    {translations[currency].login}
                  </Link>
                  <Link to="/auth" className="btn-primary py-2">
                    {translations[currency].startFree}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-medium mb-6 inline-block">
              {translations[currency].heroTag}
            </span>
            <h1 className="text-4xl md:text-7xl font-display font-bold text-slate-900 mb-6 tracking-tight">
              {translations[currency].heroTitle1} <br />
              <span className="text-slate-500 italic">{translations[currency].heroTitle2}</span> {translations[currency].heroTitle3}
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              {translations[currency].heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth" className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2">
                {translations[currency].ctaStart} <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#pricing" className="btn-secondary text-lg px-8 py-4">
                {translations[currency].ctaPricing}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">{translations[currency].featuresTitle}</h2>
            <p className="text-slate-600">{translations[currency].featuresSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <BrainCircuit className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{translations[currency].feature1Title}</h3>
              <p className="text-slate-600">{translations[currency].feature1Desc}</p>
            </div>
            <div className="card">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-emerald-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{translations[currency].feature2Title}</h3>
              <p className="text-slate-600">{translations[currency].feature2Desc}</p>
            </div>
            <div className="card">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                <Palette className="text-purple-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{translations[currency].feature3Title}</h3>
              <p className="text-slate-600">{translations[currency].feature3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">{translations[currency].pricingTitle}</h2>
            <p className="text-slate-600">{translations[currency].pricingSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="card flex flex-col">
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {translations[currency].planFreeName}
                </h3>
                <div className="text-4xl font-bold mb-2">{PLAN_PRICES[currency].free}</div>
                <p className="text-slate-500">
                  {translations[currency].planFreeDesc}
                </p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500" /> 3 {translations[currency].features.docsMonth}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500" /> {translations[currency].features.basicSign}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500" /> {translations[currency].features.aiAnalyst}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500" /> {translations[currency].features.emailSupport}
                </li>
              </ul>
              <Link to="/auth" className="btn-secondary w-full text-center">{translations[currency].startNow}</Link>
            </div>

            {/* Pro */}
            <div className="card flex flex-col border-slate-900 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1 rounded-full text-sm font-bold">
                {translations[currency].mostPopular}
              </div>
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-2">{translations[currency].planProName}</h3>
                <div className="text-4xl font-bold mb-2">{PLAN_PRICES[currency].pro}</div>
                <p className="text-slate-500">
                  {translations[currency].planProDesc}
                </p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500" /> 50 {translations[currency].features.docsMonth}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500" /> {translations[currency].features.unlimitedSigns}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500" /> {translations[currency].features.aiCreator}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500" /> {translations[currency].features.customBranding}
                </li>
              </ul>
              <button 
                onClick={() => setIsPixModalOpen(true)}
                className="btn-primary w-full text-center"
              >
                {translations[currency].subscribePro}
              </button>
            </div>

            {/* Business */}
            <div className="card flex flex-col">
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-2">{translations[currency].planBusinessName}</h3>
                <div className="text-4xl font-bold mb-2">{PLAN_PRICES[currency].business}</div>
                <p className="text-slate-500">{translations[currency].planBusinessDesc}</p>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-slate-600 font-bold">
                  <Check className="w-5 h-5 text-emerald-500" /> {translations[currency].features.allFreePro}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500" /> {translations[currency].features.unlimitedDocs}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500" /> {translations[currency].features.prioritySupport}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500" /> {translations[currency].features.apiIntegration}
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500" /> {translations[currency].features.multipleUsers}
                </li>
              </ul>
              <a 
                href="https://wa.me/5555996804923" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-secondary w-full text-center flex items-center justify-center gap-2"
              >
                {translations[currency].talkToSales}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <Logo size="sm" />
          <p className="text-slate-500 text-sm">{translations[currency].footerCopyright}</p>
          <div className="flex gap-6 text-sm text-slate-600">
            <a href="https://www.monarcahub.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">{translations[currency].footerTerms}</a>
            <a href="https://www.monarcahub.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">{translations[currency].footerPrivacy}</a>
            <a href="https://wa.me/5555996804923" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">{translations[currency].footerContact}</a>
          </div>
        </div>
      </footer>

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
                <h3 className="text-xl font-bold text-slate-900">{translations[currency].modalTitle}</h3>
                <button onClick={() => setIsPixModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-8">
                <div className="bg-blue-50 p-6 rounded-2xl mb-6 border border-blue-100">
                  <p className="text-slate-700 text-sm leading-relaxed mb-4">
                    {translations[currency].modalPixDesc} <span className="font-bold text-slate-900">pix@monarcahub.com</span>
                  </p>
                  <button 
                    onClick={handleCopyPix}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-blue-200 rounded-xl text-blue-600 font-bold text-sm hover:bg-blue-50 transition-all active:scale-95"
                  >
                    {copied ? (
                      <><Check className="w-4 h-4" /> {translations[currency].modalCopied}</>
                    ) : (
                      <><Copy className="w-4 h-4" /> {translations[currency].modalCopyKey}</>
                    )}
                  </button>
                </div>

                <div className="space-y-6">
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {translations[currency].modalWhatsappDesc}
                  </p>
                  
                  <a 
                    href="https://wa.me/5555996804923" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    {translations[currency].modalWhatsappBtn}
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                      {translations[currency].modalFooterNote}
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
