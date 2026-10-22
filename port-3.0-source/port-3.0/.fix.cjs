const fs=require('fs');let c=fs.readFileSync('dist/ui.js','utf8');
const a=`  const key = 'https://abacus.jasoncameron.dev/%s/katrinaadewale-dev/views', live = !/^(localhost|127\.|\[::1\])/.test(location.hostname);
  let verb = 'get';
  try { if (live && !sessionStorage.getItem('counted')) { verb = 'hit'; sessionStorage.setItem('counted', '1'); } } catch { /* fine */ }`;
const b=`  // Local previews count against a separate key so they never touch the real number.
  const live = !/^(localhost|127\.|\[::1\])/.test(location.hostname);
  const key = \`https://abacus.jasoncameron.dev/%s/katrinaadewale-dev/\${live ? 'views' : 'preview-views'}\`;
  let verb = 'get';
  try { if (!sessionStorage.getItem('counted')) { verb = 'hit'; sessionStorage.setItem('counted', '1'); } } catch { verb = 'hit'; }`;
if(!c.includes(a)) throw 'missing'; c=c.replace(a,b); c=c.replace("// One hit per browser session on the live site; local previews only read.","// One hit per browser session.");
fs.writeFileSync('dist/ui.js',c);console.log('ok');
