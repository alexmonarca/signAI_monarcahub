import { jsPDF } from 'jspdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document } from '../types';

export const handleDocumentDownload = async (doc: Document) => {
  // If it's signed, we append a signature certificate to the original PDF
  if (doc.status === 'signed' && doc.file_url) {
    try {
      await generateSignedPDFWithOriginal(doc);
      return;
    } catch (err) {
      console.error('Error generating signed PDF with original, falling back to basic:', err);
      // Fallback to basic if something goes wrong with pdf-lib
    }
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

  // Fallback for pending docs without file_url or if signed generation failed
  generateBasicPDF(doc);
};

const generateSignedPDFWithOriginal = async (doc: Document) => {
  if (!doc.file_url) throw new Error('No file URL available');

  // 1. Fetch the original PDF
  const response = await fetch(doc.file_url);
  const originalPdfBytes = await response.arrayBuffer();

  // 2. Load the original PDF with pdf-lib
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pages = pdfDoc.getPages();
  
  // 3. Add a new page for the Signature Certificate
  const certificatePage = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = certificatePage.getSize();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // 4. Draw Header
  certificatePage.drawText('Certificado de Assinatura Digital', {
    x: 50,
    y: height - 60,
    size: 24,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16), // slate-900
  });

  certificatePage.drawText(`Documento: ${doc.title}`, {
    x: 50,
    y: height - 90,
    size: 12,
    font: fontRegular,
    color: rgb(0.28, 0.33, 0.41), // slate-600
  });

  // 5. Draw Signature Section
  let currentY = height - 150;
  certificatePage.drawLine({
    start: { x: 50, y: currentY },
    end: { x: width - 50, y: currentY },
    thickness: 1,
    color: rgb(0.89, 0.91, 0.94), // slate-200
  });
  currentY -= 40;

  certificatePage.drawText('Assinatura Digital', {
    x: 50,
    y: currentY,
    size: 14,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });
  currentY -= 60;

  if (doc.signature_data) {
    try {
      // Embed the signature image
      const signatureImage = await pdfDoc.embedPng(doc.signature_data);
      const sigDims = signatureImage.scale(0.5);
      certificatePage.drawImage(signatureImage, {
        x: 50,
        y: currentY,
        width: 150,
        height: 75,
      });
      currentY -= 30;
    } catch (e) {
      console.error('Error adding signature image to PDF:', e);
      certificatePage.drawText('[Assinatura Visual Indisponível]', {
        x: 50,
        y: currentY,
        size: 10,
        font: fontItalic,
        color: rgb(0.39, 0.45, 0.55),
      });
      currentY -= 20;
    }
  }

  // 6. Draw Audit Info
  currentY -= 40;
  certificatePage.drawText(`Assinado por: ${doc.signer_email || 'Usuário Público'}`, {
    x: 50,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.39, 0.45, 0.55),
  });
  currentY -= 15;
  certificatePage.drawText(`Data e Hora: ${new Date(doc.signed_at || doc.created_at).toLocaleString('pt-BR')}`, {
    x: 50,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.39, 0.45, 0.55),
  });
  currentY -= 15;
  certificatePage.drawText(`ID de Autenticidade: ${doc.id}`, {
    x: 50,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.39, 0.45, 0.55),
  });

  // 7. Authenticity Seal (Bottom Right)
  const sealWidth = 160;
  const sealHeight = 80;
  const sealX = width - sealWidth - 50;
  const sealY = 50;

  // Seal Background
  certificatePage.drawRectangle({
    x: sealX,
    y: sealY,
    width: sealWidth,
    height: sealHeight,
    borderWidth: 1,
    borderColor: rgb(0.06, 0.09, 0.16),
    color: rgb(0.97, 0.98, 0.99), // slate-50
  });

  // Seal Text
  certificatePage.drawText('AUTENTICIDADE GARANTIDA', {
    x: sealX + 45,
    y: sealY + sealHeight - 20,
    size: 7,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });

  certificatePage.drawText('SignAI', {
    x: sealX + 55,
    y: sealY + sealHeight - 45,
    size: 18,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });

  certificatePage.drawText('Verificado por Inteligência Artificial', {
    x: sealX + 35,
    y: sealY + sealHeight - 65,
    size: 6,
    font: fontRegular,
    color: rgb(0.39, 0.45, 0.55),
  });

  // Seal Icon (Checkmark)
  certificatePage.drawCircle({
    x: sealX + 25,
    y: sealY + sealHeight - 40,
    size: 12,
    borderWidth: 2,
    borderColor: rgb(0.13, 0.77, 0.37), // emerald-500
  });
  certificatePage.drawText('V', {
    x: sealX + 20,
    y: sealY + sealHeight - 45,
    size: 14,
    font: fontBold,
    color: rgb(0.13, 0.77, 0.37),
  });

  // 8. Save and Download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${doc.title}_assinado.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
