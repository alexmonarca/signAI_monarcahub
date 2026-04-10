import { jsPDF } from 'jspdf';
import { Document } from '../types';

export const handleDocumentDownload = (doc: Document) => {
  if (doc.file_url) {
    // If we have the original file URL, open it
    window.open(doc.file_url, '_blank');
    return;
  }

  // Otherwise generate a PDF from content
  const pdf = new jsPDF();
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const textWidth = pageWidth - (margin * 2);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(doc.title, margin, 25);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  
  const splitText = pdf.splitTextToSize(doc.content || '', textWidth);
  pdf.text(splitText, margin, 40);
  
  pdf.save(`${doc.title}.pdf`);
};
