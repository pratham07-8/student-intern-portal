import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a professional training letter PDF for the Student Intern Portal
 * @param {Object} trainee - The trainee database object (full_name, salutation, institute, dates, area_of_training)
 * @param {Object} guide - The guide database object (full_name, salutation, designation, department)
 * @param {Object} proposer - The proposer database object (name, department, email)
 * @param {Object} [hrUser] - Optional HR GM user object (name, designation, signature_url)
 * @param {String} [customSignature] - Optional custom HR signature URL or Base64 image
 * @returns {Promise<Buffer>} - Buffer containing the generated PDF
 */
export const generateTrainingLetterPDF = (trainee, guide, proposer, hrUser = null, customSignature = null) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 54 // 0.75 inch standard margins
    });
    
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);

    // --- Header / Logo ---
    let logoDrawn = false;
    const possibleLogoPaths = [
      path.join(__dirname, '../assets/logo.png'),
      path.join(__dirname, '../../client/src/assets/logo.png'),
      path.join(__dirname, '../../client/public/logo.png'),
      path.resolve('server/assets/logo.png'),
      path.resolve('assets/logo.png'),
      path.resolve('student-intern-portal/server/assets/logo.png'),
      path.resolve('student-intern-portal/client/public/logo.png'),
      path.resolve('client/public/logo.png')
    ];

    for (const logoPath of possibleLogoPaths) {
      if (fs.existsSync(logoPath)) {
        try {
          const logoBuffer = fs.readFileSync(logoPath);
          doc.image(logoBuffer, 54, 28, { width: 140 });
          logoDrawn = true;
          break;
        } catch (e) {
          console.error("Error drawing logo in PDF:", e);
        }
      }
    }
    
    if (!logoDrawn) {
      // Fallback branded logo header
      doc.rect(54, 28, 160, 36).lineWidth(1.5).strokeColor('#1e3a8a').stroke();
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e3a8a').text('STUDENT INTERN PORTAL', 62, 40);
    }
    
    doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text('Vocational Training & Internship Management System', 54, 82);
    
    // --- Ref No & Date ---
    const formatDateDot = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    };

    const refNumber = `Ref.No.01: SIP: HR: TRG:${trainee?.id || 26}`;
    const currentDate = formatDateDot(new Date());

    const refY = 102;
    doc.fillColor('#1e293b').fontSize(10.5).font('Helvetica-Bold');
    doc.text(refNumber, 54, refY);
    doc.text(`Date: ${currentDate}`, 380, refY, { align: 'right' });
    
    // --- Recipient Box ---
    doc.font('Helvetica').fontSize(10.5).text('To,', 54, 128);
    doc.moveDown(0.25);
    
    const traineeFullName = `${trainee?.salutation || 'Mr.'} ${trainee?.full_name || 'Candidate Name'}`;
    doc.font('Helvetica-Bold').text(traineeFullName);
    
    const rawInstitute = trainee?.institute || '';
    let addressLines = [];
    if (rawInstitute.includes('\n')) {
      addressLines = rawInstitute.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    } else {
      addressLines = rawInstitute.split(',').map(l => l.trim()).filter(Boolean);
    }

    addressLines = addressLines.map((line, idx) => {
      const cleanLine = line.replace(/,\s*$/, '');
      return (idx < addressLines.length - 1) ? `${cleanLine},` : cleanLine;
    });

    if (addressLines.length > 0 && !addressLines[addressLines.length - 1].toLowerCase().includes('india')) {
      addressLines[addressLines.length - 1] += ', India';
    }

    doc.font('Helvetica');
    addressLines.forEach(line => {
      doc.text(line, { lineGap: 1.5 });
    });
    
    // --- Dear Sir/Madam ---
    doc.moveDown(0.8);
    doc.text('Dear Sir/Madam,');
    
    // --- Body Paragraphs ---
    // Paragraph 1
    doc.moveDown(0.7);
    doc.text('Kindly refer to your application regarding the vocational training / internship program with the Student Intern & Vocational Training Management division.', { lineGap: 3.5, align: 'justify' });
    
    // Paragraph 2 (with bold dates and guide details)
    const fromDateStr = formatDateDot(trainee?.from_date);
    const toDateStr = formatDateDot(trainee?.to_date);
    const guideSalutation = guide?.salutation || 'Mr./Ms.';
    const guideFullName = guide?.full_name || 'Guide Name';
    const guideDesig = guide?.designation || 'DGM';
    const guideDept = guide?.department || 'IT';

    doc.moveDown(0.8);
    doc.text('We are pleased to inform you that you have been approved and accommodated for internship / vocational training w.e.f. ', { continued: true, lineGap: 4, align: 'justify' });
    doc.font('Helvetica-Bold').text(fromDateStr, { continued: true });
    doc.font('Helvetica').text(' to ', { continued: true });
    doc.font('Helvetica-Bold').text(toDateStr, { continued: true });
    doc.font('Helvetica').text('. You are advised to report to ', { continued: true });
    
    const guideText = `${guideSalutation} ${guideFullName}, ${guideDesig}, ${guideDept}`;
    doc.font('Helvetica-Bold').text(guideText, { continued: true });
    doc.font('Helvetica').text(', Corporate Centre / Human Resource Development Division for further orientation and guidance. You are requested to be physically present on all working days during the scheduled training period.');
    
    // Paragraph 3
    doc.moveDown(0.8);
    doc.text('We may, however, inform that as per organizational guidelines, the management will not bear any liability financial or otherwise. During the training, you will have to make your own arrangements for boarding, lodging and traveling etc. It is expected from you to strictly follow organizational code of conduct, security rules & regulations and display good discipline, failing which permission can be withdrawn any time without assigning any reasons.', { lineGap: 4, align: 'justify' });
    
    // --- Sign off ---
    doc.moveDown(1.1);
    doc.text('Thanking you.');
    doc.moveDown(0.7);
    doc.text('Yours faithfully');
    
    // --- HR Signature Rendering Block ---
    const sigY = doc.y;
    let sigDrawn = false;
    
    // Check if custom signature (Base64 / URL / path) is supplied
    const sigSource = customSignature || hrUser?.signature_url;
    if (sigSource) {
      try {
        if (sigSource.startsWith('data:image')) {
          const base64Data = sigSource.replace(/^data:image\/\w+;base64,/, '');
          const imgBuf = Buffer.from(base64Data, 'base64');
          doc.image(imgBuf, 54, sigY + 2, { width: 120, height: 42 });
          sigDrawn = true;
        } else if (fs.existsSync(sigSource)) {
          doc.image(sigSource, 54, sigY + 2, { width: 120 });
          sigDrawn = true;
        }
      } catch (e) {
        console.error("Error rendering signature image in PDF:", e);
      }
    }

    // Default static image fallback if available in server assets
    if (!sigDrawn) {
      try {
        const defaultSigPaths = [
          path.resolve('student-intern-portal/server/assets/signature.png'),
          path.resolve('server/assets/signature.png'),
          path.resolve('assets/signature.png'),
          path.join(__dirname, '../assets/signature.png')
        ];
        for (const defaultSigPath of defaultSigPaths) {
          if (fs.existsSync(defaultSigPath)) {
            doc.image(defaultSigPath, 54, sigY + 2, { width: 120 });
            sigDrawn = true;
            break;
          }
        }
      } catch (e) {
        console.error("Error rendering default signature in PDF:", e);
      }
    }

    // Dynamic vector fallback signature line if no image available
    if (!sigDrawn) {
      doc.save();
      doc.translate(54, sigY + 2);
      doc.strokeColor('#2563eb').lineWidth(1.5);
      doc.moveTo(10, 15)
         .bezierCurveTo(20, -5, 30, 25, 45, 8)
         .bezierCurveTo(55, -15, 65, 12, 80, 4)
         .bezierCurveTo(90, -2, 100, 20, 115, 10)
         .stroke();
      doc.fillColor('#2563eb').fontSize(8.5).font('Courier-Oblique').text(`${formatDateDot(new Date())}`, 75, 15);
      doc.restore();
    }
    
    // Safety space below signature
    doc.y = sigY + 46;
    
    // HR Signatory Name & Designation
    const rawHrName = hrUser?.name;
    const hrName = (rawHrName && !rawHrName.toLowerCase().includes('nidhi') && rawHrName.toUpperCase() !== 'HR') 
      ? rawHrName 
      : 'HR SIGNATURE';
    const hrDesignation = hrUser?.designation || 'Senior Manager-HR';
    
    doc.moveDown(0.7);
    doc.fillColor('#1e293b').fontSize(10.5).font('Helvetica-Bold').text(hrName);
    doc.font('Helvetica').text(hrDesignation);
    
    // --- Copy To Section ---
    doc.moveDown(1.4);
    doc.font('Helvetica-Bold').text('Copy to:');
    doc.moveDown(0.3);
    
    const labelWidth = 115;
    const proposerText = proposer ? `${proposer.name}, ${proposer.department || 'IT'}.` : 'As requested.';
    
    const copyItems = [
      { label: 'Proposer', val: `: ${proposerText}` },
      { label: 'Guide/Facilitator', val: ': As mentioned above' },
      { label: 'Security & Access', val: ': Temporary Student Trainee I-Card / Access Pass may please be issued for the duration.' }
    ];
    
    copyItems.forEach(item => {
      const itemY = doc.y;
      doc.font('Helvetica-Bold').text(item.label, 54, itemY, { width: labelWidth });
      doc.font('Helvetica').text(item.val, 54 + labelWidth, itemY, { width: 370 });
      doc.y = Math.max(doc.y, itemY + 14);
    });

    // --- Footer ---
    doc.page.margins.bottom = 0;
    const footerY = doc.page.height - 55;
    doc.strokeColor('#cbd5e1').lineWidth(0.5)
       .moveTo(54, footerY)
       .lineTo(doc.page.width - 54, footerY)
       .stroke();
       
    doc.fillColor('#64748b').fontSize(8).font('Helvetica');
    doc.text('STUDENT INTERN & VOCATIONAL TRAINING MANAGEMENT SYSTEM', 54, footerY + 7, { align: 'center' });
    doc.text('Corporate Human Resources & Development Division | Email: internportal41@gmail.com', 54, footerY + 17, { align: 'center' });

    // Finalize document
    doc.end();
  });
};
