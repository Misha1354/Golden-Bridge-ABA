/* =============================================================
   careers.js — Golden Bridge ABA Careers Page
   All submissions POST JSON to the Google Apps Script endpoint,
   which logs to the Sheet and emails michael@goldaba.com.
============================================================= */

const SERVER_URL = 'https://script.google.com/macros/s/AKfycbyCfdqo6q05CLKxyBQdnfisKIa9tcOlGbUdFTqAkzfVnueUqOpuCILO5DJ4kiCX-mFx/exec';

async function sendToServer(data) {
  await fetch(SERVER_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

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

  try {
    await sendToServer({
      form:       'Career Application',
      name:       `${firstName} ${lastName}`,
      email:      email,
      phone:      phone,
      state:      state,
      position:   role,
      experience: experience,
      message:    message,
      submitted:  new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
    });

    document.getElementById('applyFormWrap').style.display = 'none';
    const successEl = document.getElementById('applySuccess');
    successEl.style.display = 'block';
    document.getElementById('apply-success-name').textContent = firstName;
    document.getElementById('apply-success-role').textContent = role;

  } catch (err) {
    console.error('Submission error:', err);
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
