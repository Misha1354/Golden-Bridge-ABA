/* =============================================================
   intake.js — Golden Bridge ABA Client Intake Form
   EmailJS sends all submissions to michael@goldaba.com

   NOTE: For full HIPAA compliance, this form must be served
   over HTTPS and EmailJS must have a signed BAA. Consider a
   HIPAA-compliant form service (Jotform HIPAA, Formstack) for
   production use.

   SETUP: Match these to your EmailJS account values.
   The intake template should have "To Email" set to:
     michael@goldaba.com
============================================================= */

const EMAILJS_PUBLIC_KEY         = 'btXpytjzt6k7rwIQ5';
const EMAILJS_SERVICE_ID         = 'service_i6ba13z';
const EMAILJS_TEMPLATE_INTAKE_ID = 'template_7sej6cs';

// ── Init EmailJS ──────────────────────────────────────────
(function () {
  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }
})();

// ── State ─────────────────────────────────────────────────
let currentIntakeStep = 1;
const TOTAL_STEPS = 6;

// ── DOMContentLoaded boot ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  autofillDate();
  bindConditionals();
  bindConsentCards();
  bindConsentCheckHighlight();
  updateProgressBar(1);

  // Sticky header adjustment for HIPAA banner
  document.body.classList.add('intake-page');

  // Smooth scroll for "View Our Privacy Practices" link
  const bannerLink = document.getElementById('bannerNppLink');
  if (bannerLink) {
    bannerLink.addEventListener('click', (e) => {
      e.preventDefault();
      const npp = document.getElementById('npp');
      if (npp) {
        const offset = npp.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  }
});

// ── Auto-fill signature date ──────────────────────────────
function autofillDate() {
  const dateField = document.getElementById('sig_date');
  if (dateField) {
    const today = new Date();
    const formatted = today.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
    dateField.value = formatted;
  }
}

// ── Progress bar update ───────────────────────────────────
function updateProgressBar(activeStep) {
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const stepEl = document.getElementById('prog-step-' + i);
    if (!stepEl) continue;
    stepEl.classList.remove('active', 'done');
    if (i < activeStep) stepEl.classList.add('done');
    if (i === activeStep) stepEl.classList.add('active');
  }
}

// ── Step navigation ───────────────────────────────────────
function nextStep(fromStep) {
  if (!validateStep(fromStep)) return;

  const current = document.getElementById('intake-step-' + fromStep);
  const next    = document.getElementById('intake-step-' + (fromStep + 1));
  if (!next) return;

  if (current) current.classList.remove('active');
  next.classList.add('active');
  currentIntakeStep = fromStep + 1;
  updateProgressBar(currentIntakeStep);

  // Scroll to top of form container
  const container = document.querySelector('.intake-container');
  if (container) {
    const top = container.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }
}

function prevStep(fromStep) {
  if (fromStep <= 1) return;
  const current = document.getElementById('intake-step-' + fromStep);
  const prev    = document.getElementById('intake-step-' + (fromStep - 1));
  if (!prev) return;

  if (current) current.classList.remove('active');
  prev.classList.add('active');
  currentIntakeStep = fromStep - 1;
  updateProgressBar(currentIntakeStep);

  const container = document.querySelector('.intake-container');
  if (container) {
    const top = container.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }
}

// ── Validation ────────────────────────────────────────────
function validateStep(step) {
  let valid = true;

  // Clear all error states in the current step
  const stepEl = document.getElementById('intake-step-' + step);
  if (!stepEl) return true;

  stepEl.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  stepEl.querySelectorAll('.field-error.visible').forEach(el => el.classList.remove('visible'));
  stepEl.querySelectorAll('.error-check').forEach(el => el.classList.remove('error-check'));

  // Validate all required inputs/selects/textareas in this step
  stepEl.querySelectorAll('[required]').forEach(field => {
    if (!field.offsetParent) return; // skip hidden fields
    const val = field.value.trim();
    if (!val) {
      field.classList.add('error');
      const errMsg = field.closest('.form-group')?.querySelector('.field-error');
      if (errMsg) errMsg.classList.add('visible');
      valid = false;
    }
  });

  // Step 6 required checkboxes
  if (step === 6) {
    const requiredConsents = [
      'consent_npp',
      'consent_treatment',
      'consent_hipaa_auth',
      'consent_billing',
      'consent_financial',
      'consent_electronic',
      'consent_certify'
    ];
    requiredConsents.forEach(id => {
      const cb = document.getElementById(id);
      if (cb && !cb.checked) {
        const card = cb.closest('.consent-check');
        if (card) card.classList.add('error-check');
        valid = false;
      }
    });

    if (!valid) {
      alert('Please review and check all required consent and authorization items before submitting.');
    }
  }

  if (!valid && step !== 6) {
    alert('Please fill in all required fields marked with an asterisk (*).');
  }

  return valid;
}

