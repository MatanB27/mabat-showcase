import { api, headers } from "./api.js";

const form = document.querySelector('form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = document.querySelector('#submit');
  const status = document.querySelector('#status');
  if (button.disabled) return;
  button.disabled = true;
  status.textContent = 'שולחים את הפנייה…';
  const fields = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch(api + '/rest/v1/showcase_leads', {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({name: fields.name.trim(), email: fields.email.trim(), note: fields.note.trim()})
    });
    if (!response.ok) throw new Error('Submission failed');
    form.reset();
    status.textContent = 'הפרטים התקבלו. נחזור אליכם במייל.';
  } catch {
    status.textContent = 'השליחה נכשלה. הפרטים נשמרו בטופס ואפשר לנסות שוב.';
  } finally { button.disabled = false; }
});
