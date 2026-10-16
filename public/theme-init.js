// Apply before the app paints so saved preferences do not flash the wrong theme.
(() => {
  let preference = 'system'
  try {
    const saved = localStorage.getItem('islasafe.theme')
    if (saved === 'light' || saved === 'dark') preference = saved
  } catch { /* System preference also works when storage is unavailable. */ }
  const theme = preference === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : preference
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
})()
