// Салон краси «Світлана» — інтерактив

// Поточний рік у футері
document.getElementById('year').textContent = new Date().getFullYear();

// Форма замовлення дзвінка (демо: без бекенду)
const form = document.getElementById('callback-form');
const hint = document.getElementById('form-hint');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();

    // Проста валідація номера: щонайменше 9 цифр
    const digits = phone.replace(/\D/g, '');
    if (!name || digits.length < 9) {
      hint.textContent = 'Будь ласка, вкажіть ім\'я та коректний номер телефону.';
      hint.className = 'form-hint err';
      return;
    }

    // TODO: тут підключити відправку на бекенд / Telegram-бота / e-mail
    hint.textContent = `Дякуємо, ${name}! Ми передзвонимо найближчим часом.`;
    hint.className = 'form-hint ok';
    form.reset();
  });
}
