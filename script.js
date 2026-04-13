/* =============================================================
   Golden Bridge ABA — script.js
   EmailJS setup (5 min — free tier is enough):
   1. Go to https://emailjs.com and create a free account
   2. Add an Email Service (Gmail works great) → copy Service ID
   3. Create an Email Template — use these template variables:
        {{from_name}}, {{from_email}}, {{phone}}, {{state}},
        {{appt_date}}, {{appt_time}}, {{message}}
      Set "To Email" in the template to: michael@goldaba.com
   4. Go to Account → API Keys → copy your Public Key
   5. Replace the three placeholders below with your real values
============================================================= */

const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // ← replace
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // ← replace
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // ← replace

// Init EmailJS
(function() {
  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }
})();


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

  const templateParams = {
    to_email:   'michael@goldaba.com',
    from_name:  `${first} ${last}`,
    from_email: email,
    phone:      phone || 'Not provided',
    state:      state,
    appt_date:  dateStr,
    appt_time:  selectedTime,
    message:    msg || 'No message provided',
    reply_to:   email,
  };

  try {
    if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    } else {
      // Dev fallback — log to console until EmailJS credentials are configured
      console.log('📬 Booking submission (EmailJS not yet configured):', templateParams);
      await new Promise(r => setTimeout(r, 800)); // simulate delay
    }
    showSuccess(email, dateStr, selectedTime);
  } catch (err) {
    console.error('EmailJS error:', err);
    btn.disabled   = false;
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


/* ── Boot ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initCalendar();
});
