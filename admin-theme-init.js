(() => {
  let theme='light';
  try { theme=localStorage.getItem('sai-admin-theme')==='dark'?'dark':'light'; } catch {}
  document.documentElement.dataset.theme=theme;
})();
