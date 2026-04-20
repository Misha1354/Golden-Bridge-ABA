/* =============================================================
   careers.js — Golden Bridge ABA Careers Page
   Application form → michael@goldaba.com via EmailJS
============================================================= */

const EMAILJS_PUBLIC_KEY        = 'btXpytjzt6k7rwIQ5';
const EMAILJS_SERVICE_ID        = 'service_i6ba13z';
const EMAILJS_TEMPLATE_CAREERS  = 'template_7sej6cs';

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyCfdqo6q05CLKxyBQdnfisKIa9tcOlGbUdFTqAkzfVnueUqOpuCILO5DJ4kiCX-mFx/exec';
function sendToSheet(data) {
  fetch(SHEET_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(err => console.warn('Sheet sync failed:', err));
}

(function () {
  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }
})();

/* ── Mobile menu ───────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const nav       = document.getElementById('nav');
hamburger.addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(l => l.addEventListener('click', () => nav.classList.remove('open')));
document.addEventListener('click', e => {
  if (!nav.contains(e.target) && !hamburger.contains(e.target)) nav.classList.remove('open');
});

/* ── Smooth scroll ─────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
    }
  });
});

/* ── Scroll fade-in ────────────────────────────────────────── */
const fadeStyle = document.createElement('style');
fadeStyle.textContent = `.fade-in{opacity:0;transform:translateY(18px);transition:opacity .55s ease,transform .55s ease}.fade-in.visible{opacity:1;transform:translateY(0)}`;
document.head.appendChild(fadeStyle);
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.careers-why-card, .job-card').forEach(el => {
  el.classList.add('fade-in'); io.observe(el);
});

/* ── Select role from job card button ──────────────────────── */
function selectRole(role) {
  const sel = document.getElementById('ap-role');
  if (sel) sel.value = role;
  // Smooth scroll handled by anchor
}

/* ── Application submission ────────────────────────────────── */
async function submitApplication() {
  const role       = document.getElementById('ap-role').value;
  const firstName  = document.getElementById('ap-firstName').value.trim();
  const lastName   = document.getElementById('ap-lastName').value.trim();
  const email      = document.getElementById('ap-email').value.trim();
  const phone      = document.getElementById('ap-phone').value.trim();
  const state      = document.getElementById('ap-state').value;
  const experience = document.getElementById('ap-experience').value;
  const message    = document.getElementById('ap-message').value.trim();

  if (!role)      { alert('Please select a position.'); return; }
  if (!firstName || !lastName) { alert('Please enter your full name.'); return; }
  if (!email || !/\S+@\S+\.\S+/.test(email)) { alert('Please enter a valid email address.'); return; }
  if (!phone)     { alert('Please enter your phone number.'); return; }
  if (!state)     { alert('Please select a state.'); return; }
  if (!experience){ alert('Please select your experience level.'); return; }
  if (!message)   { alert('Please tell us a bit about yourself.'); return; }

  const btn = document.getElementById('applySubmitBtn');
  btn.disabled    = true;
  btn.textContent = 'Submitting\u2026';

  const templateParams = {
    to_email:        'michael@goldaba.com',
    form_type:       'Career Application',
    position:        role,
    from_name:       `${firstName} ${lastName}`,
    from_email:      email,
    phone:           phone,
    state:           state,
    experience:      experience,
    message:         message,
    reply_to:        email,
    submission_date: new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }),
  };

  sendToSheet({
    form:    'Career Application',
    name:    `${firstName} ${lastName}`,
    email:   email,
    phone:   phone,
    message: [role, experience, message].filter(Boolean).join(' | '),
  });

  try {
    if (typeof emailjs !== 'undefined') {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CAREERS, templateParams);
    } else {
      console.log('\uD83D\uDCEC Career application (EmailJS unavailable):', templateParams);
      await new Promise(r => setTimeout(r, 700));
    }

    document.getElementById('applyFormWrap').style.display = 'none';
    const successEl = document.getElementById('applySuccess');
    successEl.style.display = 'block';
    document.getElementById('apply-success-name').textContent = firstName;
    document.getElementById('apply-success-role').textContent = role;

  } catch (err) {
    console.error('EmailJS error:', err);
    btn.disabled    = false;
    btn.textContent = 'Submit Application';
    alert('Something went wrong. Please email us directly at michael@goldaba.com');
  }
}

function resetApplication() {
  ['ap-role','ap-firstName','ap-lastName','ap-email','ap-phone','ap-state','ap-experience','ap-message']
    .forEach(id => { document.getElementById(id).value = ''; });
  const btn = document.getElementById('applySubmitBtn');
  btn.disabled    = false;
  btn.textContent = 'Submit Application';
  document.getElementById('applySuccess').style.display  = 'none';
  document.getElementById('applyFormWrap').style.display = 'block';
}
