const api = 'https://kgqdadqqqcrlnptedlwa.supabase.co';
const publicKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncWRhZHFxcWNybG5wdGVkbHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0OTc4MzksImV4cCI6MjExMDA3MzgzOX0.DpjJHD57dzXu83TKE16hiGgitGjnH7k1meAAaOPAUDs';
const headers = { apikey: publicKey, Authorization: 'Bearer ' + publicKey };
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
const dialog = document.querySelector('dialog');
const tourStatus = document.querySelector('#tourStatus');
let viewer;
document.querySelector('#openTour').onclick = async () => {
  dialog.showModal();
  if (viewer) { viewer.draw(); return; }
  tourStatus.textContent = 'טוענים את הדירה…';
  try {
    const { start } = await import('./viewer.js');
    const url = api + '/storage/v1/object/authenticated/property-scans/a4062f5b-1dd8-441c-beaa-f6e89fa77adb/26503d99-24d5-4cd1-bc76-a6a8cd4b50b3/b6b5dadb-7410-4122-b861-1fea831d0469/ddb8919b-54b5-4e71-af94-94a0d0d28c11/walkthrough.glb';
    viewer = await start(url, headers);
    tourStatus.textContent = '';
  } catch {
    tourStatus.textContent = 'לא הצלחנו להציג את הסיור. אפשר לסגור ולנסות שוב.';
  }
};
document.querySelector('#closeTour').onclick = () => dialog.close();
