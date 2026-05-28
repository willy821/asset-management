/* ================================================================
   Red Beacon Asset Management — script.js
   ================================================================
   Sections
     1. Sticky navbar (transparent → solid on scroll)
     2. Mobile hamburger menu
     3. Smooth scroll (respects nav height offset)
     4. Scroll-reveal (IntersectionObserver + stagger)
     5. Animated stat counters
     6. Testimonial carousel (auto-rotate + touch swipe)
     7. Contact form — validation + async FormSubmit submission
     8. Copyright year
================================================================ */

'use strict';

/* ── 0. Disclaimer Gate ───────────────────────────────────── */
(function () {
  const overlay = document.getElementById('disclaimer-overlay');
  const acceptBtn = document.getElementById('disclaimer-accept');
  if (!overlay || !acceptBtn) return;

  // Prevent the page behind from scrolling while modal is open
  document.body.style.overflow = 'hidden';

  // Trap focus inside the modal while it is visible
  overlay.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') return; // do not allow Escape to dismiss
    if (e.key !== 'Tab') return;

    const focusable = overlay.querySelectorAll(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  });

  // Move initial focus to the button
  acceptBtn.focus();

  acceptBtn.addEventListener('click', function () {
    // Fade out, then remove overlay and restore scroll
    overlay.classList.add('fade-out');
    overlay.addEventListener('transitionend', function () {
      overlay.remove();
      document.body.style.overflow = '';
    }, { once: true });
  });
}());

/* ── 1. Sticky Navbar ─────────────────────────────────────── */
const navbar = document.getElementById('navbar');

function syncNavbar() {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}
window.addEventListener('scroll', syncNavbar, { passive: true });
syncNavbar(); // run immediately on load


/* ── 2. Hamburger Menu ────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

// Scrim overlay so clicking outside the drawer closes it
const scrim = Object.assign(document.createElement('div'), {
  style: 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:900;display:none;',
});
document.body.appendChild(scrim);

function setMenuOpen(open) {
  hamburger.classList.toggle('open', open);
  navLinks.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  scrim.style.display = open ? 'block' : 'none';
  document.body.style.overflow = open ? 'hidden' : '';
}

hamburger.addEventListener('click', () => setMenuOpen(!navLinks.classList.contains('open')));
scrim.addEventListener('click', () => setMenuOpen(false));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') setMenuOpen(false);
});

// Close drawer when any nav link is clicked
navLinks.querySelectorAll('.nav-link').forEach(a =>
  a.addEventListener('click', () => setMenuOpen(false))
);


/* ── 3. Smooth Scroll ─────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
    ) || 70;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - navH,
      behavior: 'smooth',
    });
  });
});


/* ── 4. Scroll-Reveal (fade-up + stagger) ─────────────────── */
const fadeEls = document.querySelectorAll('.fade-up');

const revealObs = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      // Stagger sibling .fade-up elements inside a grid/flex parent
      const delay = calcStagger(entry.target);
      setTimeout(() => entry.target.classList.add('in-view'), delay);
      revealObs.unobserve(entry.target);
    });
  },
  { threshold: 0.1 }
);

function calcStagger(el) {
  const siblings = Array.from(
    el.parentElement?.querySelectorAll('.fade-up') ?? []
  );
  const idx = siblings.indexOf(el);
  return idx * 90; // 90ms between each sibling
}

fadeEls.forEach(el => revealObs.observe(el));


/* ── 5. Animated Stat Counters ────────────────────────────── */
const COUNTER_DURATION = 2000; // ms

function animateCounter(el) {
  const target   = parseFloat(el.dataset.target);
  const prefix   = el.dataset.prefix  ?? '';
  const suffix   = el.dataset.suffix  ?? '';
  const decimals = parseInt(el.dataset.decimals ?? '0', 10);
  const start    = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / COUNTER_DURATION, 1);
    // Ease-out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const value    = target * eased;

    el.textContent = prefix
      + (decimals > 0
          ? value.toFixed(decimals)
          : Math.floor(value).toLocaleString())
      + suffix;

    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const counterObs = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObs.unobserve(entry.target);
    });
  },
  { threshold: 0.4 }
);

document.querySelectorAll('.stat-num[data-target]').forEach(el => counterObs.observe(el));


/* ── 6. Testimonial Carousel ──────────────────────────────── */
const track      = document.getElementById('carousel-track');
const dots       = document.querySelectorAll('.c-dots .dot');
const prevBtn    = document.getElementById('prev-btn');
const nextBtn    = document.getElementById('next-btn');
const slides     = track.querySelectorAll('.testi-card');
const TOTAL      = slides.length;
let   current    = 0;
let   autoTimer;

function goTo(idx) {
  current = ((idx % TOTAL) + TOTAL) % TOTAL; // wrap safely
  track.style.transform = `translateX(-${current * 100}%)`;

  dots.forEach((d, i) => {
    d.classList.toggle('active', i === current);
    d.setAttribute('aria-selected', String(i === current));
  });

  slides.forEach((s, i) => {
    s.setAttribute('aria-hidden', String(i !== current));
  });
}

