// Clear localStorage and force light mode
// Run this in browser console to reset theme

localStorage.removeItem('theme');
localStorage.setItem('theme', 'light');
document.documentElement.classList.remove('dark');
document.documentElement.style.colorScheme = 'light';
window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: 'light' } }));
console.log('Theme reset to light mode');
location.reload();