// ── Conditional field bindings ────────────────────────────
function bindConditionals() {

  // Secondary Guardian toggle
  bindToggle('toggle_secondary_guardian', 'secondary_guardian_section');

  // Secondary Insurance toggle
  bindToggle('toggle_secondary_insurance', 'secondary_insurance_section');

  // Self-pay toggle
  const selfPayCb = document.getElementById('self_pay');
  if (selfPayCb) {
    selfPayCb.addEventListener('change', () => {
      const note = document.getElementById('self_pay_note');
      const ins  = document.getElementById('primary_insurance_section');
      if (note) note.classList.toggle('open', selfPayCb.checked);
      if (ins)  ins.style.opacity = selfPayCb.checked ? '0.4' : '1';
    });
  }

  // Custody agreement
  bindRadioConditional('custody_yes', 'custody_details_section');
  bindRadioConditional('custody_no',  'custody_details_section', true);

  // Previous ABA therapy
  bindRadioConditional('prev_aba_yes', 'prev_aba_details');
  bindRadioConditional('prev_aba_no',  'prev_aba_details', true);

  // School enrolled
  const schoolEnrolledSel = document.getElementById('school_enrolled');
  if (schoolEnrolledSel) {
    schoolEnrolledSel.addEventListener('change', () => {
      const fields = document.getElementById('school_name_fields');
      if (fields) {
        fields.classList.toggle('open', schoolEnrolledSel.value === 'yes');
      }
    });
  }

  // IEP toggle (step 5)
  bindRadioConditional('iep_yes', 'iep_details');
  bindRadioConditional('iep_no',  'iep_details', true);

  // Photo release
  // (no conditional needed, both radios just track state)
}

function bindToggle(checkboxId, sectionId) {
  const cb   = document.getElementById(checkboxId);
  const sect = document.getElementById(sectionId);
  if (!cb || !sect) return;
  cb.addEventListener('change', () => {
    sect.classList.toggle('open', cb.checked);
  });
}

function bindRadioConditional(radioId, sectionId, hide = false) {
  const radio = document.getElementById(radioId);
  const sect  = document.getElementById(sectionId);
  if (!radio || !sect) return;
  radio.addEventListener('change', () => {
    if (radio.checked) {
      sect.classList.toggle('open', !hide);
    }
  });
}

// ── Consent card expand/collapse ──────────────────────────
function bindConsentCards() {
  document.querySelectorAll('.consent-expand-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const target   = document.getElementById(targetId);
      if (!target) return;
      const isOpen = target.classList.toggle('open');
      btn.textContent = isOpen ? '▲ Hide full text' : '▼ Read full text';
    });
  });
}

// ── Highlight consent card when checked ──────────────────
function bindConsentCheckHighlight() {
  document.querySelectorAll('.consent-card').forEach(card => {
    const cb = card.querySelector('input[type="checkbox"]');
    if (!cb) return;
    cb.addEventListener('change', () => {
      card.classList.toggle('checked', cb.checked);
    });
  });
}

