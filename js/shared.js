/*
 * Code shared by the page and the service worker (classic script, no modules).
 * Page:   <script src="js/shared.js"></script>   -> window.HafezShared
 * Worker: importScripts('js/shared.js')           -> self.HafezShared
 */
(function (g) {
  'use strict';

  /** Local calendar day as YYYY-MM-DD. */
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /** Same ghazal for everybody on the same day (FNV-1a hash of the day key). Returns 0-based index. */
  function dailyIndex(key, n) {
    var h = 2166136261;
    for (var i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h % n;
  }

  function minutesOf(time) {
    var p = String(time || '08:00').split(':');
    return (+p[0]) * 60 + (+p[1] || 0);
  }

  /** True when the daily reminder time has passed today and nothing was shown yet today. */
  function isDue(now, reminder, lastDay) {
    if (!reminder || !reminder.on) return false;
    var minutes = now.getHours() * 60 + now.getMinutes();
    return minutes >= minutesOf(reminder.time) && lastDay !== dayKey(now);
  }

  /** Title + options for the daily notification. */
  function notice(poem) {
    return {
      title: 'فال امروز حافظ',
      options: {
        body: poem.v[0] + (poem.v[1] ? '\n' + poem.v[1] : ''),
        icon: 'icons/icon-192.png',
        tag: 'daily-fal',
        dir: 'rtl',
        lang: 'fa',
        vibrate: [180, 80, 180],
        requireInteraction: true,
        data: { url: '#/daily' }
      }
    };
  }

  /* Tiny IndexedDB key-value store, readable from the service worker too. */
  function openDb() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open('hafez-fal', 1);
      req.onupgradeneeded = function () { req.result.createObjectStore('kv'); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function kvGet(key) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = db.transaction('kv').objectStore('kv').get(key);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function kvSet(key, value) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(value, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  g.HafezShared = { dayKey: dayKey, dailyIndex: dailyIndex, isDue: isDue, notice: notice, kvGet: kvGet, kvSet: kvSet };
})(typeof self !== 'undefined' ? self : this);