function startAuto() {
  stopAuto();
  autoTimer = setInterval(() => goTo(current + 1), 5000);
}
function stopAuto()  { clearInterval(autoTimer); }
function resetAuto() { stopAuto(); startAuto(); }

nextBtn.addEventListener('click', () => { goTo(current + 1); resetAuto(); });
prevBtn.addEventListener('click', () => { goTo(current - 1); resetAuto(); });

dots.forEach(dot => {
  dot.addEventListener('click', () => {
    goTo(parseInt(dot.dataset.idx, 10));
    resetAuto();
  });
});

// Touch / swipe support
let touchX0 = 0;
track.addEventListener('touchstart', e => { touchX0 = e.touches[0].clientX; }, { passive: true });
track.addEventListener('touchend', e => {
  const delta = touchX0 - e.changedTouches[0].clientX;
  if (Math.abs(delta) > 44) {
    goTo(current + (delta > 0 ? 1 : -1));
    resetAuto();
  }
}, { passive: true });

// Pause on hover
const carouselOuter = document.querySelector('.carousel-outer');
carouselOuter.addEventListener('mouseenter', stopAuto);
carouselOuter.addEventListener('mouseleave', startAuto);

// Keyboard navigation while carousel is focused
carouselOuter.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { goTo(current + 1); resetAuto(); }
  if (e.key === 'ArrowLeft')  { goTo(current - 1); resetAuto(); }
});

startAuto();


/* ── 7. Contact Form ──────────────────────────────────────── */
const form      = document.getElementById('contact-form');
const feedback  = document.getElementById('form-feedback');
const submitBtn = document.getElementById('submit-btn');

/* Validation rules per field id */
const RULES = {
  'f-name':  { required: true,  label: 'Full name',         errorId: 'err-name'   },
  'f-email': { required: true,  label: 'Email address',     errorId: 'err-email',
               pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
               patternMsg: 'Please enter a valid email address.' },
  'f-invest':{ required: true,  label: 'Investment range',  errorId: 'err-invest' },
};

function getErr(id) { return document.getElementById(RULES[id]?.errorId); }

function validateField(el) {
  const rule = RULES[el.id];
  if (!rule) return true;

  const val = el.value.trim();
  let msg    = '';

  if (rule.required && !val) {
    msg = `${rule.label} is required.`;
  } else if (rule.pattern && val && !rule.pattern.test(val)) {
    msg = rule.patternMsg;
  }

  el.classList.toggle('invalid', !!msg);
  const errEl = getErr(el.id);
  if (errEl) errEl.textContent = msg;
  return !msg;
}

// Live feedback: validate on blur, clear on input once invalid
Object.keys(RULES).forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('blur', () => validateField(el));
  el.addEventListener('input', () => {
    if (el.classList.contains('invalid')) validateField(el);
  });
});

function setFeedback(type, msg) {
  feedback.className  = `form-feedback show-${type}`;
  feedback.textContent = msg;
  if (type) feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearFeedback() {
  feedback.className   = 'form-feedback';
  feedback.textContent = '';
}

function setLoading(on) {
  submitBtn.classList.toggle('loading', on);
  submitBtn.disabled = on;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  clearFeedback();

  // Validate all required fields
  const allValid = Object.keys(RULES).every(id => {
    const el = document.getElementById(id);
    return el ? validateField(el) : true;
  });

  if (!allValid) {
    setFeedback('error', 'Please correct the highlighted fields before submitting.');
    // Move focus to first invalid field for accessibility
    const firstInvalid = form.querySelector('.invalid');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  setLoading(true);

  try {
    /*
     * FormSubmit AJAX mode:
     *   - Pass Accept: application/json so FormSubmit returns JSON
     *   - Do NOT set Content-Type manually — let the browser set it
     *     from the FormData boundary.
     *
     * FIRST-RUN NOTE:
     *   The very first time this form is submitted, FormSubmit will
     *   send a confirmation email to lunpin.hon@redbeaconam.com.
     *   Click the "Confirm" link in that email to activate the endpoint.
     *   After activation, all subsequent submissions are delivered normally.
     */
    const res = await fetch(form.action, {
      method:  'POST',
      headers: { Accept: 'application/json' },
      body:    new FormData(form),
    });

    if (res.ok) {
      setFeedback(
        'success',
        "✓ Thank you! Your enquiry has been received. We'll be in touch within one business day."
      );
      form.reset();
      form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    } else {
      // FormSubmit may return 422 or 500 on configuration issues
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 120)}`);
    }
  } catch (err) {
    console.error('[ContactForm]', err);
    setFeedback(
      'error',
      'Something went wrong. Please try again, or email us directly at lunpin.hon@redbeaconam.com.'
    );
  } finally {
    setLoading(false);
  }
});


/* ── 8. Copyright Year ────────────────────────────────────── */
const yearEl = document.getElementById('copy-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
