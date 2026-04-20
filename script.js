/* =============================================================
   Golden Bridge ABA — script.js
   All form submissions POST JSON to the Google Apps Script
   endpoint, which logs to the Sheet and emails
   michael@goldaba.com — no third-party SDK required.
============================================================= */

const SERVER_URL = 'https://script.google.com/macros/s/AKfycbyCfdqo6q05CLKxyBQdnfisKIa9tcOlGbUdFTqAkzfVnueUqOpuCILO5DJ4kiCX-mFx/exec';

async function sendToServer(data) {
  // Content-Type must be text/plain for no-cors mode (avoids CORS preflight).
  // GAS receives the raw body and we JSON.parse() it on that side.
  await fetch(SERVER_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(data),
  });
}


/* ── Sticky header ─────────────────────────────────────────── */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
});


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
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }
  });
});


/* ── Scroll fade-in ────────────────────────────────────────── */
const fadeStyle = document.createElement('style');
fadeStyle.textContent = `.fade-in{opacity:0;transform:translateY(20px);transition:opacity .6s ease,transform .6s ease}.fade-in.visible{opacity:1;transform:translateY(0)}`;
document.head.appendChild(fadeStyle);

const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
}, { threshold: 0.12 });

document.querySelectorAll('.service-card,.why-card,.location-card,.insurance-col,.about-card').forEach(el => {
  el.classList.add('fade-in'); io.observe(el);
});


/* ═══════════════════════════════════════════════════════════
   MULTI-STEP BOOKING FORM
═══════════════════════════════════════════════════════════ */

let currentStep   = 1;
let selectedDate  = null;   // Date object
let selectedTime  = null;   // string, e.g. "10:00 AM"

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '1:00 PM', '1:30 PM',
  '2:00 PM',  '2:30 PM', '3:00 PM',  '3:30 PM',
  '4:00 PM',  '4:30 PM'
];

/* ── Step navigation ───────────────────────────────────────── */
function goToStep(n) {
  // Validate step 1 before advancing
  if (n > 1 && currentStep === 1 && !validateStep1()) return;
  // Require date before step 3
  if (n > 2 && !selectedDate) { alert('Please select a date first.'); return; }
  // Require time before step 4
  if (n > 3 && !selectedTime) { alert('Please select a time slot first.'); return; }

  // Hide all steps
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  // Show target step
  const target = document.getElementById('step-' + n);
  if (target) { target.classList.add('active'); target.style.display = ''; }

  currentStep = n;
  updateProgress(n);

  if (n === 3) renderTimeSlots();
  if (n === 4) populateReview();
}

/* ── Step 1 validation ─────────────────────────────────────── */
function validateStep1() {
  const first  = document.getElementById('firstName').value.trim();
  const last   = document.getElementById('lastName').value.trim();
  const email  = document.getElementById('email').value.trim();
  const state  = document.getElementById('state').value;

  if (!first || !last) { alert('Please enter your first and last name.'); return false; }
  if (!email || !/\S+@\S+\.\S+/.test(email)) { alert('Please enter a valid email address.'); return false; }
  if (!state) { alert('Please select your state.'); return false; }
  return true;
}

/* ── Progress dots ─────────────────────────────────────────── */
function updateProgress(active) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('prog-' + i);
    if (!el) continue;
    el.classList.remove('active', 'done');
    if (i < active) el.classList.add('done');
    if (i === active) el.classList.add('active');
  }
}


/* ═══════════════════════════════════════════════════════════
   CALENDAR
═══════════════════════════════════════════════════════════ */
let calYear, calMonth;

function initCalendar() {
  const now = new Date();
  calYear  = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar();

  document.getElementById('prevMonth').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });
}

function renderCalendar() {
  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  document.getElementById('calMonthLabel').textContent = `${monthNames[calMonth]} ${calYear}`;

  const grid  = document.getElementById('calGrid');
  grid.innerHTML = '';

  const today     = new Date(); today.setHours(0,0,0,0);
  const firstDay  = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMon = new Date(calYear, calMonth + 1, 0).getDate();

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day cal-day-empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMon; d++) {
    const date    = new Date(calYear, calMonth, d);
    const dow     = date.getDay(); // 0=Sun, 6=Sat
    const isPast  = date < today;
    const isWeekend = dow === 0 || dow === 6;
    const isToday = date.getTime() === today.getTime();
    const isSelected = selectedDate && date.getTime() === selectedDate.getTime();

    const cell = document.createElement('div');
    cell.textContent = d;
    cell.className   = 'cal-day';

    if (isWeekend)  cell.classList.add('cal-day-weekend');
    if (isPast)     cell.classList.add('cal-day-disabled');
    if (isToday)    cell.classList.add('cal-day-today');
    if (isSelected) cell.classList.add('cal-day-selected');

    if (!isPast && !isWeekend) {
      cell.addEventListener('click', () => selectDate(date));
    }
    grid.appendChild(cell);
  }
}

