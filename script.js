// Салон краси «Світлана» — інтерактив

// Поточний рік у футері
document.getElementById('year').textContent = new Date().getFullYear();

// Мобільне меню (гамбургер)
const header = document.querySelector('.site-header');
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
if (burger && header && nav) {
  const closeNav = () => {
    header.classList.remove('nav-open');
    burger.setAttribute('aria-expanded', 'false');
  };
  burger.addEventListener('click', () => {
    const open = header.classList.toggle('nav-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));
}

// Тінь у шапки після скролу
if (header) {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// Плавна поява секцій при прокручуванні
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll(
    '.section-eyebrow, .section-title, .prices-note, .service-card, .adv-card, .gallery-item, .review-card, .price-block, .about-text, .about-badge, .contacts-card, .services-cta'
  );
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('reveal-in');
        // Після появи прибираємо класи, інакше вони глушать hover-ефекти карток
        el.addEventListener('transitionend', () => {
          el.classList.remove('reveal', 'reveal-in');
          el.style.transitionDelay = '';
        }, { once: true });
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach((el, i) => {
    el.classList.add('reveal');
    // невеликий каскад для сусідніх елементів
    const delay = (i % 4) * 80;
    el.style.transitionDelay = delay + 'ms';
    io.observe(el);
  });
}

// Години роботи (за київським часом). Мають збігатися з текстом і JSON-LD в index.html
const OPEN_HOUR = 9;
const CLOSE_HOUR = 21;
const kyivHourFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Kyiv', hour: 'numeric', hourCycle: 'h23' });
const isOpenNow = () => {
  const hour = Number(kyivHourFormat.format(new Date()));
  return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
};

// Статус «відчинено/зачинено»: поза робочим часом ведемо до форми, а не до дзвінка без відповіді
const statusEl = document.getElementById('open-status');
const leadEl = document.getElementById('callback-lead');
const defaultLead = leadEl ? leadEl.textContent : '';
const heroCta = document.querySelector('.hero-actions .btn-call');
const heroCtaHtml = heroCta.innerHTML;
const heroCtaHref = heroCta.getAttribute('href');
function renderOpenStatus() {
  const open = isOpenNow();
  document.body.classList.toggle('is-closed', !open);
  // Номер лишається видимим під кнопкою, тож зателефонувати можна й поза робочим часом
  heroCta.setAttribute('href', open ? heroCtaHref : '#callback');
  if (open) heroCta.innerHTML = heroCtaHtml;
  else heroCta.textContent = 'Замовити дзвінок';
  if (statusEl) {
    statusEl.innerHTML = open
      ? '<span class="status-dot" aria-hidden="true"></span>Зараз відчинено · до 21:00, без вихідних'
      : '<span class="status-dot" aria-hidden="true"></span>Зараз зачинено · працюємо з 09:00 · <a href="#callback">замовте дзвінок</a>';
  }
  if (leadEl) {
    leadEl.textContent = open ? defaultLead : 'Зараз ми зачинені. Залиште номер — передзвонимо після 09:00.';
  }
}
renderOpenStatus();
setInterval(renderOpenStatus, 60000);

// Десктоп: tel: часто нікуди не веде, тому копіюємо номер і показуємо його
const phoneLink = document.querySelector('.phone-big');
const phoneText = phoneLink.textContent.trim();
const phoneHref = phoneLink.getAttribute('href');
const toast = document.getElementById('toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
}
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.addEventListener('click', async (e) => {
    if (!e.target.closest('a[href^="tel:"]')) return;
    try {
      await navigator.clipboard.writeText(phoneText);
      showToast(`Номер скопійовано: ${phoneText}`);
    } catch {
      showToast(`Наш номер: ${phoneText}`);
    }
  });
}

// Форма замовлення дзвінка → надсилає заявку в Telegram через /api/callback
const form = document.getElementById('callback-form');
const hint = document.getElementById('form-hint');

// «Передзвоніть мені» з картки: підставляємо послугу у форму
document.querySelectorAll('[data-service]').forEach((link) => {
  link.addEventListener('click', () => {
    form.service.value = link.dataset.service;
    form.name.focus({ preventScroll: true });
  });
});

// Заявка не має загубитися: при помилці одразу даємо номер для дзвінка
function showFormError(message) {
  const call = document.createElement('a');
  call.href = phoneHref;
  call.textContent = phoneText;
  hint.textContent = `${message} `;
  hint.append(call);
  hint.className = 'form-hint err';
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const service = form.service.value;
    const website = form.website ? form.website.value : ''; // honeypot

    // Ті самі формати номера, що приймає api/callback.js
    const digits = phone.replace(/\D/g, '').replace(/^00/, '');
    const phoneValid = /^(\d{9}|0\d{9}|\d{11,15})$/.test(digits);
    form.name.setAttribute('aria-invalid', String(!name));
    form.phone.setAttribute('aria-invalid', String(!phoneValid));
    if (!name || !phoneValid) {
      hint.textContent = !name
        ? 'Вкажіть, будь ласка, ваше ім\'я.'
        : 'Перевірте номер. Наприклад: 099 123 45 67.';
      hint.className = 'form-hint err';
      (!name ? form.name : form.phone).focus();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    hint.textContent = 'Надсилаємо…';
    hint.className = 'form-hint';

    try {
      const res = await fetch('/api/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, service, website }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        hint.textContent = isOpenNow()
          ? `Дякуємо, ${name}! Передзвонимо протягом 15 хвилин.`
          : `Дякуємо, ${name}! Передзвонимо після 09:00.`;
        hint.className = 'form-hint ok';
        form.reset();
      } else {
        showFormError('Не вдалося надіслати заявку. Зателефонуйте нам:');
      }
    } catch {
      showFormError('Проблема зі з\'єднанням. Зателефонуйте нам:');
    } finally {
      btn.disabled = false;
    }
  });
}
