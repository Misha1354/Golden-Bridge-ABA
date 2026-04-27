/* =============================================================
   assessment.js — Golden Bridge ABA Staff Assessment Tool
   Builds UI, autosave, and generates a branded multi-page PDF
   matching the "Initial Assessment Summary & Treatment Plan" template.
============================================================= */

/* ── Goal domains (4 domains × 2 goals) ───────────────────── */
const GOAL_DOMAINS = [
  { key: 'comm', label: 'Communication Skills' },
  { key: 'soc',  label: 'Social Skills' },
  { key: 'dls',  label: 'Daily Living Skills' },
  { key: 'mal',  label: 'Maladaptive, Repetitive, and/or Stereotypical Behaviors' },
];

const GOAL_DEFAULTS = {
  mastery:       '90% independence over 3 days, with 2 people',
  maintenance:   '90% independence for probe data over 3 months, with 2 people',
  generalization:'90% independence for probe data across instructors, settings, time frame and stimuli',
  data:          'DTT, duration, frequency, Task Analysis',
};

/* ── Build goal blocks ────────────────────────────────────── */
function buildGoals() {
  const c = document.getElementById('goalsContainer');
  let html = '';
  GOAL_DOMAINS.forEach(d => {
    html += `<h4>${d.label}</h4>
      <div class="field"><label>Outcome</label>
        <input type="text" id="goal_${d.key}_outcome" value="Remediate deficits identified above">
      </div>`;
    [1, 2].forEach(n => {
      const id = `goal_${d.key}_${n}`;
      html += `<div class="goal-block">
        <div class="goal-title">Goal ${n}</div>
        <div class="field"><label>Description</label>
          <span class="helper">Operationally defined goal — be specific, include number of targets.</span>
          <textarea id="${id}_desc" class="fill-required" placeholder="[operationally defined goal]"></textarea></div>
        <div class="grid-2">
          <div class="field"><label>Baseline</label>
            <input type="text" id="${id}_base" class="fill-required" placeholder="[baseline + date]"></div>
          <div class="field"><label>Date of Mastery</label>
            <input type="date" id="${id}_date"></div>
        </div>
        <div class="field"><label>Mastery Criteria</label>
          <input type="text" id="${id}_mastery" value="${GOAL_DEFAULTS.mastery}"></div>
        <div class="field"><label>Maintenance Criteria</label>
          <input type="text" id="${id}_maint" value="${GOAL_DEFAULTS.maintenance}"></div>
        <div class="field"><label>Generalization Criteria</label>
          <input type="text" id="${id}_gen" value="${GOAL_DEFAULTS.generalization}"></div>
        <div class="field"><label>Type of Data Collection</label>
          <input type="text" id="${id}_data" value="${GOAL_DEFAULTS.data}"></div>
      </div>`;
    });
  });
  c.innerHTML = html;
}

/* ── Build Parent Training goals (3) ─────────────────────── */
function buildPTGoals() {
  const c = document.getElementById('ptGoalsContainer');
  let html = '';
  [1, 2, 3].forEach(n => {
    html += `<div class="goal-block">
      <div class="goal-title">Parent Training Goal ${n}</div>
      <div class="field"><label>Description</label>
        <textarea id="pt${n}_desc" class="fill-required" placeholder="[goal description]"></textarea></div>
      <div class="grid-2">
        <div class="field"><label>Baseline</label>
          <input type="text" id="pt${n}_base" class="fill-required" placeholder="[baseline]"></div>
        <div class="field"><label>Date of Mastery</label>
          <input type="date" id="pt${n}_date"></div>
      </div>
      <div class="field"><label>Mastery Criteria</label>
        <input type="text" id="pt${n}_mastery" value="90% independence over 3 days, with 2 people"></div>
      <div class="field"><label>Type of Data Collection</label>
        <input type="text" id="pt${n}_data" value="Probe Data"></div>
    </div>`;
  });
  c.innerHTML = html;
}

/* ── Nav ──────────────────────────────────────────────────── */
function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.dataset.sec;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`.section[data-sec="${sec}"]`).classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

/* ── FBA option select ───────────────────────────────────── */
function initFBA() {
  document.querySelectorAll('.fba-opt').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.fba-opt').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      document.getElementById('fba_choice').value = el.dataset.opt;
      saveDraft();
    });
  });
}