function selectDate(date) {
  selectedDate = date;
  selectedTime = null; // reset time when date changes
  renderCalendar();
  document.getElementById('toStep3Btn').disabled = false;
  document.getElementById('toStep4Btn').disabled = true;
}

/* ── Format a Date nicely ───────────────────────────────────── */
function formatDate(date) {
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}


/* ═══════════════════════════════════════════════════════════
   TIME SLOTS
═══════════════════════════════════════════════════════════ */
function renderTimeSlots() {
  const container = document.getElementById('timeSlots');
  container.innerHTML = '';

  if (selectedDate) {
    document.getElementById('selectedDateLabel').textContent = formatDate(selectedDate);
  }

  TIME_SLOTS.forEach(t => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'time-slot' + (selectedTime === t ? ' selected' : '');
    btn.textContent = t;
    btn.addEventListener('click', () => {
      selectedTime = t;
      document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('toStep4Btn').disabled = false;
    });
    container.appendChild(btn);
  });
}


/* ═══════════════════════════════════════════════════════════
   REVIEW
═══════════════════════════════════════════════════════════ */
function populateReview() {
  const first = document.getElementById('firstName').value.trim();
  const last  = document.getElementById('lastName').value.trim();
  const stateEl = document.getElementById('state');
  const stateText = stateEl.options[stateEl.selectedIndex]?.text || '';

  document.getElementById('rev-name').textContent    = `${first} ${last}`;
  document.getElementById('rev-email').textContent   = document.getElementById('email').value.trim();
  document.getElementById('rev-phone').textContent   = document.getElementById('phone').value.trim() || '—';
  document.getElementById('rev-state').textContent   = stateText;
  document.getElementById('rev-date').textContent    = selectedDate ? formatDate(selectedDate) : '—';
  document.getElementById('rev-time').textContent    = selectedTime || '—';
  document.getElementById('rev-message').textContent = document.getElementById('message').value.trim() || '—';
}


/* ═══════════════════════════════════════════════════════════
   SUBMIT → EmailJS → michael@goldaba.com
═══════════════════════════════════════════════════════════ */
async function submitBooking() {
  const btn = document.getElementById('submitBtn');
  btn.disabled   = true;
  btn.textContent = 'Sending…';

  const first   = document.getElementById('firstName').value.trim();
  const last    = document.getElementById('lastName').value.trim();
  const email   = document.getElementById('email').value.trim();
  const phone   = document.getElementById('phone').value.trim();
  const stateEl = document.getElementById('state');
  const state   = stateEl.options[stateEl.selectedIndex]?.text || stateEl.value;
  const msg     = document.getElementById('message').value.trim();
  const dateStr = selectedDate ? formatDate(selectedDate) : '—';

  try {
    await sendToServer({
      form:      'Consultation Booking',
      name:      `${first} ${last}`,
      email:     email,
      phone:     phone || '',
      state:     state,
      appt_date: dateStr,
      appt_time: selectedTime,
      message:   msg || '',
      submitted: new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
    });
    showSuccess(email, dateStr, selectedTime);
  } catch (err) {
    console.error('Submission error:', err);
    btn.disabled    = false;
    btn.textContent = '✓ Confirm Booking';
    alert('Something went wrong. Please try again or email us directly at michael@goldaba.com');
  }
}

function showSuccess(email, dateStr, time) {
  // Hide all form steps
  document.querySelectorAll('.form-step').forEach(s => { s.classList.remove('active'); s.style.display = 'none'; });
  const successStep = document.getElementById('step-success');
  successStep.style.display = 'block';
  successStep.style.animation = 'stepIn 0.3s ease';

  document.getElementById('success-email').textContent    = email;
  document.getElementById('success-datetime').textContent = `📅 ${dateStr} at ${time}`;

  updateProgress(5); // mark all done
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('prog-' + i);
    if (el) el.classList.add('done');
  }
}

