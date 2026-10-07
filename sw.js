/* Anapanasati service worker — ทำให้เปิดใช้งานได้แม้ออฟไลน์
   เมื่ออัปเดตเว็บ ให้เปลี่ยนเลข VERSION เพื่อให้ผู้ใช้ได้ไฟล์ใหม่ */
const VERSION = 'anapanasati-v1.0.2';
const CORE = ['./', './index.html', './manifest.webmanifest', './privacy.html', './icons/icon-192.png', './icons/icon-512.png', './icons/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // ไม่แคชโฆษณาและสคริปต์วัดผล
  if (/googlesyndication|doubleclick|google-analytics|googletagmanager|adservice/.test(url.hostname)) return;
  // หน้าเว็บ: ลองโหลดใหม่ก่อน ถ้าออฟไลน์ใช้ฉบับในแคช
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  // ไฟล์อื่น (ฟอนต์ ไอคอน ไฟล์เสียง): ใช้แคชก่อน แล้วอัปเดตเบื้องหลัง
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
