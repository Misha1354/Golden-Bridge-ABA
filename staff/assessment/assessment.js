/* ============================================================
   ABA Clinical Assessment Tool — assessment.js
   Golden Bridge ABA LLC — Staff Only
   ============================================================ */

'use strict';

// ==================== SECTION NAVIGATION ====================

let currentSection = 0;
const TOTAL = 10;

function goTo(n) {
  document.getElementById('s' + currentSection).classList.remove('active');
  document.getElementById('nav-' + currentSection).classList.remove('active');
  currentSection = Math.max(0, Math.min(n, TOTAL - 1));
  document.getElementById('s' + currentSection).classList.add('active');
  document.getElementById('nav-' + currentSection).classList.add('active');
  document.querySelector('.content').scrollTo(0, 0);
  updateProgress();
  updateNavButtons();
}

function updateProgress() {
  const pct = ((currentSection + 1) / TOTAL) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent =
    'Section ' + (currentSection + 1) + ' of ' + TOTAL;
}

function updateNavButtons() {
  document.getElementById('backBtn').style.visibility =
    currentSection === 0 ? 'hidden' : 'visible';
  document.getElementById('nextBtn').textContent =
    currentSection === TOTAL - 1 ? 'Review & Download' : 'Next →';
}

// ==================== CPT TOTAL CALC ====================

const CPT_CODES = ['97151', '97152', '97153', '97154', '97155', '97156', '97157'];

function calcCptTotal() {
  let total = 0;
  CPT_CODES.forEach(function (code) {
    const el = document.getElementById('cpt-' + code);
    if (el && el.value !== '') {
      total += parseFloat(el.value) || 0;
    }
  });
  document.getElementById('cptTotal').textContent = total % 1 === 0 ? total : total.toFixed(1);
}

// ==================== FORM VALUE HELPERS ====================

const v = function (id) {
  return (document.getElementById(id) ? document.getElementById(id).value || '' : '').trim();
};

const chips = function (id) {
  return [...document.querySelectorAll('#' + id + ' .chip.selected')]
    .map(function (c) { return c.dataset.value; })
    .join(' · ');
};

// ==================== PDF GENERATION ====================