function resetForm() {
  // Reset all state
  selectedDate = null;
  selectedTime = null;
  currentStep  = 1;
  document.getElementById('firstName').value = '';
  document.getElementById('lastName').value  = '';
  document.getElementById('email').value     = '';
  document.getElementById('phone').value     = '';
  document.getElementById('state').value     = '';
  document.getElementById('message').value   = '';
  document.getElementById('toStep3Btn').disabled = true;
  document.getElementById('toStep4Btn').disabled = true;

  // Hide success, show step 1
  document.getElementById('step-success').style.display = 'none';
  document.querySelectorAll('.form-step').forEach(s => { s.classList.remove('active'); s.style.display = ''; });
  document.getElementById('step-1').classList.add('active');

  updateProgress(1);
  renderCalendar();
}


/* ═══════════════════════════════════════════════════════════
   COUNTDOWN TIMER — target: June 1, 2026, 9:00 AM local
═══════════════════════════════════════════════════════════ */
const OPENING_DATE = new Date('2026-06-01T09:00:00');

function pad(n) { return String(n).padStart(2, '0'); }

function updateCountdown() {
  const now  = new Date();
  const diff = OPENING_DATE - now;

  if (diff <= 0) {
    const wrap = document.getElementById('countdown');
    if (wrap) wrap.innerHTML = '<div class="countdown-open">&#127881; We are now open!</div>';
    return;
  }

  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs  = Math.floor((diff % (1000 * 60)) / 1000);

  const dEl = document.getElementById('cd-days');
  const hEl = document.getElementById('cd-hours');
  const mEl = document.getElementById('cd-mins');
  const sEl = document.getElementById('cd-secs');

  if (dEl) dEl.textContent = pad(days);
  if (hEl) hEl.textContent = pad(hours);
  if (mEl) mEl.textContent = pad(mins);
  if (sEl) sEl.textContent = pad(secs);
}


/* ═══════════════════════════════════════════════════════════
   WAITLIST FORM SUBMISSION → michael@goldaba.com
═══════════════════════════════════════════════════════════ */
async function submitWaitlist() {
  const firstName = document.getElementById('wl-firstName').value.trim();
  const lastName  = document.getElementById('wl-lastName').value.trim();
  const email     = document.getElementById('wl-email').value.trim();
  const phone     = document.getElementById('wl-phone').value.trim();
  const state     = document.getElementById('wl-state').value;
  const insurance = document.getElementById('wl-insurance').value.trim();
  const message   = document.getElementById('wl-message').value.trim();

  if (!firstName || !lastName) { alert('Please enter your first and last name.'); return; }
  if (!email || !/\S+@\S+\.\S+/.test(email)) { alert('Please enter a valid email address.'); return; }
  if (!state) { alert('Please select your state.'); return; }

  const btn = document.getElementById('wlSubmitBtn');
  btn.disabled    = true;
  btn.textContent = 'Submitting\u2026';

  try {
    await sendToServer({
      form:      'Waitlist',
      name:      `${firstName} ${lastName}`,
      email:     email,
      phone:     phone || '',
      state:     state,
      insurance: insurance || '',
      message:   message || '',
      submitted: new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
    });
    document.getElementById('waitlistFormCard').style.display = 'none';
    const successEl = document.getElementById('waitlistSuccess');
    successEl.style.display = 'block';
    document.getElementById('wl-success-name').textContent  = firstName;
    document.getElementById('wl-success-email').textContent = email;
    document.getElementById('wl-success-state').textContent = state;
  } catch (err) {
    console.error('Submission error:', err);
    btn.disabled    = false;
    btn.textContent = '\u2605 Join the Waitlist';
    alert('Something went wrong. Please email us directly at michael@goldaba.com');
  }
}

function resetWaitlist() {
  ['wl-firstName','wl-lastName','wl-email','wl-phone','wl-state','wl-insurance','wl-message']
    .forEach(id => { document.getElementById(id).value = ''; });
  const btn = document.getElementById('wlSubmitBtn');
  btn.disabled    = false;
  btn.textContent = '\u2605 Join the Waitlist';
  document.getElementById('waitlistSuccess').style.display  = 'none';
  document.getElementById('waitlistFormCard').style.display = 'block';
}


/* ── Boot ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateCountdown();
  setInterval(updateCountdown, 1000);
  if (document.getElementById('calGrid')) initCalendar();
});