// ── Collect all form values ───────────────────────────────
function collectFormData() {
  const v = id => {
    const el = document.getElementById(id);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked ? 'Yes' : 'No';
    return el.value ? el.value.trim() : '';
  };

  // Checkbox groups
  const checkedValues = (name) => {
    const boxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(boxes).map(b => b.value).join(', ') || 'None';
  };

  const patientFirst = v('patient_first_name');
  const patientLast  = v('patient_last_name');

  return {
    // ── Patient Info ──
    patient_name:        `${patientFirst} ${patientLast}`.trim(),
    patient_first:       patientFirst,
    patient_last:        patientLast,
    patient_nickname:    v('patient_nickname'),
    dob:                 v('patient_dob'),
    sex:                 v('patient_sex'),
    gender_identity:     v('patient_gender'),
    primary_language:    v('patient_language'),
    school_enrolled:     v('school_enrolled'),
    school_name_step1:   v('school_name_step1'),
    grade_step1:         v('grade_step1'),
    diagnosis:           v('primary_diagnosis'),
    other_diagnoses:     v('other_diagnoses'),
    diagnosing_provider: v('diagnosing_provider'),
    diagnosis_date:      v('diagnosis_date'),

    // ── Guardian 1 ──
    guardian_first:      v('g1_first'),
    guardian_last:       v('g1_last'),
    guardian_name:       `${v('g1_first')} ${v('g1_last')}`.trim(),
    guardian_rel:        v('g1_relationship'),
    guardian_dob:        v('g1_dob'),
    guardian_phone:      v('g1_cell'),
    guardian_home_phone: v('g1_home_phone'),
    guardian_work_phone: v('g1_work_phone'),
    guardian_email:      v('g1_email'),
    guardian_contact_time: v('g1_contact_time'),
    address1:            v('g1_address1'),
    address2:            v('g1_address2'),
    city:                v('g1_city'),
    state:               v('g1_state'),
    zip:                 v('g1_zip'),
    employer:            v('g1_employer'),

    // ── Guardian 2 ──
    has_secondary_guardian: v('toggle_secondary_guardian'),
    g2_first:            v('g2_first'),
    g2_last:             v('g2_last'),
    g2_relationship:     v('g2_relationship'),
    g2_dob:              v('g2_dob'),
    g2_cell:             v('g2_cell'),
    g2_email:            v('g2_email'),

    // ── Custody ──
    custody_agreement:   document.getElementById('custody_yes')?.checked ? 'Yes' : 'No',
    custody_details:     v('custody_details_text'),

    // ── Insurance ──
    insurance_company:   v('ins_company'),
    plan_type:           v('ins_plan_type'),
    member_id:           v('ins_member_id'),
    group_number:        v('ins_group_number'),
    subscriber_name:     v('ins_subscriber_name'),
    subscriber_dob:      v('ins_subscriber_dob'),
    subscriber_rel:      v('ins_subscriber_rel'),
    ins_phone:           v('ins_phone'),
    prior_auth:          v('ins_prior_auth'),
    has_secondary_ins:   v('toggle_secondary_insurance'),
    ins2_company:        v('ins2_company'),
    ins2_member_id:      v('ins2_member_id'),
    self_pay:            v('self_pay'),

    // ── Medical History ──
    medications:         v('medications'),
    allergies:           v('allergies'),
    co_occurring:        checkedValues('co_occurring'),
    prev_aba:            document.getElementById('prev_aba_yes')?.checked ? 'Yes' : 'No',
    prev_aba_provider:   v('prev_aba_provider'),
    prev_aba_dates:      v('prev_aba_dates'),
    prev_aba_reason:     v('prev_aba_reason'),
    other_therapies:     checkedValues('other_therapies'),
    other_therapies_text: v('other_therapies_text'),
    pcp_name:            v('pcp_name'),
    pcp_practice:        v('pcp_practice'),
    pcp_phone:           v('pcp_phone'),
    referring_name:      v('referring_name'),
    referring_practice:  v('referring_practice'),
    referring_phone:     v('referring_phone'),
    therapy_goals:       v('therapy_goals'),
    target_areas:        checkedValues('target_areas'),

    // ── Emergency / School ──
    ec1_name:            v('ec1_name'),
    ec1_rel:             v('ec1_relationship'),
    ec1_phone:           v('ec1_phone'),
    ec2_name:            v('ec2_name'),
    ec2_rel:             v('ec2_relationship'),
    ec2_phone:           v('ec2_phone'),
    authorized_pickup:   v('authorized_pickup'),
    school_name_step5:   v('school_name_step5'),
    school_district:     v('school_district'),
    teacher_name:        v('teacher_name'),
    grade_step5:         v('grade_step5'),
    has_iep:             document.getElementById('iep_yes')?.checked ? 'Yes' : 'No',
    iep_coordinator:     v('iep_coordinator'),
    has_504:             document.getElementById('504_yes')?.checked ? 'Yes' : 'No',
    school_contact_name: v('school_contact_name'),
    school_contact_phone: v('school_contact_phone'),
    school_contact_email: v('school_contact_email'),
    referral_source:     v('referral_source'),
    additional_notes:    v('additional_notes'),

    // ── Consents ──
    consents_given:      buildConsentSummary(),

    // ── Signature ──
    sig_name:            v('sig_name'),
    sig_relationship:    v('sig_relationship'),
    sig_date:            v('sig_date'),
    photo_release:       document.getElementById('photo_yes')?.checked ? 'Authorized' : 'Not Authorized',
    preferred_contact:   v('preferred_contact_method'),
    submission_date:     new Date().toLocaleString('en-US'),
  };
}

