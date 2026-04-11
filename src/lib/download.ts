import { jsPDF } from 'jspdf';
import { Document } from '../types';

export const handleDocumentDownload = (doc: Document) => {
  // If it's signed, we ALWAYS generate a new PDF that includes the signature and authenticity seal
  if (doc.status === 'signed') {
    generateSignedPDF(doc);
    return;
  }

  // If not signed and has original file, download original
  if (doc.file_url) {
    const link = document.createElement('a');
    link.href = doc.file_url;
    link.download = doc.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Fallback for pending docs without file_url
  generateBasicPDF(doc);
};

const generateBasicPDF = (doc: Document) => {
  const pdf = new jsPDF();
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const textWidth = pageWidth - (margin * 2);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(doc.title, margin, 25);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  const splitText = pdf.splitTextToSize(doc.content || 'Sem conteúdo disponível.', textWidth);
  pdf.text(splitText, margin, 40);
  
  pdf.save(`${doc.title}.pdf`);
};

const generateSignedPDF = (doc: Document) => {
  const pdf = new jsPDF();
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const textWidth = pageWidth - (margin * 2);
  
  // Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.text(doc.title, margin, 25);
  
  // Content
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105); // slate-600
  
  const splitText = pdf.splitTextToSize(doc.content || 'Sem conteúdo disponível.', textWidth);
  pdf.text(splitText, margin, 40);
  
  // Signature Section
  let currentY = 40 + (splitText.length * 5) + 20;
  
  // Check if we need a new page
  if (currentY > pageHeight - 100) {
    pdf.addPage();
    currentY = 30;
  }
  
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 15;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Assinatura Digital', margin, currentY);
  currentY += 10;
  
  if (doc.signature_data) {
    try {
      // signature_data is usually a dataURL
      pdf.addImage(doc.signature_data, 'PNG', margin, currentY, 50, 25);
      currentY += 30;
    } catch (e) {
      console.error('Error adding signature image to PDF:', e);
      pdf.setFont('helvetica', 'italic');
      pdf.text('[Assinatura Visual Indisponível]', margin, currentY);
      currentY += 10;
    }
  }
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text(`Assinado por: ${doc.signer_email || 'Usuário Público'}`, margin, currentY);
  currentY += 5;
  pdf.text(`Data: ${new Date(doc.signed_at || doc.created_at).toLocaleString('pt-BR')}`, margin, currentY);
  currentY += 5;
  pdf.text(`ID de Autenticidade: ${doc.id}`, margin, currentY);
  
  // Authenticity Seal (Bottom Right)
  const sealX = pageWidth - 75;
  const sealY = pageHeight - 45;
  
  // Seal Background
  pdf.setDrawColor(15, 23, 42); // slate-900
  pdf.setLineWidth(0.5);
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.rect(sealX, sealY, 55, 30, 'FD');
  
  // Seal Text
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(15, 23, 42);
  pdf.text('AUTENTICIDADE GARANTIDA', sealX + 15, sealY + 8);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text('SignAI', sealX + 18, sealY + 18);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Verificado por Inteligência Artificial', sealX + 12, sealY + 25);
  
  // Seal Icon (Checkmark)
  pdf.setDrawColor(34, 197, 94); // emerald-500
  pdf.setLineWidth(1);
  pdf.circle(sealX + 8, sealY + 15, 4, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(34, 197, 94);
  pdf.text('V', sealX + 6.5, sealY + 16.5);
  
  pdf.save(`${doc.title}_assinado.pdf`);
};