function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });

  const PW = 215.9;
  const PH = 279.4;
  const M  = 20;
  const CW = 175.9;

  // Color palettes
  const BLUE  = [30, 64, 175];
  const LGRAY = [241, 245, 249];
  const GRAY  = [71, 85, 105];
  const BLACK = [30, 41, 59];
  const WHITE = [255, 255, 255];

  let y = M;

  // ---- Helpers ----

  function ck(needed) {
    if (y + needed > PH - 28) {
      doc.addPage();
      y = M;
    }
  }

  function sectionHead(title) {
    ck(20);
    doc.setFillColor(241, 245, 249);
    doc.rect(M, y - 1, CW, 10, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLUE);
    doc.text(title, M + 3, y + 6.5);
    y += 14;
  }

  function field(label, val) {
    if (!val) return;
    ck(8);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text(label + ':', M, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BLACK);
    const labelWidth = doc.getTextWidth(label + ':') + 3;
    const maxValWidth = CW - labelWidth;
    const valLines = doc.splitTextToSize(val, maxValWidth);
    doc.text(valLines[0], M + labelWidth, y);
    if (valLines.length > 1) {
      y += 5;
      for (let i = 1; i < valLines.length; i++) {
        ck(5);
        doc.text(valLines[i], M + labelWidth, y);
        if (i < valLines.length - 1) y += 5;
      }
    }
    y += 6;
  }

  function twoCol(pairs) {
    ck(8);
    const colW = CW / 2 - 5;
    let rowY = y;
    pairs.forEach(function (pair, idx) {
      const label = pair[0];
      const val   = pair[1];
      if (!val) return;
      const xOff = (idx % 2 === 0) ? M : M + CW / 2 + 5;
      if (idx % 2 === 0 && idx > 0) {
        rowY = y;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GRAY);
      doc.text(label + ':', xOff, rowY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...BLACK);
      const lw = doc.getTextWidth(label + ':') + 2;
      const valLines = doc.splitTextToSize(val, colW - lw);
      doc.text(valLines[0], xOff + lw, rowY);
      if (idx % 2 === 1 || idx === pairs.length - 1) {
        y = rowY + 6;
      }
    });
    if (pairs.length % 2 !== 0) y += 6;
  }

  function textBlock(label, val) {
    if (!val) return;
    const lines = doc.splitTextToSize(val, CW);
    ck(10 + lines.length * 4.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text(label, M, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BLACK);
    lines.forEach(function (line) {
      ck(5);
      doc.text(line, M, y);
      y += 4.5;
    });
    y += 6;
  }

  function chipsLine(label, val) {
    if (!val) return;
    textBlock(label, val);
  }

  function spacer(n) {
    y += (n || 6);
  }

  // ==================== COVER PAGE ====================

  doc.setFillColor(...BLUE);
  doc.rect(0, 0, PW, 50, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('ABA CLINICAL ASSESSMENT REPORT', M, 22);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(v('agencyName') || 'Golden Bridge ABA LLC', M, 32);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Confidential \u2014 Protected Health Information', M, 40);

  y = 70;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  doc.text('Client:', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BLACK);
  doc.text(v('clientName') || '—', M + 22, y); y += 7;

  field('Date of Birth', v('dob'));
  field('MassHealth ID', v('massHealthId'));
  field('MCO Plan', v('mcoPlan'));
  field('Assessment Date(s)', v('assessmentDates'));
  field('Report Date', v('reportDate'));
  field('Assessment Type', v('assessmentType'));

  const bcbaCredSig = v('sig-bcbaCredentials');
  const bcbaDisplay = v('bcbaName') + (bcbaCredSig ? ', ' + bcbaCredSig : '');
  field('BCBA/LABA', bcbaDisplay);
  field('Agency', v('agencyName'));

  doc.addPage();
  y = M;

  // ==================== SECTION 1 — IDENTIFYING INFORMATION ====================

  sectionHead('1. Identifying Information');

  field('Client Name', v('clientName'));
  field('Date of Birth', v('dob'));
  twoCol([['Age', v('age')], ['MassHealth ID', v('massHealthId')]]);
  twoCol([['MCO Plan', v('mcoPlan')], ['Behavioral Health Plan', v('bhPlan')]]);
  field('Address', v('address'));
  twoCol([['ZIP', v('zip')], ['Relationship', v('guardianRel')]]);
  field('Parent/Guardian', v('guardianName'));
  twoCol([['Phone', v('guardianPhone')], ['Referring Provider', v('referringProvider')]]);
  twoCol([['Referring NPI', v('referringNpi')], ['Credential', v('referringCredential')]]);
  field('Primary Diagnosis (DSM-5)', v('primaryDx'));
  twoCol([['ICD-10 Code', v('icd10')], ['Diagnosis Date', v('dxDate')]]);
  field('Secondary Diagnoses', v('secondaryDx'));
  twoCol([['Assessment Date(s)', v('assessmentDates')], ['Report Date', v('reportDate')]]);
  twoCol([['Assessment Type', v('assessmentType')], ['Service Setting', v('serviceSetting')]]);
  field('BCBA/LABA', v('bcbaName'));
  twoCol([['BACB Cert #', v('bacbCert')], ['MA LABA License #', v('labaLicense')]]);
  twoCol([['Agency Name', v('agencyName')], ['Agency NPI', v('agencyNpi')]]);
  field('School District', v('schoolDistrict'));

  // ==================== SECTION 2 — REASON FOR REFERRAL ====================

  sectionHead('2. Reason for Referral & History');
  textBlock('Reason for Referral', v('reasonReferral'));
  textBlock('Developmental History', v('devHistory'));
  textBlock('Medical/Psychiatric History', v('medHistory'));
  textBlock('Prior ABA Services', v('priorAba'));
  textBlock('Other Therapeutic Services', v('otherTherapies'));
  chipsLine('School Placement', chips('chips-schoolPlacement'));
  textBlock('IEP Goals Related to ABA', v('iepGoals'));

  // ==================== SECTION 3 — SOURCES OF INFORMATION ====================

  sectionHead('3. Sources of Information');
  chipsLine('Informants', chips('chips-informants'));
  chipsLine('Observation Settings', chips('chips-obsSettings'));
  chipsLine('Record Review', chips('chips-records'));
  chipsLine('Other Methods', chips('chips-otherMethods'));
  textBlock('Informants Detail', v('informantsDetail'));

  // ==================== SECTION 4 — ASSESSMENT INSTRUMENTS ====================

  sectionHead('4. Assessment Instruments');

  // Skill-Based Assessments table
  const skillRows = [];
  const skillInstruments = [
    { name: 'VB-MAPP',       scoreId: 'skill-vbmapp-score',  notesId: 'skill-vbmapp-notes' },
    { name: 'ABLLS-R',       scoreId: 'skill-ablls-score',   notesId: 'skill-ablls-notes' },
    { name: 'AFLS',          scoreId: 'skill-afls-score',    notesId: 'skill-afls-notes' },
    { name: 'PEAK',          scoreId: 'skill-peak-score',    notesId: 'skill-peak-notes' },
    { name: 'EIBI Checklist',scoreId: 'skill-eibi-score',    notesId: 'skill-eibi-notes' },
  ];
  skillInstruments.forEach(function (inst) {
    const score = v(inst.scoreId);
    const notes = v(inst.notesId);
    if (score || notes) skillRows.push([inst.name, score, notes]);
  });
  const skillOtherName  = v('skill-other-name');
  const skillOtherScore = v('skill-other-score');
  const skillOtherNotes = v('skill-other-notes');
  if (skillOtherName || skillOtherScore || skillOtherNotes) {
    skillRows.push([skillOtherName || 'Other', skillOtherScore, skillOtherNotes]);
  }

  if (skillRows.length > 0) {
    ck(30);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text('Skill-Based Assessments', M, y);
    y += 4;
    doc.autoTable({
      startY: y,
      head: [['Instrument', 'Score/Level', 'Notes']],
      body: skillRows,
      styles: { fontSize: 8.5, cellPadding: 3, textColor: BLACK },
      headStyles: { fillColor: LGRAY, textColor: GRAY, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 35 }, 2: { cellWidth: 95.9 } },
      margin: { left: M, right: M },
      theme: 'grid',
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Adaptive / Standardized Assessments table
  const adapRows = [];
  const adapInstruments = [
    { name: 'Vineland-3', scoreId: 'adap-vineland-score', notesId: 'adap-vineland-notes' },
    { name: 'ABAS-3',     scoreId: 'adap-abas-score',     notesId: 'adap-abas-notes' },
    { name: 'CARS-2',     scoreId: 'adap-cars-score',     notesId: 'adap-cars-notes' },
    { name: 'SRS-2',      scoreId: 'adap-srs-score',      notesId: 'adap-srs-notes' },
    { name: 'Conners-3',  scoreId: 'adap-conners-score',  notesId: 'adap-conners-notes' },
  ];
  adapInstruments.forEach(function (inst) {
    const score = v(inst.scoreId);
    const notes = v(inst.notesId);
    if (score || notes) adapRows.push([inst.name, score, notes]);
  });
  const adapOtherName  = v('adap-other-name');
  const adapOtherScore = v('adap-other-score');
  const adapOtherNotes = v('adap-other-notes');
  if (adapOtherName || adapOtherScore || adapOtherNotes) {
    adapRows.push([adapOtherName || 'Other', adapOtherScore, adapOtherNotes]);
  }

  if (adapRows.length > 0) {
    ck(30);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text('Adaptive / Standardized Assessments', M, y);
    y += 4;
    doc.autoTable({
      startY: y,
      head: [['Instrument', 'Score/Level', 'Notes']],
      body: adapRows,
      styles: { fontSize: 8.5, cellPadding: 3, textColor: BLACK },
      headStyles: { fillColor: LGRAY, textColor: GRAY, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 35 }, 2: { cellWidth: 95.9 } },
      margin: { left: M, right: M },
      theme: 'grid',
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  chipsLine('FBA Methods', chips('chips-fbaMethods'));
  field('Preference Assessment Type', v('prefAssessType'));

  // ==================== SECTION 5 — BEHAVIORAL OBSERVATIONS ====================

  sectionHead('5. Behavioral Observations');
  textBlock('General Demeanor/Affect', v('obs-demeanor'));
  textBlock('Communication — Expressive', v('obs-expressive'));
  textBlock('Communication — Receptive', v('obs-receptive'));
  textBlock('Social Interaction / Joint Attention', v('obs-social'));
  textBlock('Play Skills', v('obs-play'));
  textBlock('Restricted/Repetitive Behaviors', v('obs-rrb'));
  textBlock('Response to Instructions/Transitions', v('obs-transitions'));
  textBlock('Additional Observations', v('obs-additional'));

  // ==================== SECTION 6 — SKILL ASSESSMENT RESULTS ====================

  sectionHead('6. Skill Assessment Results');

  ck(8);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text('Communication Skills', M, y);
  y += 8;

  textBlock('Manding', v('skill-manding'));
  textBlock('Tacting', v('skill-tacting'));
  textBlock('Echoic / Vocal Imitation', v('skill-echoic'));
  textBlock('Intraverbal', v('skill-intraverbal'));
  textBlock('Receptive Language', v('skill-receptive'));
  textBlock('Overall Language Summary', v('skill-langSummary'));

  ck(8);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text('Adaptive Behavior', M, y);
  y += 8;

  textBlock('Daily Living Skills', v('skill-dailyLiving'));
  textBlock('Socialization', v('skill-socialization'));
  textBlock('Gross Motor', v('skill-grossMotor'));
  textBlock('Fine Motor / Pre-Academic', v('skill-fineMotor'));

  // ==================== SECTION 7 — FBA RESULTS ====================

  sectionHead('7. FBA Results');

  [1, 2, 3].forEach(function (n) {
    const bName = v('fba' + n + '-name');
    if (!bName) return;

    ck(14);
    doc.setFillColor(235, 243, 255);
    doc.rect(M, y - 2, CW, 10, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLUE);
    doc.text('Behavior ' + n + ': ' + bName, M + 3, y + 5.5);
    y += 14;

    field('Frequency/Severity', v('fba' + n + '-freq'));
    textBlock('Operational Definition', v('fba' + n + '-def'));
    textBlock('Antecedents', v('fba' + n + '-ante'));
    textBlock('Consequences', v('fba' + n + '-cons'));
    chipsLine('Hypothesized Function', chips('chips-fba' + n + '-func'));
    spacer(4);
  });

  // ==================== SECTION 8 — CLINICAL SUMMARY ====================

  sectionHead('8. Clinical Summary');
  textBlock('Clinical Summary Narrative', v('clinicalSummary'));
  textBlock('Medical Necessity Statement', v('medNecessity'));
  field('Prognosis', v('prognosis'));
  textBlock('Additional Notes', v('additionalNotes'));

  // ==================== SECTION 9 — TREATMENT RECOMMENDATIONS ====================

  sectionHead('9. Treatment Recommendations');

  // CPT Table
  const cptDescriptions = {
    '97151': 'Behavior identification assessment',
    '97152': 'Behavior identification supporting assessment',
    '97153': 'Adaptive behavior treatment by protocol',
    '97154': 'Group adaptive behavior treatment',
    '97155': 'Adaptive behavior treatment w/ protocol modification',
    '97156': 'Family adaptive behavior treatment guidance',
    '97157': 'Multiple-family group adaptive behavior treatment',
  };

  const cptBody = [];
  let cptTotalPdf = 0;
  CPT_CODES.forEach(function (code) {
    const hrs = v('cpt-' + code);
    if (hrs) {
      cptBody.push([code, cptDescriptions[code], hrs + ' hrs/wk']);
      cptTotalPdf += parseFloat(hrs) || 0;
    }
  });

  if (cptBody.length > 0) {
    cptBody.push(['', 'TOTAL', (cptTotalPdf % 1 === 0 ? cptTotalPdf : cptTotalPdf.toFixed(1)) + ' hrs/wk']);
    ck(30);
    doc.autoTable({
      startY: y,
      head: [['CPT Code', 'Description', 'Hrs/Week']],
      body: cptBody,
      styles: { fontSize: 8.5, cellPadding: 3, textColor: BLACK },
      headStyles: { fillColor: LGRAY, textColor: GRAY, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 125 }, 2: { cellWidth: 28.9 } },
      margin: { left: M, right: M },
      theme: 'grid',
      didDrawCell: function (data) {
        if (data.row.index === cptBody.length - 1) {
          doc.setFont('helvetica', 'bold');
        }
      },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  twoCol([['Auth Period', v('authPeriod')], ['Service Location', v('serviceLocation')]]);
  textBlock('Rationale for Intensity', v('intensityRationale'));
  textBlock('Short-Term Goals (3–6 months)', v('goalsShortTerm'));
  textBlock('Long-Term Goals (12 months)', v('goalsLongTerm'));
  textBlock('Caregiver Training Plan', v('caregiverPlan'));
  chipsLine('Provider Coordination', chips('chips-providerCoord'));

  // ==================== SECTION 10 — SIGNATURES ====================

  sectionHead('10. Signatures');

  // BCBA Block
  ck(14);
  doc.setFillColor(248, 250, 252);
  doc.rect(M, y - 2, CW, 10, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('BCBA/LABA Completing Assessment', M + 3, y + 5.5);
  y += 14;

  field('Name', v('sig-bcbaName'));
  field('Credentials', v('sig-bcbaCredentials'));
  twoCol([['BACB Cert #', v('sig-bacbCert')], ['MA LABA License #', v('sig-labaLicense')]]);
  twoCol([['Email', v('sig-bcbaEmail')], ['Date', v('sig-bcbaDate')]]);

  // Attestation box
  ck(24);
  const attestText = 'I attest that the information in this report is accurate, that this assessment was conducted in accordance with BACB ethical guidelines and MassHealth ABA program requirements, and that the recommended services are medically necessary for this individual.';
  const attestLines = doc.splitTextToSize(attestText, CW - 10);
  const attestHeight = attestLines.length * 4.5 + 10;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(M, y, CW, attestHeight, 3, 3, 'FD');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(22, 101, 52);
  let attestY = y + 6;
  attestLines.forEach(function (line) {
    doc.text(line, M + 5, attestY);
    attestY += 4.5;
  });
  y += attestHeight + 8;

  // BCBA Signature line
  ck(20);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  doc.line(M, y + 15, M + 80, y + 15);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(v('sig-bcbaName') || '________________________', M, y + 12);
  doc.text('BCBA/LABA Signature & Date', M, y + 20);
  y += 28;

  // Guardian Block
  ck(14);
  doc.setFillColor(248, 250, 252);
  doc.rect(M, y - 2, CW, 10, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('Parent/Guardian', M + 3, y + 5.5);
  y += 14;

  field('Name', v('sig-guardianName'));
  twoCol([['Relationship', v('sig-guardianRel')], ['Date', v('sig-guardianDate')]]);
  field('Phone', v('sig-guardianPhone'));

  // Guardian signature line
  ck(20);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  doc.line(M, y + 15, M + 80, y + 15);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(v('sig-guardianName') || '________________________', M, y + 12);
  doc.text('Parent/Guardian Signature & Date', M, y + 20);
  y += 28;

  // ==================== FOOTER & HIPAA NOTICE ====================

  const totalPages = doc.internal.pages.length - 1;

  // HIPAA notice on last page
  doc.setPage(totalPages);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  const hipaa = 'This document contains protected health information (PHI) covered under HIPAA (45 CFR Parts 160 and 164). Unauthorized use, disclosure, or reproduction is strictly prohibited.';
  const hipaaLines = doc.splitTextToSize(hipaa, CW);
  doc.text(hipaaLines, PW / 2, PH - 20, { align: 'center' });

  // Footer on every page
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footY = PH - 10;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(v('clientName') || 'Client Name', M, footY);
    doc.text('Confidential \u2014 HIPAA Protected', PW / 2, footY, { align: 'center' });
    doc.text('Page ' + i + ' of ' + totalPages, PW - M, footY, { align: 'right' });
  }

  // Save
  const safeName = (v('clientName') || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = (v('reportDate') || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  doc.save('ABA_Assessment_' + safeName + '_' + safeDate + '.pdf');
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', function () {

  // Initial state
  updateProgress();
  updateNavButtons();

  // Back / Next buttons
  document.getElementById('backBtn').addEventListener('click', function () {
    goTo(currentSection - 1);
  });

  document.getElementById('nextBtn').addEventListener('click', function () {
    if (currentSection === TOTAL - 1) {
      generatePDF();
    } else {
      goTo(currentSection + 1);
    }
  });

  // Sidebar nav buttons
  document.querySelectorAll('.nav-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const n = parseInt(btn.dataset.section, 10);
      goTo(n);
    });
  });

  // Chip toggle
  document.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      chip.classList.toggle('selected');
    });
  });

  // CPT total auto-calc
  CPT_CODES.forEach(function (code) {
    const el = document.getElementById('cpt-' + code);
    if (el) el.addEventListener('input', calcCptTotal);
  });

  // Download PDF button
  document.getElementById('downloadPdf').addEventListener('click', generatePDF);

});
