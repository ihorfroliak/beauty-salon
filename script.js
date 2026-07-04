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
        entry.target.classList.add('reveal-in');
        obs.unobserve(entry.target);
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

// Форма замовлення дзвінка → надсилає заявку в Telegram через /api/callback
const form = document.getElementById('callback-form');
const hint = document.getElementById('form-hint');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const website = form.website ? form.website.value : ''; // honeypot

    // Проста валідація номера: щонайменше 9 цифр
    const digits = phone.replace(/\D/g, '');
    if (!name || digits.length < 9) {
      hint.textContent = 'Будь ласка, вкажіть ім\'я та коректний номер телефону.';
      hint.className = 'form-hint err';
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
        body: JSON.stringify({ name, phone, website }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        hint.textContent = `Дякуємо, ${name}! Ми передзвонимо найближчим часом.`;
        hint.className = 'form-hint ok';
        form.reset();
      } else {
        hint.textContent = 'Не вдалося надіслати заявку. Зателефонуйте нам, будь ласка.';
        hint.className = 'form-hint err';
      }
    } catch {
      hint.textContent = 'Проблема зі з\'єднанням. Зателефонуйте нам, будь ласка.';
      hint.className = 'form-hint err';
    } finally {
      btn.disabled = false;
    }
  });
}