/* ── Autosave (localStorage) ─────────────────────────────── */
const LS_KEY = 'gbaba_assessment_draft_v2';
function collectAll() {
  const data = {};
  document.querySelectorAll('input, textarea, select').forEach(el => {
    if (!el.id) return;
    data[el.id] = (el.type === 'checkbox') ? el.checked : el.value;
  });
  data._fba = document.getElementById('fba_choice').value;
  return data;
}
function saveDraft() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(collectAll())); } catch(e){}
}
function loadDraft(alertIfNone) {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) { if (alertIfNone) alert('No saved draft found.'); return; }
  try {
    const data = JSON.parse(raw);
    Object.entries(data).forEach(([k, v]) => {
      const el = document.getElementById(k);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
    });
    if (data._fba) {
      document.querySelectorAll('.fba-opt').forEach(x => x.classList.remove('selected'));
      const o = document.querySelector(`.fba-opt[data-opt="${data._fba}"]`);
      if (o) o.classList.add('selected');
    }
  } catch(e){}
}
function clearAll() {
  if (!confirm('Clear all fields and the saved draft? This cannot be undone.')) return;
  localStorage.removeItem(LS_KEY);
  location.reload();
}

/* ── Helpers ──────────────────────────────────────────────── */
const v   = id => (document.getElementById(id)?.value || '').trim();
const chk = id => !!document.getElementById(id)?.checked;
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/* =============================================================
   PDF GENERATION — boxed, tabular layout mirroring goldaba2.pdf
   Every field is rendered as a two-column bordered row (label
   on shaded left ~32% / value on right ~68%) grouped under a
   full-width section header bar.
============================================================= */
function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const PAGE_W = doc.internal.pageSize.getWidth();   // 612
  const PAGE_H = doc.internal.pageSize.getHeight();  // 792
  const M = 48;
  const CONTENT_W = PAGE_W - M * 2;
  const LABEL_W = Math.round(CONTENT_W * 0.32);
  const VALUE_W = CONTENT_W - LABEL_W;
  const TOP_Y = 104;
  const BOTTOM_Y = 742;

  // Colors (match the template's muted navy/gold/beige feel)
  const COLOR = {
    navy:    [30, 41, 59],
    navyTxt: [15, 23, 42],
    gold:    [184, 134, 58],
    label:   [245, 242, 234],   // warm beige, like the template
    border:  [180, 180, 180],
    value:   [255, 255, 255],
    muted:   [100, 116, 139],
    body:    [30, 30, 30],
    accent:  [37, 99, 235],
  };

  const clientName = v('pt_name') || '—';
  const clientDob  = fmtDate(v('pt_dob')) || '—';
  const authStart  = fmtDate(v('auth_start'));
  const authEnd    = fmtDate(v('auth_end'));
  const authPeriod = (authStart || authEnd) ? `${authStart}${authStart && authEnd ? ' – ' : ''}${authEnd}` : '—';

  /* ── Page header / footer ───────────────────────────────── */
  function drawHeader() {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.navyTxt);
    doc.setFontSize(13);
    doc.text('Golden Bridge ABA', M, 34);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.muted);
    doc.text('Initial Assessment Summary & Treatment Plan', M, 48);
    doc.text('michael@goldaba.com  |  goldaba.com', M, 60);
    doc.text('Licensed in New Mexico & Massachusetts', M, 72);

    // Right client block
    const rx = PAGE_W - M;
    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLOR.navyTxt);
    doc.text('Client:',       rx - 180, 34);
    doc.text('DOB:',          rx - 180, 48);
    doc.text('Auth. Period:', rx - 180, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(clientName, rx - 118, 34, { maxWidth: 118 });
    doc.text(clientDob,  rx - 118, 48, { maxWidth: 118 });
    doc.text(authPeriod, rx - 118, 62, { maxWidth: 118 });

    doc.setDrawColor(...COLOR.gold);
    doc.setLineWidth(1.1);
    doc.line(M, 84, PAGE_W - M, 84);
  }
  function drawFooter(pageNum, totalPages) {
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(M, 754, PAGE_W - M, 754);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR.muted);
    doc.text('Golden Bridge ABA LLC  |  Serving New Mexico & Massachusetts', M, 767);
    doc.text('Confidential — HIPAA Protected', PAGE_W / 2, 767, { align: 'center' });
    doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - M, 767, { align: 'right' });
  }

  let y = TOP_Y;
  function newPage() { doc.addPage(); drawHeader(); y = TOP_Y; }
  function ensure(h) { if (y + h > BOTTOM_Y) newPage(); }

  /* ── Section header bar (full width, navy) ─────────────── */
  function sectionBar(title) {
    ensure(26);
    doc.setFillColor(...COLOR.navy);
    doc.rect(M, y, CONTENT_W, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), M + 8, y + 13.5);
    y += 20;
  }

  /* ── Sub-header bar (gold accent, smaller) ─────────────── */
  function subBar(title) {
    ensure(22);
    doc.setFillColor(250, 243, 224); // light gold tint
    doc.rect(M, y, CONTENT_W, 16, 'F');
    doc.setDrawColor(...COLOR.gold);
    doc.setLineWidth(0.6);
    doc.rect(M, y, CONTENT_W, 16, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.navyTxt);
    doc.text(title, M + 6, y + 11);
    y += 16;
  }

  /* ── Label / value row (renders as autoTable row) ──────── */
  function kvTable(rows, opts = {}) {
    // rows: [[label, value], ...] — skips rows where value is empty unless keepEmpty
    const body = rows
      .filter(r => opts.keepEmpty || (r[1] !== undefined && String(r[1]).trim() !== ''))
      .map(r => [r[0], String(r[1] ?? '')]);
    if (!body.length) return;
    doc.autoTable({
      startY: y,
      body,
      theme: 'grid',
      margin: { left: M, right: M, top: TOP_Y, bottom: PAGE_H - BOTTOM_Y },
      styles: {
        fontSize: 9, cellPadding: 5,
        textColor: COLOR.body, lineColor: COLOR.border, lineWidth: 0.4,
        valign: 'top',
      },
      columnStyles: {
        0: { cellWidth: LABEL_W, fillColor: COLOR.label, fontStyle: 'bold', textColor: COLOR.navyTxt },
        1: { cellWidth: VALUE_W, fillColor: COLOR.value },
      },
      didDrawPage: (data) => {
        // When autoTable spills to a new page it calls this — re-draw header.
        // We use margin.top so it starts below our header automatically.
        drawHeader();
      },
    });
    y = doc.lastAutoTable.finalY;
  }

  /* ── Full-width paragraph box (bordered, for long default paragraphs) ── */
  function paragraphBox(text, opts = {}) {
    if (!text) return;
    doc.autoTable({
      startY: y,
      body: [[text]],
      theme: 'grid',
      margin: { left: M, right: M, top: TOP_Y, bottom: PAGE_H - BOTTOM_Y },
      styles: {
        fontSize: 9, cellPadding: 7,
        textColor: COLOR.body, lineColor: COLOR.border, lineWidth: 0.4,
        valign: 'top',
        fontStyle: opts.italic ? 'italic' : 'normal',
      },
      columnStyles: { 0: { cellWidth: CONTENT_W, fillColor: opts.fill || COLOR.value } },
      didDrawPage: () => drawHeader(),
    });
    y = doc.lastAutoTable.finalY;
  }

  function gap(h = 10) { y += h; }

  /* ── Render table (for severity / service hours / schedule) */
  function renderTable(head, body, colStyles = {}) {
    doc.autoTable({
      startY: y,
      head, body,
      theme: 'grid',
      margin: { left: M, right: M, top: TOP_Y, bottom: PAGE_H - BOTTOM_Y },
      styles: {
        fontSize: 8.5, cellPadding: 5,
        textColor: COLOR.body, lineColor: COLOR.border, lineWidth: 0.4,
        valign: 'top',
      },
      headStyles: {
        fillColor: COLOR.navy, textColor: 255, fontSize: 8.5,
        fontStyle: 'bold', halign: 'left', lineColor: COLOR.border,
      },
      columnStyles: colStyles,
      didDrawPage: () => drawHeader(),
    });
    y = doc.lastAutoTable.finalY;
  }

  /* ───────────────── BEGIN DOCUMENT ───────────────── */
  drawHeader();

  // PATIENT INFORMATION
  sectionBar('Patient Information');
  kvTable([
    ['Name', v('pt_name')],
    ['Diagnosis (F84.0 + comorbid)', v('pt_dx')],
    ['DOB', fmtDate(v('pt_dob'))],
    ['Date of ASD Diagnosis', fmtDate(v('pt_dxDate'))],
    ['Diagnosing Physician', v('pt_dxPhys')],
    ['Treatment Setting', v('pt_setting')],
    ['Diagnosing Physician Address/Phone', v('pt_dxPhysContact')],
    ['Referring Physician', v('pt_refPhys')],
    ['Date of Referral', fmtDate(v('pt_refDate'))],
    ['Referring Physician Address/Phone', v('pt_refPhysContact')],
  ]);
  gap();

  // ASSESSMENT INFORMATION
  sectionBar('Assessment Information');
  kvTable([
    ['Total Assessment Hours', v('a_hours')],
    ['Dates & Location', v('a_datesLoc')],
    ['Assessment Instruments', v('a_instruments')],
  ]);
  gap();

  // PROVIDER INFORMATION
  sectionBar('Provider Information');
  kvTable([
    ['Name & Credentials', v('prov_name')],
    ['Contact Information', v('prov_contact')],
  ]);
  gap();

  // CONSENT
  sectionBar('Consent and Risk Assessment Information');
  paragraphBox(v('consent_text'));
  gap();

  // BIOPSYCHOSOCIAL
  sectionBar('Biopsychosocial Information');
  const bpsLabels = [
    "1. Patient's name, gender, diagnosis",
    '2. Family structure / support system',
    '3. Languages spoken',
    '4. Cultural, legal, religious considerations',
    '5. Recent family changes',
    '6. Other psychosocial conditions',
    "7. History of patient's development (language, social, etc.)",
    '8. Past and present medical conditions — emphasis on seizures, GI, feeding, sleep, psychiatric',
    '9. Medications (name, frequency, dosage, reason prescribed)',
    '10. Supplements and dietary accommodations',
    '11. List of present treatments (OT, PT, speech, etc.)',
    '12. List of past treatments (OT, PT, speech, etc.)',
    '13. School functioning: school name, grade, schedule, placement',
    '14. Date of last IEP',
    '15. Prior ABA agency history',
    '16. Intake narrative',
  ];
  kvTable(bpsLabels.map((lab, i) => [lab, v(`bps_${i+1}`)]), { keepEmpty: true });
  gap();

  // OBSERVATIONS
  sectionBar('Observations');
  subBar('Observation 1');
  kvTable([
    ['Date', fmtDate(v('obs1_date'))],
    ['Location', v('obs1_loc')],
    ['Notes', v('obs1_notes')],
  ], { keepEmpty: true });
  gap(4);
  subBar('Observation 2');
  kvTable([
    ['Date', fmtDate(v('obs2_date'))],
    ['Location', v('obs2_loc')],
    ['Notes', v('obs2_notes')],
  ], { keepEmpty: true });
  gap();

  // STRENGTHS
  sectionBar("Client's Strengths");
  paragraphBox(v('strengths') || ' ');
  gap();

  // SEVERITY TABLE
  sectionBar('Current Performance and Deficits — Severity Levels');
  renderTable(
    [['Domain', 'Level 1 (mild)', 'Level 2 (moderate)', 'Level 3 (severe)']],
    [
      ['Communication/Language', v('sev_comm_1'), v('sev_comm_2'), v('sev_comm_3')],
      ['Social',                 v('sev_soc_1'),  v('sev_soc_2'),  v('sev_soc_3')],
      ['Maladaptive behaviors',  v('sev_mal_1'),  v('sev_mal_2'),  v('sev_mal_3')],
      ['Repetitive/stereotypical', v('sev_rep_1'), v('sev_rep_2'), v('sev_rep_3')],
    ],
    { 0: { fontStyle: 'bold', cellWidth: 120, fillColor: COLOR.label, textColor: COLOR.navyTxt } }
  );
  gap();

  // DETAILED DEFICITS
  sectionBar('Current Performance and Deficits — Detailed Description');
  kvTable([
    ['Communication/Language', v('def_comm')],
    ['Social', v('def_soc')],
    ['Maladaptive behaviors', v('def_mal')],
    ['Repetitive/stereotypical behaviors', v('def_rep')],
    ['Daily Living Skills', v('def_dls')],
  ], { keepEmpty: true });
  gap();

  // ASSESSMENT INSTRUMENTS
  sectionBar('Assessment Instruments');
  const instruments = [
    ['use_vbmapp',   'VB-MAPP (Sundberg, 2008)',  'desc_vbmapp'],
    ['use_afls',     'AFLS (Partington, 2010)',   'desc_afls'],
    ['use_ablls',    'ABLLS-R (Partington, 2010)','desc_ablls'],
    ['use_efl',      'EFL',                       'desc_efl'],
    ['use_vineland', 'Vineland-3',                'desc_vineland'],
    ['use_ssis',     'SSIS SEL',                  'desc_ssis'],
  ];
  const instrRows = instruments.filter(([cb]) => chk(cb)).map(([, t, d]) => [t, v(d)]);
  if (instrRows.length) kvTable(instrRows);
  gap(4);
  kvTable([
    ['Assessment Results', v('results')],
    ['Barriers to Treatment', v('barriers')],
    ['Preference Assessment', v('preference')],
  ], { keepEmpty: true });
  gap();

  // CLINICAL INTERPRETATION
  sectionBar('Clinical Interpretation / Response to Treatment');
  paragraphBox(v('clin_interp'));
  gap(4);
  kvTable([['Additional clinical notes / individualized response', v('clin_notes')]], { keepEmpty: true });
  gap();

  // TREATMENT PLAN GOALS
  sectionBar('Treatment Plan Goals');
  GOAL_DOMAINS.forEach(d => {
    subBar(d.label);
    const outcome = v(`goal_${d.key}_outcome`);
    if (outcome) kvTable([['Outcome', outcome]]);
    [1, 2].forEach(n => {
      const id = `goal_${d.key}_${n}`;
      if (!v(`${id}_desc`) && !v(`${id}_base`)) return;
      kvTable([
        [`Goal ${n} Description`, v(`${id}_desc`)],
        ['Baseline', v(`${id}_base`)],
        ['Mastery Criteria', v(`${id}_mastery`)],
        ['Maintenance Criteria', v(`${id}_maint`)],
        ['Generalization Criteria', v(`${id}_gen`)],
        ['Date of Mastery', fmtDate(v(`${id}_date`))],
        ['Type of Data Collection', v(`${id}_data`)],
      ], { keepEmpty: true });
      gap(4);
    });
  });
  gap();

  // FBA / BIP
  sectionBar('Functional Behavior Assessment and Behavior Intervention Plan');
  const fbaChoice = v('fba_choice');
  const FBA_TEXTS = {
    A: "An FBA was not conducted formally at this time as [Name]'s maladaptive behaviors of [list behaviors] were not directly observed or reported as severe. Ongoing data will be collected; if behavior increases in intensity or severity, an FBA will be conducted and an individualized BIP will be created and implemented.",
    B: "According to [FAST/ABC data/FA/other assessment], it is hypothesized that the function of [list behavior(s)] is [list function(s)]. Problem behavior will be addressed through [list interventions] and individual behavioral goals and protocols. Least intrusive behavior management techniques will be initially implemented.",
    C: "[Name] does not currently present with maladaptive behaviors that interfere with progress or daily functioning. Ongoing data will be collected; if [Name] begins to emit behavior that interferes with progress or functioning, an FBA will be conducted and an individualized BIP and behavior reduction/replacement goals will be created and implemented.",
  };
  if (fbaChoice && FBA_TEXTS[fbaChoice]) {
    subBar(`Option ${fbaChoice}`);
    paragraphBox(FBA_TEXTS[fbaChoice]);
  }
  if (v('fba_detail')) {
    gap(4);
    kvTable([['FBA/BIP Detail', v('fba_detail')]]);
  }
  gap();

  // PARENT INVOLVEMENT
  sectionBar('Parent Involvement');
  paragraphBox(v('parent_involve') || ' ');
  gap(4);
  subBar('Parent Training Goals');
  [1, 2, 3].forEach(n => {
    if (!v(`pt${n}_desc`)) return;
    kvTable([
      [`PT Goal ${n} Description`, v(`pt${n}_desc`)],
      ['Mastery Criteria', v(`pt${n}_mastery`)],
      ['Baseline', v(`pt${n}_base`)],
      ['Date of Mastery', fmtDate(v(`pt${n}_date`))],
      ['Type of Data Collection', v(`pt${n}_data`)],
    ], { keepEmpty: true });
    gap(4);
  });
  gap();

  // CRISIS MANAGEMENT
  sectionBar('Crisis Management');
  paragraphBox(v('crisis_text'));
  if (v('crisis_notes')) { gap(4); kvTable([['Client-specific crisis notes', v('crisis_notes')]]); }
  gap();

  // COORDINATION OF CARE
  sectionBar('Coordination of Care');
  paragraphBox(v('coord_text'));
  if (v('coord_providers')) { gap(4); kvTable([['Care providers', v('coord_providers')]]); }
  gap();

  // GENERALIZATION PLAN
  sectionBar('Generalization Plan');
  paragraphBox(v('gen_text'));
  if (v('gen_notes')) { gap(4); kvTable([['Client-specific generalization notes', v('gen_notes')]]); }
  gap();

  // TRANSITION PLAN
  sectionBar('Transition Plan');
  paragraphBox(v('transition') || ' ');
  gap();

  // DISCHARGE
  sectionBar('Discharge Criteria');
  paragraphBox(v('discharge_text'));
  if (v('discharge_notes')) { gap(4); kvTable([['Client-specific discharge criteria', v('discharge_notes')]]); }
  gap();

  // TELEHEALTH CONSENT
  sectionBar('Telehealth Consent');
  paragraphBox(v('telehealth_text'));
  gap();

  // RECOMMENDATIONS
  sectionBar('Recommendations for Treatment');
  paragraphBox(v('rec_text'));
  gap(4);
  subBar('Recommended Service Hours');
  renderTable(
    [['CPT Code & Service', 'Hrs / Week', 'Days / Week']],
    [
      ['97155 — Supervision with Paraprofessional / Protocol Modification (BCBA)', v('sv_97155_h'), v('sv_97155_d')],
      ['97153 — Behavior Treatment (Paraprofessional / RBT)',                       v('sv_97153_h'), v('sv_97153_d')],
      ['97156 — Family Treatment Guidance / Parent Training (BCBA)',                v('sv_97156_h'), v('sv_97156_d')],
      ['97151 — Reassessment (BCBA)',                                               v('sv_97151_h'), v('sv_97151_d')],
    ],
    {
      0: { cellWidth: CONTENT_W - 180, fillColor: COLOR.label, textColor: COLOR.navyTxt, fontStyle: 'bold' },
      1: { halign: 'center', cellWidth: 90 },
      2: { halign: 'center', cellWidth: 90 },
    }
  );
  gap(6);

  subBar('Proposed Session Schedule');
  const daysColW = CONTENT_W / 7;
  renderTable(
    [['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']],
    [[ v('sch_mon'), v('sch_tue'), v('sch_wed'), v('sch_thu'), v('sch_fri'), v('sch_sat'), v('sch_sun') ]],
    Object.fromEntries([0,1,2,3,4,5,6].map(i => [i, { halign: 'center', cellWidth: daysColW }]))
  );
  gap();

  // SIGNATURES
  sectionBar('Signatures');
  subBar('Reported By');
  kvTable([
    ['Name & Credentials', v('sig_prov_name')],
    ['Signature', v('sig_prov_sig')],
    ['Date', fmtDate(v('sig_prov_date'))],
  ], { keepEmpty: true });
  gap(4);
  subBar('Parent / Guardian');
  kvTable([
    ['Parent/Guardian Name', v('sig_par_name')],
    ['Parent/Guardian Signature', v('sig_par_sig')],
    ['Date', fmtDate(v('sig_par_date'))],
  ], { keepEmpty: true });

  /* ── Footer on every page ──────────────────────────────── */
  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooter(p, total);
  }

  /* ── Filename ──────────────────────────────────────────── */
  const safeName = (v('pt_name') || 'Client').replace(/[^a-z0-9]+/gi, '_');
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  doc.save(`ABA_Assessment_${safeName}_${stamp}.pdf`);
}

/* ── Init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildGoals();
  buildPTGoals();
  initNav();
  initFBA();
  loadDraft(false);

  document.getElementById('genPdf').addEventListener('click', () => {
    try { generatePDF(); }
    catch (e) { console.error(e); alert('PDF generation failed: ' + e.message); }
  });
  document.getElementById('saveDraft').addEventListener('click', () => { saveDraft(); alert('Draft saved to this browser.'); });
  document.getElementById('loadDraft').addEventListener('click', () => loadDraft(true));
  document.getElementById('clearAll').addEventListener('click', clearAll);

  // Auto-save on change
  document.addEventListener('input', () => saveDraft());
  document.addEventListener('change', () => saveDraft());
});
