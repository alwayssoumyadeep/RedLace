/* REDLACE shared behaviour: storage, header/footer, shoe cursor, loader + page curtain,
   search, toasts, product cards. Loaded on every page after data.js. */
(function () {
  'use strict';
  var RL = window.RL;
  var doc = document, root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  RL.reduceMotion = reduceMotion;

  /* ---------- storage ---------- */
  function read(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode */ } }

  var store = RL.store = {
    cart: function () { return read('rl_cart', []); },
    setCart: function (c) { write('rl_cart', c); emit(); },
    add: function (id, size, qty) {
      var c = store.cart();
      var line = c.find(function (l) { return l.id === id && l.size === size; });
      if (line) line.qty = Math.min(6, line.qty + (qty || 1)); else c.push({ id: id, size: size, qty: qty || 1 });
      store.setCart(c);
    },
    count: function () { return store.cart().reduce(function (n, l) { return n + l.qty; }, 0); },
    subtotal: function () {
      return store.cart().reduce(function (n, l) { var p = RL.byId(l.id); return n + (p ? p.price * l.qty : 0); }, 0);
    },
    wish: function () { return read('rl_wish', []); },
    toggleWish: function (id) {
      var w = store.wish(), i = w.indexOf(id);
      if (i > -1) w.splice(i, 1); else w.push(id);
      write('rl_wish', w); emit();
      return i === -1;
    },
    orders: function () { return read('rl_orders', []); },
    addOrder: function (o) { var all = store.orders(); all.unshift(o); write('rl_orders', all); },
    user: function () { return read('rl_user', null); },
    setUser: function (u) { write('rl_user', u); emit(); },
    promo: function () { return read('rl_promo', null); },
    setPromo: function (p) { write('rl_promo', p); emit(); },
  };
  function emit() { doc.dispatchEvent(new CustomEvent('rl:change')); }

  RL.totals = function () {
    var sub = store.subtotal();
    var promo = store.promo();
    var discount = promo === 'LACEUP10' ? Math.round(sub * 0.1) : 0;
    var delivery = sub === 0 || sub - discount >= 4999 ? 0 : 149;
    return { subtotal: sub, discount: discount, delivery: delivery, total: sub - discount + delivery, promo: promo };
  };

  /* Two example orders so the orders page has something to show before the first purchase. */
  if (!read('rl_seeded', false)) {
    var day = 86400000, now = Date.now();
    write('rl_orders', [
      { id: 'RL-48213', placed: now - 3 * day, status: 2, eta: now + 1 * day, total: 10999, pay: 'UPI',
        address: 'Flat 4B, Lakeview Residency, Indiranagar, Bengaluru 560038',
        items: [{ id: 'samba-og-scarlet', size: 9, qty: 1, price: 10999 }] },
      { id: 'RL-47102', placed: now - 24 * day, status: 4, eta: now - 20 * day, total: 15194, pay: 'Card',
        address: 'Flat 4B, Lakeview Residency, Indiranagar, Bengaluru 560038',
        items: [{ id: 'dunk-low-panda', size: 9, qty: 1, price: 9695 }, { id: 'old-skool-black-white', size: 9, qty: 1, price: 5499 }] },
    ].concat(read('rl_orders', [])));
    write('rl_seeded', true);
  }

  /* ---------- icons ---------- */
  var I = RL.icons = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.500 15.400 12 20 12 20Z"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.500" r="3.8"/><path d="M4.500 20c1.200-3.600 4-5.400 7.500-5.400s6.300 1.800 7.500 5.400"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8.500h14l-1 11.500H6L5 8.500Z"/><path d="M9 8.500V7a3 3 0 0 1 6 0v1.500"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.500 4.500 4.500L19 7.500"/></svg>',
    minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true" class="fill"><path d="m12 3.500 2.600 5.400 5.900.8-4.300 4.100 1 5.900L12 16.900l-5.200 2.800 1-5.900-4.300-4.100 5.900-.8L12 3.500Z"/></svg>',
    truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.500 6.500h11v10h-11zM13.500 10h4l3 3.200v3.300h-7"/><circle cx="7" cy="17.500" r="1.800"/><circle cx="17" cy="17.500" r="1.800"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 5.800v5.700c0 4.300 2.900 7.600 7 9.500 4.100-1.900 7-5.200 7-9.500V5.800L12 3Z"/><path d="m9 12 2.200 2.200L15.200 10"/></svg>',
    undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5 4 9l4 4"/><path d="M4 9h10a5.500 5.500 0 0 1 0 11H9"/></svg>',
  };

  /* ---------- header + footer ---------- */
  var page = doc.body.getAttribute('data-page') || '';
  if (page === 'shop' && /[?&]sort=new/.test(location.search)) page = 'new';
  function navLink(href, label, key) {
    return '<a class="nav__link" href="' + href + '"' + (page === key ? ' aria-current="page"' : '') + '>' + label + '</a>';
  }
  function renderHeader() {
    var host = doc.getElementById('hdr');
    if (!host) return;
    var user = store.user();
    host.innerHTML =
      '<a class="skip" href="#main">Skip to content</a>' +
      '<header class="nav" id="nav">' +
        '<a class="nav__logo" href="index.html" aria-label="Redlace home">RED<span>LACE</span></a>' +
        '<nav class="nav__links" aria-label="Main">' +
          navLink('shop.html', 'Shop', 'shop') +
          navLink('shop.html?sort=new', 'New drops', 'new') +
          navLink('orders.html', 'Your orders', 'orders') +
          navLink('contact.html', 'Contact', 'contact') +
        '</nav>' +
        '<div class="nav__tools">' +
          '<button class="nav__icon" type="button" data-open-search aria-label="Search">' + I.search + '</button>' +
          '<a class="nav__icon nav__icon--wide" href="login.html" aria-label="' + (user ? 'Account: ' + user.name : 'Sign in') + '">' + I.user + '</a>' +
          '<a class="nav__icon" href="wishlist.html" aria-label="Wishlist">' + I.heart + '<i class="nav__badge" data-wish-count hidden></i></a>' +
          '<a class="nav__icon" href="cart.html" aria-label="Bag">' + I.bag + '<i class="nav__badge" data-bag-count hidden></i></a>' +
          '<button class="nav__burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="menu"><i></i><i></i></button>' +
        '</div>' +
      '</header>' +
      '<div class="menu" id="menu" hidden>' +
        '<nav aria-label="Mobile">' +
          '<a href="shop.html">Shop</a><a href="shop.html?sort=new">New drops</a><a href="orders.html">Your orders</a>' +
          '<a href="wishlist.html">Wishlist</a><a href="contact.html">Contact</a><a href="login.html">' + (user ? 'Account' : 'Sign in') + '</a>' +
        '</nav>' +
      '</div>' +
      '<div class="search" id="search" hidden role="dialog" aria-modal="true" aria-label="Search sneakers">' +
        '<div class="search__bar wrap">' +
          '<form class="search__form" action="shop.html" method="get">' +
            I.search + '<input name="q" type="search" placeholder="Search by shoe, brand or colour" autocomplete="off" aria-label="Search">' +
          '</form>' +
          '<button class="nav__icon" type="button" data-close-search aria-label="Close search">' + I.close + '</button>' +
        '</div>' +
        '<div class="search__results wrap" id="searchResults"></div>' +
      '</div>';
    syncBadges();
  }

  function renderFooter() {
    var host = doc.getElementById('ftr');
    if (!host) return;
    host.innerHTML =
      '<footer class="foot">' +
        '<div class="wrap foot__top">' +
          '<div class="foot__news">' +
            '<h2 class="foot__h">Hear about drops a day early</h2>' +
            '<form class="foot__form" data-news novalidate>' +
              '<label class="sr" for="newsEmail">Email address</label>' +
              '<input id="newsEmail" type="email" placeholder="you@example.com" required>' +
              '<button class="btn btn--white" type="submit">Sign me up</button>' +
            '</form>' +
            '<p class="foot__note" data-news-note>One email a week. Unsubscribe whenever you like.</p>' +
          '</div>' +
          '<div class="foot__cols">' +
            '<div><h3>Shop</h3><a href="shop.html">All sneakers</a><a href="shop.html?sort=new">New drops</a><a href="shop.html?type=Low-top">Low-tops</a><a href="shop.html?type=High-top">High-tops</a><a href="shop.html?type=Runner">Runners</a></div>' +
            '<div><h3>Help</h3><a href="orders.html">Track an order</a><a href="contact.html#faq">Delivery and returns</a><a href="contact.html#faq">Size guide</a><a href="contact.html">Contact us</a></div>' +
            '<div><h3>Account</h3><a href="login.html">Sign in</a><a href="wishlist.html">Wishlist</a><a href="cart.html">Bag</a></div>' +
          '</div>' +
        '</div>' +
        '<div class="foot__word" aria-hidden="true">REDLACE</div>' +
        '<div class="wrap foot__base"><span>© 2026 Redlace Sneakers. Design prototype.</span><span>Every pair checked by hand in Bengaluru.</span></div>' +
      '</footer>';
  }

  function syncBadges() {
    var n = store.count(), w = store.wish().length;
    doc.querySelectorAll('[data-bag-count]').forEach(function (el) { el.textContent = n; el.hidden = !n; });
    doc.querySelectorAll('[data-wish-count]').forEach(function (el) { el.textContent = w; el.hidden = !w; });
    doc.querySelectorAll('[data-wish]').forEach(function (b) {
      var on = store.wish().indexOf(b.getAttribute('data-wish')) > -1;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  doc.addEventListener('rl:change', syncBadges);

  /* ---------- product card ---------- */
  RL.card = function (p) {
    var off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
    return '' +
      '<article class="card">' +
        '<a class="card__media" href="product.html?id=' + p.id + '" data-cursor="View" aria-label="' + RL.label(p) + ' ' + p.colorway + '">' +
          '<img class="card__img" src="' + RL.img(p) + '" alt="' + RL.label(p) + ' ' + p.colorway + ', side view" loading="lazy" width="800" height="571">' +
          '<img class="card__img card__img--alt" src="' + RL.img(p, 3) + '" alt="" loading="lazy" width="800" height="533">' +
          (p.isNew ? '<span class="card__tag">New</span>' : '') +
        '</a>' +
        '<button class="card__wish" type="button" data-wish="' + p.id + '" aria-pressed="false" aria-label="Save ' + p.name + ' ' + p.colorway + ' to wishlist">' + I.heart + '</button>' +
        '<div class="card__body">' +
          '<p class="card__brand">' + p.brand + '</p>' +
          '<h3 class="card__name"><a href="product.html?id=' + p.id + '">' + p.name + '</a></h3>' +
          '<p class="card__cw">' + p.colorway + '</p>' +
          '<p class="card__price"><b>' + RL.rupee(p.price) + '</b>' + (off ? ' <s>' + RL.rupee(p.mrp) + '</s> <em>' + off + '% off</em>' : '') + '</p>' +
        '</div>' +
      '</article>';
  };

  /* ---------- toast ---------- */
  var toastEl, toastTimer;
  RL.toast = function (msg, link) {
    if (!toastEl) {
      toastEl = doc.createElement('div');
      toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
      doc.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '<span>' + msg + '</span>' + (link ? '<a href="' + link.href + '">' + link.label + '</a>' : '');
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3200);
  };

  /* ---------- global clicks ---------- */
  doc.addEventListener('click', function (e) {
    var t = e.target.closest('[data-wish]');
    if (t) {
      e.preventDefault();
      var p = RL.byId(t.getAttribute('data-wish'));
      var added = store.toggleWish(p.id);
      RL.toast(added ? 'Saved to wishlist' : 'Removed from wishlist', added ? { href: 'wishlist.html', label: 'View wishlist' } : null);
      return;
    }
    if (e.target.closest('[data-open-search]')) return openSearch();
    if (e.target.closest('[data-close-search]')) return closeSearch();
    var burger = e.target.closest('.nav__burger');
    if (burger) {
      var menu = doc.getElementById('menu'), open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.hidden = !open; root.classList.toggle('menu-open', open);
    }
  });

  doc.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-news]');
    if (!f) return;
    e.preventDefault();
    var input = f.querySelector('input'), note = doc.querySelector('[data-news-note]');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value.trim())) {
      note.textContent = 'That email looks incomplete. Check it and sign up again.'; input.focus(); return;
    }
    note.textContent = 'Signed up. The next drop email goes out on Friday.'; input.value = '';
  });

  /* ---------- search ---------- */
  function openSearch() {
    var s = doc.getElementById('search');
    s.hidden = false; root.classList.add('search-open');
    var input = s.querySelector('input');
    input.value = ''; renderResults(''); setTimeout(function () { input.focus(); }, 30);
  }
  function closeSearch() {
    var s = doc.getElementById('search');
    if (!s || s.hidden) return;
    s.hidden = true; root.classList.remove('search-open');
    var b = doc.querySelector('[data-open-search]'); if (b) b.focus();
  }
  RL.search = function (q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return RL.products.slice();
    var words = q.split(/\s+/);
    return RL.products.filter(function (p) {
      var hay = (RL.label(p) + ' ' + p.colorway + ' ' + p.type).toLowerCase();
      return words.every(function (w) { return hay.indexOf(w) > -1; });
    });
  };
  function renderResults(q) {
    var host = doc.getElementById('searchResults');
    var list = q ? RL.search(q).slice(0, 6) : RL.products.filter(function (p) { return p.isNew; }).slice(0, 4);
    if (!list.length) {
      host.innerHTML = '<p class="search__empty">No sneakers match “' + q.replace(/[<>&]/g, '') + '”. Try a brand, like Nike or adidas.</p>';
      return;
    }
    host.innerHTML = '<p class="search__label">' + (q ? list.length + ' match' + (list.length > 1 ? 'es' : '') : 'New this week') + '</p>' +
      '<div class="search__list">' + list.map(function (p) {
        return '<a class="search__item" href="product.html?id=' + p.id + '"><span class="search__thumb"><img src="' + RL.img(p) + '" alt=""></span>' +
          '<span><b>' + RL.label(p) + '</b><small>' + p.colorway + '</small></span><span class="search__price">' + RL.rupee(p.price) + '</span></a>';
      }).join('') + '</div>';
  }
  doc.addEventListener('input', function (e) { if (e.target.closest('.search__form')) renderResults(e.target.value); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeSearch();
      var burger = doc.querySelector('.nav__burger[aria-expanded="true"]'); if (burger) burger.click();
    }
    if (e.key === '/' && !/input|textarea|select/i.test(e.target.tagName)) { e.preventDefault(); openSearch(); }
  });

  /* ---------- nav state ---------- */
  function navState() {
    var nav = doc.getElementById('nav');
    if (!nav) return;
    var last = -1;
    function tick() {
      var y = window.scrollY;
      if (y !== last) { nav.classList.toggle('is-stuck', y > 12); last = y; }
    }
    window.addEventListener('scroll', tick, { passive: true }); tick();
  }

  /* ---------- shoe cursor ---------- */
  function cursor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var shoe = doc.createElement('div'); shoe.className = 'cur'; shoe.setAttribute('aria-hidden', 'true');
    shoe.innerHTML = '<img src="assets/img/cursor-shoe.png" alt=""><span class="cur__label"></span>';
    var dot = doc.createElement('div'); dot.className = 'cur-dot'; dot.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(shoe); doc.body.appendChild(dot);
    root.classList.add('has-cursor');
    var label = shoe.querySelector('.cur__label');

    var mx = -100, my = -100, x = -100, y = -100, vx = 0, rot = 0, scale = 1, tScale = 1, tRot = 0, seen = false;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!seen) { seen = true; x = mx; y = my; shoe.classList.add('is-on'); dot.classList.add('is-on'); }
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    }, { passive: true });
    doc.addEventListener('mouseleave', function () { shoe.classList.remove('is-on'); dot.classList.remove('is-on'); seen = false; });
    window.addEventListener('mousedown', function () { root.classList.add('cur-down'); });
    window.addEventListener('mouseup', function () { root.classList.remove('cur-down'); });

    doc.addEventListener('mouseover', function (e) {
      var el = e.target.closest('a, button, [role="button"], input, select, textarea, label, summary, [data-cursor]');
      var text = el && el.closest('[data-cursor]');
      var typing = el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !/^(checkbox|radio|range|submit|button)$/.test(el.type || '');
      root.classList.toggle('cur-hover', !!el && !typing);
      root.classList.toggle('cur-type', !!typing);
      root.classList.toggle('cur-label', !!text);
      label.textContent = text ? text.getAttribute('data-cursor') : '';
      tScale = el && !typing ? 1.28 : 1; tRot = el && !typing ? -18 : 0;
    });

    (function loop() {
      var px = x;
      x += (mx - x) * 0.2; y += (my - y) * 0.2;
      vx += ((x - px) - vx) * 0.25;                       // smoothed horizontal speed
      var lean = Math.max(-26, Math.min(26, vx * 1.6));   // the shoe leans into the direction of travel
      rot += (tRot + lean - rot) * 0.18;
      scale += ((root.classList.contains('cur-down') ? 0.82 : tScale) - scale) * 0.2;
      shoe.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- loader + page curtain ---------- */
  var curtain;
  function buildCurtain() {
    if (curtain) return;
    curtain = doc.getElementById('curtain');
    if (!curtain) { curtain = doc.createElement('div'); curtain.id = 'curtain'; curtain.className = 'curtain'; doc.body.appendChild(curtain); }
    curtain.innerHTML =
      '<div class="curtain__in">' +
        '<div class="curtain__logo">RED<span>LACE</span></div>' +
        '<svg class="curtain__lace" viewBox="0 0 320 44" aria-hidden="true">' +
          '<path class="curtain__track" d="M4 34 44 10 84 34 124 10 164 34 204 10 244 34 284 10 316 30"/>' +
          '<path class="curtain__thread" pathLength="100" d="M4 34 44 10 84 34 124 10 164 34 204 10 244 34 284 10 316 30"/>' +
        '</svg>' +
        '<div class="curtain__count"><b data-count>0</b>%</div>' +
      '</div>';
  }
  /* RL.boot(urls): preload images behind the curtain, then lift it. Resolves once the page may animate in. */
  RL.boot = function (urls) {
    buildCurtain();
    var thread = curtain.querySelector('.curtain__thread'), count = curtain.querySelector('[data-count]');
    var full = !!(urls && urls.length);
    curtain.classList.toggle('curtain--full', full);
    return new Promise(function (resolve) {
      var done = 0, total = full ? urls.length : 1, shown = 0, finished = false, images = [];
      var t0 = performance.now(), minTime = full && !reduceMotion ? 1100 : 0;
      function paint() {
        var target = done / total * 100;
        shown += (target - shown) * 0.14;
        if (target - shown < 0.4) shown = target;
        thread.style.strokeDashoffset = 100 - shown;
        count.textContent = Math.round(shown);
        if (shown >= 100 && performance.now() - t0 >= minTime) return finish();
        requestAnimationFrame(paint);
      }
      function finish() {
        if (finished) return; finished = true;
        root.classList.add('is-ready');
        curtain.classList.add('is-up');
        resolve(images);
      }
      if (!full) { done = 1; shown = 100; requestAnimationFrame(finish); return; }
      urls.forEach(function (u, i) {
        var im = new Image(); images[i] = im;
        im.onload = im.onerror = function () { done++; };
        im.src = u;
      });
      setTimeout(function () { done = total; }, 9000);   // never hold the page hostage to a slow image
      var watch = setInterval(function () {               // rAF pauses in background tabs; timers still tick
        if (finished) return clearInterval(watch);
        if (done >= total && performance.now() - t0 >= minTime + 700) { shown = 100; count.textContent = '100'; thread.style.strokeDashoffset = 0; finish(); }
      }, 250);
      requestAnimationFrame(paint);
    });
  };

  function transitions() {
    doc.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank' || /^(mailto:|tel:|https?:)/.test(href)) return;
      var url = new URL(a.href, location.href);
      if (url.pathname === location.pathname && url.search === location.search) return;   // same page: plain hash jump
      if (reduceMotion) return;
      e.preventDefault();
      curtain.classList.remove('curtain--full', 'is-up');
      curtain.classList.add('is-down');
      setTimeout(function () { location.href = a.href; }, 420);
    });
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) { curtain.classList.remove('is-down'); curtain.classList.add('is-up'); }
    });
  }

  /* ---------- smooth scroll (optional: only if the Lenis script loaded) ---------- */
  function smooth() {
    if (reduceMotion || !window.Lenis) return;
    try {
      var lenis = RL.lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1 });
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    } catch (e) { /* native scrolling is fine */ }
  }

  /* ---------- line reveals for headings ---------- */
  function reveals() {
    var els = doc.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }
  RL.reveals = reveals;

  /* ---------- init ---------- */
  renderHeader();
  renderFooter();
  buildCurtain();
  navState();
  cursor();
  transitions();
  smooth();
  /* Pages that need a real preload call RL.boot themselves (see pages.js) and set data-boot="manual". */
  if (doc.body.getAttribute('data-boot') !== 'manual') {
    if (doc.readyState === 'loading') window.addEventListener('DOMContentLoaded', function () { RL.boot().then(reveals); });
    else RL.boot().then(reveals);
  }
})();
