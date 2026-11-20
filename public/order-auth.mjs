export async function api(path,body){
 const r=await fetch('/api/'+path,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const d=await r.json();if(!r.ok)throw Error(d.error||'Please try again.');return d;
}

for (const toggle of document.querySelectorAll('[data-password-toggle]')) {
 const password = document.getElementById(toggle.getAttribute('aria-controls'));
 toggle.hidden = false;
 toggle.addEventListener('click', () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
  toggle.classList.toggle('is-visible', visible);
 });
}

const registration = document.getElementById('register');
if (registration) {
 registration.addEventListener('submit', async event => {
  event.preventDefault();
  const submit = event.submitter;
  if (submit.disabled) return;
  const input = Object.fromEntries(new FormData(registration));
  input.termsAccepted = registration.elements.termsAccepted.checked;
  const message = document.getElementById('registration-status');
  submit.disabled = true;
  message.textContent = '';
  try {
   await api('auth/signup', input);
   location.replace('/order-form.html');
  } catch (error) {
   message.textContent = error.message;
   submit.disabled = false;
  }
 });
}