function buildConsentSummary() {
  const items = [
    ['consent_npp',       'Notice of Privacy Practices (HIPAA)'],
    ['consent_treatment', 'Consent to ABA Treatment'],
    ['consent_hipaa_auth','HIPAA Authorization to Use and Disclose PHI'],
    ['consent_billing',   'Assignment of Benefits & Authorization to Bill Insurance'],
    ['consent_financial', 'Financial Responsibility Agreement'],
    ['consent_electronic','Electronic Communications Consent'],
    ['consent_certify',   'Certification of Accuracy'],
  ];
  return items.map(([id, label]) => {
    const cb = document.getElementById(id);
    return `${label}: ${cb && cb.checked ? 'AGREED' : 'NOT AGREED'}`;
  }).join('\n');
}

// ── Submit intake form ────────────────────────────────────
async function submitIntake() {
  if (!validateStep(6)) return;

  const btn = document.getElementById('submitIntakeBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px"><span class="spin-icon">⏳</span> Submitting…</span>';
  }

  const data = collectFormData();

  // Build a comprehensive email-safe template params object
  const templateParams = {
    to_email:          'michael@goldaba.com',
    reply_to:          data.guardian_email || 'N/A',
    submission_date:   data.submission_date,

    // Core identifiers
    patient_name:      data.patient_name,
    dob:               data.dob,
    diagnosis:         data.diagnosis,
    primary_language:  data.primary_language,
    school_enrolled:   data.school_enrolled,

    // Guardian
    guardian_name:     data.guardian_name,
    guardian_email:    data.guardian_email,
    guardian_phone:    data.guardian_phone,
    guardian_rel:      data.guardian_rel,
    address:           `${data.address1}${data.address2 ? ', ' + data.address2 : ''}, ${data.city}, ${data.state} ${data.zip}`,

    // Insurance
    insurance_company: data.insurance_company,
    member_id:         data.member_id,
    plan_type:         data.plan_type,
    subscriber_name:   data.subscriber_name,

    // Clinical
    medications:       data.medications,
    allergies:         data.allergies,
    therapy_goals:     data.therapy_goals,
    target_areas:      data.target_areas,
    co_occurring:      data.co_occurring,
    other_therapies:   data.other_therapies,
    prev_aba:          data.prev_aba,

    // Emergency
    ec1_name:          data.ec1_name,
    ec1_phone:         data.ec1_phone,

    // Consents
    consents_given:    data.consents_given,

    // Signature
    sig_name:          data.sig_name,
    sig_relationship:  data.sig_relationship,
    sig_date:          data.sig_date,
    photo_release:     data.photo_release,
    referral_source:   data.referral_source,
    additional_notes:  data.additional_notes,

    // Full dump for reference
    full_submission:   JSON.stringify(data, null, 2),
  };

  try {
    if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_INTAKE_ID, templateParams);
    } else {
      // Dev fallback — simulates send when EmailJS not configured
      console.log('📋 Intake Submission (EmailJS not yet configured):', templateParams);
      await new Promise(r => setTimeout(r, 1000));
    }
    showIntakeSuccess(data.guardian_name, data.patient_name);
  } catch (err) {
    console.error('EmailJS intake error:', err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '&#10003; Submit Intake Form';
    }
    alert('Something went wrong while submitting the form. Please try again or email us directly at michael@goldaba.com');
  }
}

// ── Show success state ────────────────────────────────────
function showIntakeSuccess(guardianName, patientName) {
  // Hide form area
  const formWrap = document.getElementById('intake-form-wrap');
  if (formWrap) formWrap.style.display = 'none';

  const progressWrap = document.querySelector('.intake-progress');
  if (progressWrap) progressWrap.style.display = 'none';

  const successEl = document.getElementById('intake-success');
  if (successEl) {
    successEl.classList.add('visible');
    document.getElementById('success-guardian-name').textContent = guardianName || 'there';
    document.getElementById('success-patient-name').textContent  = patientName  || 'your child';

    // Scroll to success
    const top = successEl.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }
}
