#!/usr/bin/env node
/* اجازه‌ی دوربین و آیکون برنامه را به پروژه‌ی اندروید اضافه می‌کند (بعد از `npx cap add android`) */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = path.join(__dirname, '..', 'android');
const res = path.join(root, 'app', 'src', 'main', 'res');
const manifest = path.join(root, 'app', 'src', 'main', 'AndroidManifest.xml');

let x = fs.readFileSync(manifest, 'utf8');
function add(tag) { if (!x.includes(tag)) x = x.replace(/<manifest([^>]*)>/, (m) => `${m}\n    ${tag}`); }
add('<uses-permission android:name="android.permission.CAMERA" />');
add('<uses-permission android:name="android.permission.VIBRATE" />');
add('<uses-feature android:name="android.hardware.camera" android:required="false" />');
fs.writeFileSync(manifest, x);
console.log('AndroidManifest: اجازه‌ی دوربین اضافه شد');

const icon = path.join(__dirname, '..', 'www', 'icon-512.png');
const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const names = ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'];

/* تغییر اندازه با sharp (روی ران‌نر گیت‌هاب ImageMagick نیست) */
async function makeIcons() {
  const projRoot = path.join(__dirname, '..');
  try { require.resolve('sharp', { paths: [projRoot] }); }
  catch (e) { cp.execSync('npm i --no-save sharp', { cwd: projRoot, stdio: 'inherit' }); }
  const sharp = require(require.resolve('sharp', { paths: [projRoot] }));
  for (const [d, n] of Object.entries(sizes)) {
    const dir = path.join(res, `mipmap-${d}`);
    fs.mkdirSync(dir, { recursive: true });
    for (const name of names) {
      await sharp(icon).resize(n, n).png().toFile(path.join(dir, name));
    }
  }
  // آیکون‌های تطبیقی پیش‌فرض حذف شوند تا آیکون خودمان استفاده شود
  const any = path.join(res, 'mipmap-anydpi-v26');
  if (fs.existsSync(any)) fs.rmSync(any, { recursive: true, force: true });
  console.log('آیکون برنامه جایگزین شد');
}

if (fs.existsSync(icon)) {
  makeIcons().catch((e) => {
    /* اگر ساخت آیکون خطا داد، ساخت APK متوقف نشود؛ آیکون پیش‌فرض می‌ماند */
    console.warn('هشدار: ساخت آیکون ناموفق بود، آیکون پیش‌فرض می‌ماند:', e && e.message);
  });
} else {
  console.log('icon-512.png روی سایت نبود؛ آیکون پیش‌فرض می‌ماند');
}
