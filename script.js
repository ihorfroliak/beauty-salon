// Салон краси «Світлана» — інтерактив

// Поточний рік у футері
document.getElementById('year').textContent = new Date().getFullYear();

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
