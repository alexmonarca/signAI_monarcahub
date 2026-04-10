import { jsPDF } from 'jspdf';
import { Document } from '../types';

export const handleDocumentDownload = (doc: Document) => {
  if (doc.file_url) {
    // Attempt to download the original file
    const link = document.createElement('a');
    link.href = doc.file_url;
    link.download = doc.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Fallback to generating a PDF from content if original is missing
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
  
  // Add signature info if signed
  if (doc.status === 'signed') {
    const finalY = 40 + (splitText.length * 5) + 20;
    pdf.setFont('helvetica', 'italic');
    pdf.text('Documento assinado digitalmente via Sign AI', margin, finalY);
  }
  
  pdf.save(`${doc.title}.pdf`);
};
