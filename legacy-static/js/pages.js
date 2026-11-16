/* REDLACE page logic. One function per page, chosen by <body data-page>. */
(function () {
  'use strict';
  var RL = window.RL, store = RL.store, I = RL.icons;
  var doc = document, root = doc.documentElement;
  var page = doc.body.getAttribute('data-page');
  var qs = new URLSearchParams(location.search);

  function $(s, el) { return (el || doc).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad(n, len) { n = String(n); while (n.length < (len || 2)) n = '0' + n; return n; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function date(ts) { return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function full(p) { return RL.label(p) + ' ' + p.colorway; }
  function emptyState(title, text, href, label) {
    return '<div class="empty"><h2 class="d h-md">' + title + '</h2><p>' + text + '</p><a class="btn btn--ink" href="' + href + '">' + label + '</a></div>';
  }

  /* =============================== HOME =============================== */
  function home() {
    var ANGLES = [];
    for (var a = 0; a < 360; a += 10) if (a !== 70 && a !== 100 && a !== 270) ANGLES.push(a);   // the 33 photographed angles we use
    var urls = ANGLES.map(function (_, i) { return 'assets/hero/' + pad(i + 1) + '.webp'; });
    var nearest = [];
    for (var d = 0; d < 360; d++) {
      var best = 0, bd = 999;
      ANGLES.forEach(function (fa, i) { var diff = Math.abs(((d - fa + 540) % 360) - 180); if (diff < bd) { bd = diff; best = i; } });
      nearest[d] = best;
    }

    var stage = $('#stage'), pin = $('.stage__pin', stage), canvas = $('#turn'), ctx = canvas.getContext('2d');
    var hero = $('.stage__shoe', stage), tilt = $('#tilt'), shadow = $('.stage__shadow', stage), degEl = $('#deg'), lace = $('#laceFill'), notes = $$('.note', stage);
    var images = [], shown = -1;

    function draw(i) {
      var im = images[i];
      if (i === shown || !im || !im.complete || !im.naturalWidth) return;
      shown = i;
      ctx.clearRect(0, 0, 1120, 600);
      ctx.drawImage(im, 40, 190, 1120, 600, 0, 0, 1120, 600);   // crop the 1200x800 frame to the shoe
    }
    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

    var mx = 0, my = 0, pmx = 0, pmy = 0, lastKey = '';
    window.addEventListener('mousemove', function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });

    function update() {
      var r = stage.getBoundingClientRect();
      var p = clamp(-r.top / (r.height - innerHeight), 0, 1);
      pmx += (mx - pmx) * 0.08; pmy += (my - pmy) * 0.08;
      var key = p.toFixed(4) + '|' + pmx.toFixed(3) + '|' + pmy.toFixed(3) + '|' + shown;
      if (key !== lastKey) {
        lastKey = key;
        var out = ease(clamp(p / 0.15, 0, 1));              // hero copy leaves, shoe levels out
        var wipe = ease(clamp((p - 0.07) / 0.15, 0, 1));    // white floods in from behind the shoe
        var tour = clamp((p - 0.17) / 0.05, 0, 1);
        var t = clamp((p - 0.22) / 0.72, 0, 1);             // one full turn
        var angle = t * 360;

        pin.style.setProperty('--out', out.toFixed(4));
        pin.style.setProperty('--wipe', (wipe * 150).toFixed(2));
        pin.style.setProperty('--tour', tour.toFixed(3));
        draw(nearest[Math.round(angle) % 360]);

        var free = 1 - out;
        tilt.style.transform = 'translate3d(' + ((-pmx * 36 - hero.offsetWidth * 0.045) * free).toFixed(1) + 'px,' + (-pmy * 24 * free).toFixed(1) + 'px,0) rotate(' +
          (-13 * free).toFixed(2) + 'deg) scale(' + (1 - 0.1 * out).toFixed(4) + ')';
        var side = Math.abs(Math.cos(angle * Math.PI / 180));   // 1 = side on, 0 = facing us
        shadow.style.setProperty('--sx', ((0.42 + 0.58 * side) * (1 - 0.1 * out)).toFixed(3));
        shadow.style.setProperty('--so', (0.35 + 0.3 * out).toFixed(2));

        degEl.textContent = pad(Math.round(angle), 3);
        lace.style.strokeDashoffset = (100 - t * 100).toFixed(2);
        notes.forEach(function (n) {
          var on = tour === 1 && angle >= +n.getAttribute('data-from') && angle < +n.getAttribute('data-to');
          if (n.classList.contains('is-on') !== on) n.classList.toggle('is-on', on);
        });
        var red = p < 0.16;
        if ((root.getAttribute('data-nav') === 'red') !== red) { if (red) root.setAttribute('data-nav', 'red'); else root.removeAttribute('data-nav'); }
      }
      requestAnimationFrame(update);
    }

    /* fresh rail */
    var rail = $('#rail');
    var fresh = RL.products.filter(function (p) { return p.isNew; }).concat(RL.products.filter(function (p) { return !p.isNew; })).slice(0, 9);
    rail.innerHTML = fresh.map(RL.card).join('');
    dragScroll(rail);

    /* info band slides only while you scroll */
    var band = $('#band'), bandW = 0;
    function bandMove() {
      if (!bandW) bandW = band.scrollWidth / 3;
      band.style.transform = 'translate3d(' + (-(window.scrollY * 0.45) % bandW).toFixed(1) + 'px,0,0)';
    }
    window.addEventListener('scroll', bandMove, { passive: true });
    window.addEventListener('resize', function () { bandW = 0; bandMove(); });

    $$('[data-type-count]').forEach(function (el) {
      var n = RL.products.filter(function (p) { return p.type === el.getAttribute('data-type-count'); }).length;
      el.textContent = n + (n === 1 ? ' pair' : ' pairs');
    });

    RL.boot(urls).then(function (loaded) {
      images = loaded;
      draw(0); bandMove();
      requestAnimationFrame(update);
      RL.reveals();
    });
  }

  function dragScroll(el) {
    var down = false, startX = 0, startLeft = 0, moved = false;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) { moved = true; el.classList.add('is-drag'); }
      if (moved) el.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      setTimeout(function () { el.classList.remove('is-drag'); }, 0);
    });
    el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    el.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  /* =============================== SHOP =============================== */
  function shop() {
    var host = $('#shop');
    var state = { brand: qs.get('brand') || 'All', type: qs.get('type') || 'All', sort: qs.get('sort') || 'featured', q: qs.get('q') || '' };
    var brands = ['All'].concat(RL.products.map(function (p) { return p.brand; }).filter(function (b, i, arr) { return arr.indexOf(b) === i; }));
    var types = ['All', 'Low-top', 'High-top', 'Runner'];

    function title() {
      if (state.q) return 'Results for “' + esc(state.q) + '”';
      if (state.sort === 'new' && state.brand === 'All' && state.type === 'All') return 'New drops';
      if (state.type !== 'All') return state.type + 's';
      if (state.brand !== 'All') return esc(state.brand);
      return 'All sneakers';
    }
    function list() {
      var out = RL.search(state.q).filter(function (p) {
        return (state.brand === 'All' || p.brand === state.brand) && (state.type === 'All' || p.type === state.type);
      });
      if (state.sort === 'low') out.sort(function (a, b) { return a.price - b.price; });
      else if (state.sort === 'high') out.sort(function (a, b) { return b.price - a.price; });
      else if (state.sort === 'new') out.sort(function (a, b) { return (b.isNew - a.isNew) || (b.year - a.year); });
      return out;
    }
    function render() {
      var items = list();
      host.innerHTML =
        '<div class="page-head"><h1 class="d h-xl">' + title() + '</h1><p>' + items.length + (items.length === 1 ? ' pair' : ' pairs') + '</p></div>' +
        '<div class="filters">' +
          '<div class="chips" role="group" aria-label="Brand">' + brands.map(function (b) {
            return '<button class="chip" type="button" data-brand="' + esc(b) + '" aria-pressed="' + (state.brand === b) + '">' + esc(b) + '</button>';
          }).join('') + '</div>' +
          '<label class="select"><span class="sr">Shape</span><select data-type>' + types.map(function (t) {
            return '<option value="' + t + '"' + (state.type === t ? ' selected' : '') + '>' + (t === 'All' ? 'All shapes' : t + 's') + '</option>';
          }).join('') + '</select></label>' +
          '<label class="select"><span class="sr">Sort</span><select data-sort>' +
            [['featured', 'Sort: Featured'], ['new', 'Sort: Newest'], ['low', 'Sort: Price, low to high'], ['high', 'Sort: Price, high to low']].map(function (o) {
              return '<option value="' + o[0] + '"' + (state.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
            }).join('') + '</select></label>' +
        '</div>' +
        (items.length
          ? '<div class="grid">' + items.map(RL.card).join('') + '</div>'
          : emptyState('Nothing matches', 'No sneakers fit those filters. Clear them to see all ' + RL.products.length + ' pairs.', 'shop.html', 'Clear filters'));
      doc.dispatchEvent(new CustomEvent('rl:change'));
      var u = new URLSearchParams();
      if (state.q) u.set('q', state.q);
      if (state.brand !== 'All') u.set('brand', state.brand);
      if (state.type !== 'All') u.set('type', state.type);
      if (state.sort !== 'featured') u.set('sort', state.sort);
      history.replaceState(null, '', 'shop.html' + (u.toString() ? '?' + u : ''));
      doc.title = title().replace(/&[^;]+;/g, '"') + ' — Redlace';
    }
    host.addEventListener('click', function (e) {
      var c = e.target.closest('[data-brand]');
      if (c) { state.brand = c.getAttribute('data-brand'); render(); }
    });
    host.addEventListener('change', function (e) {
      if (e.target.matches('[data-type]')) { state.type = e.target.value; render(); }
      if (e.target.matches('[data-sort]')) { state.sort = e.target.value; render(); }
    });
    render();
  }

  /* ============================== PRODUCT ============================= */
  function product() {
    var host = $('#product'), p = RL.byId(qs.get('id'));
    if (!p) {
      host.innerHTML = emptyState('That shoe has walked off', 'The link may be old, or the pair has sold through. Every pair we have right now is in the shop.', 'shop.html', 'Go to the shop');
      return;
    }
    doc.title = full(p) + ' — Redlace';
    var off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
    var gone = RL.soldOut(p);
    var thumbs = [1, 3, 5, 10, 14];
    var related = RL.products.filter(function (o) { return o.id !== p.id && (o.brand === p.brand || o.type === p.type); }).slice(0, 4);

    host.innerHTML =
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="shop.html">Shop</a><span>/</span><a href="shop.html?brand=' + encodeURIComponent(p.brand) + '">' + p.brand + '</a><span>/</span><span>' + p.name + '</span></nav>' +
      '<div class="pdp">' +
        '<div class="viewer" id="viewer">' +
          '<div class="viewer__stage" id="spinStage" tabindex="0" role="slider" aria-label="Turn the shoe" aria-valuemin="0" aria-valuemax="340" aria-valuenow="0" aria-valuetext="0 degrees" data-cursor="Drag">' +
            '<img id="spin" src="' + RL.img(p, 1) + '" alt="' + full(p) + '" width="800" height="533">' +
            '<span class="viewer__deg" aria-hidden="true"><span id="spinDeg">0</span>°</span>' +
            '<span class="viewer__hint">' + I.arrow + 'Drag to spin</span>' +
          '</div>' +
          '<div class="viewer__thumbs">' + thumbs.map(function (n, i) {
            return '<button type="button" data-frame="' + n + '" aria-pressed="' + (i === 0) + '" aria-label="View ' + (i + 1) + ' of 5"><img src="' + RL.img(p, n) + '" alt="" loading="lazy"></button>';
          }).join('') + '</div>' +
        '</div>' +
        '<div class="info">' +
          '<p class="info__brand">' + p.brand + '</p>' +
          '<h1 class="d">' + p.name + '</h1>' +
          '<p class="info__cw">' + p.colorway + '</p>' +
          '<p class="info__rate">' + I.star + '<b>' + p.rating.toFixed(1) + '</b> from ' + p.reviews.toLocaleString('en-IN') + ' reviews</p>' +
          '<p class="info__price"><b>' + RL.rupee(p.price) + '</b>' + (off ? '<s>' + RL.rupee(p.mrp) + '</s><em>' + off + '% off</em>' : '') + '</p>' +
          '<p class="info__tax">Price includes all taxes</p>' +
          '<p class="info__blurb">' + p.blurb + '</p>' +
          '<form id="buy" novalidate>' +
            '<fieldset class="sizes"><div class="sizes__head"><legend>Size (UK)</legend><a class="link" href="contact.html#faq">Size guide</a></div>' +
              '<div class="sizes__grid">' + RL.SIZES.map(function (s) {
                var out = gone.indexOf(s) > -1;
                return '<label class="size"><input type="radio" name="size" value="' + s + '"' + (out ? ' disabled' : '') + '><span>' + s + (out ? '<span class="sr"> sold out</span>' : '') + '</span></label>';
              }).join('') + '</div>' +
              '<p class="sizes__err" id="sizeErr" role="alert"></p>' +
            '</fieldset>' +
            '<div class="info__cta">' +
              '<button class="btn btn--red" type="submit">Add to bag</button>' +
              '<button class="wish-btn" type="button" data-wish="' + p.id + '" aria-pressed="false" aria-label="Save to wishlist">' + I.heart + '</button>' +
            '</div>' +
          '</form>' +
          '<ul class="perks">' +
            '<li>' + I.truck + '<span>Delivered in 2 to 4 days' + (p.price >= 4999 ? ', free' : '') + '</span></li>' +
            '<li>' + I.undo + '<span>Return unworn within 7 days</span></li>' +
            '<li>' + I.shield + '<span>Checked by hand before it ships</span></li>' +
          '</ul>' +
          '<div class="acc">' +
            '<details open><summary>What it is made of</summary><ul class="acc__body">' + p.details.map(function (d) { return '<li>' + d + '</li>'; }).join('') + '</ul></details>' +
            '<details><summary>Size and fit</summary><div class="acc__body"><p>Sizes are UK. Most people take their usual size in this shoe. If you are between sizes or have wide feet, go half a size up and message us; we will find the closest pair.</p></div></details>' +
            '<details><summary>Delivery and returns</summary><div class="acc__body"><p>Orders placed before 2pm ship the same day and arrive in 2 to 4 days. Delivery is free over ₹4,999 and ₹149 below that. Unworn pairs can come back within 7 days, and we pay for the pickup.</p></div></details>' +
          '</div>' +
        '</div>' +
      '</div>' +
      (related.length ? '<section class="sec" style="padding-bottom:0" aria-labelledby="alsoH"><div class="sec-head"><h2 class="d h-lg" id="alsoH" data-reveal><span>Goes well next to it</span></h2></div><div class="grid">' + related.map(RL.card).join('') + '</div></section>' : '');
    doc.dispatchEvent(new CustomEvent('rl:change'));

    /* drag-to-spin: 18 studio photos, one every 20 degrees */
    var N = RL.SPIN_FRAMES, frame = 1, stageEl = $('#spinStage'), img = $('#spin'), degEl = $('#spinDeg'), viewer = $('#viewer');
    var cache = [];
    for (var i = 1; i <= N; i++) { var im = new Image(); im.src = RL.img(p, i); cache[i] = im; }
    function show(n) {
      frame = ((n - 1) % N + N) % N + 1;
      img.src = cache[frame].src;
      var deg = (frame - 1) * (360 / N);
      degEl.textContent = deg;
      stageEl.setAttribute('aria-valuenow', deg); stageEl.setAttribute('aria-valuetext', deg + ' degrees');
      $$('.viewer__thumbs button', viewer).forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-frame') === frame ? 'true' : 'false'); });
    }
    var dragging = false, sx = 0, sf = 1;
    stageEl.addEventListener('pointerdown', function (e) {
      dragging = true; sx = e.clientX; sf = frame;
      try { stageEl.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    });
    stageEl.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var step = stageEl.clientWidth / (N * 1.1);
      var moved = Math.round((sx - e.clientX) / step);
      if (moved) viewer.classList.add('is-used');
      show(sf + moved);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) { stageEl.addEventListener(ev, function () { dragging = false; }); });
    stageEl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(frame - 1); viewer.classList.add('is-used'); e.preventDefault(); }
      if (e.key === 'ArrowRight') { show(frame + 1); viewer.classList.add('is-used'); e.preventDefault(); }
    });
    viewer.addEventListener('click', function (e) {
      var b = e.target.closest('[data-frame]');
      if (b) { show(+b.getAttribute('data-frame')); viewer.classList.add('is-used'); }
    });

    $('#buy').addEventListener('change', function () { $('#sizeErr').textContent = ''; });
    $('#buy').addEventListener('submit', function (e) {
      e.preventDefault();
      var picked = $('input[name="size"]:checked', e.target);
      if (!picked) { $('#sizeErr').textContent = 'Choose a size, then add it to your bag.'; return; }
      store.add(p.id, +picked.value, 1);
      RL.toast('Added to bag: ' + p.name + ', UK ' + picked.value, { href: 'cart.html', label: 'View bag' });
    });
  }

  /* =============================== CART =============================== */
  function summaryRows(t, extra) {
    return '<dl>' +
      '<div><dt>Subtotal</dt><dd>' + RL.rupee(t.subtotal) + '</dd></div>' +
      (t.discount ? '<div class="sum__save"><dt>Code ' + esc(t.promo) + '</dt><dd>−' + RL.rupee(t.discount) + '</dd></div>' : '') +
      '<div><dt>Delivery</dt><dd>' + (t.delivery + (extra || 0) ? RL.rupee(t.delivery + (extra || 0)) : 'Free') + '</dd></div>' +
      '<div class="sum__total"><dt>Total</dt><dd>' + RL.rupee(t.total + (extra || 0)) + '</dd></div>' +
    '</dl>';
  }

  function cart() {
    var host = $('#cart'), promoMsg = '';
    function render() {
      var lines = store.cart().filter(function (l) { return RL.byId(l.id); });
      if (!lines.length) {
        host.innerHTML = '<div class="page-head"><h1 class="d h-xl">Your bag</h1></div>' +
          emptyState('Nothing in here yet', 'Pick a pair and a size, and it will wait for you here.', 'shop.html', 'Find a pair');
        return;
      }
      var t = RL.totals(), n = store.count();
      host.innerHTML =
        '<div class="page-head"><h1 class="d h-xl">Your bag</h1><p>' + n + (n === 1 ? ' pair' : ' pairs') + '</p></div>' +
        '<div class="two">' +
          '<div>' + lines.map(function (l, i) {
            var p = RL.byId(l.id);
            return '<div class="line">' +
              '<a class="line__img" href="product.html?id=' + p.id + '"><img src="' + RL.img(p) + '" alt="' + full(p) + '"></a>' +
              '<div><a class="line__name" href="product.html?id=' + p.id + '">' + RL.label(p) + '</a>' +
                '<p class="line__meta">' + p.colorway + ', UK ' + l.size + '</p>' +
                '<div class="line__tools">' +
                  '<div class="qty"><button type="button" data-step="-1" data-i="' + i + '" aria-label="One fewer">' + I.minus + '</button><output aria-label="Quantity">' + l.qty + '</output><button type="button" data-step="1" data-i="' + i + '" aria-label="One more"' + (l.qty >= 6 ? ' disabled' : '') + '>' + I.plus + '</button></div>' +
                  '<button class="line__rm" type="button" data-rm="' + i + '">Remove</button>' +
                '</div></div>' +
              '<p class="line__price">' + RL.rupee(p.price * l.qty) + '</p>' +
            '</div>';
          }).join('') + '</div>' +
          '<aside class="sum" aria-label="Order summary"><h2>Summary</h2>' + summaryRows(t) +
            '<form class="promo" id="promo"><label class="sr" for="code">Promo code</label><input id="code" placeholder="Promo code" value="' + esc(t.promo || '') + '" autocomplete="off"><button class="btn btn--line" type="submit">Apply</button></form>' +
            '<p class="promo__msg" role="status">' + (promoMsg || (t.promo ? '10% off applied.' : 'First order? Try LACEUP10.')) + '</p>' +
            '<a class="btn btn--red btn--block" href="checkout.html">Go to checkout</a>' +
            '<p class="sum__note">' + (t.delivery ? 'Add ' + RL.rupee(4999 - (t.subtotal - t.discount)) + ' more for free delivery.' : 'Free delivery on this order.') + '</p>' +
          '</aside>' +
        '</div>';
    }
    host.addEventListener('click', function (e) {
      var s = e.target.closest('[data-step]'), r = e.target.closest('[data-rm]'), c = store.cart();
      if (s) {
        var l = c[+s.getAttribute('data-i')]; l.qty += +s.getAttribute('data-step');
        if (l.qty < 1) c.splice(+s.getAttribute('data-i'), 1);
        store.setCart(c); render();
      } else if (r) {
        var gone = c.splice(+r.getAttribute('data-rm'), 1)[0];
        store.setCart(c); render();
        RL.toast('Removed ' + RL.byId(gone.id).name + ' from your bag');
      }
    });
    host.addEventListener('submit', function (e) {
      if (e.target.id !== 'promo') return;
      e.preventDefault();
      var code = $('#code').value.trim().toUpperCase();
      if (!code) { store.setPromo(null); promoMsg = 'Code removed.'; }
      else if (code === 'LACEUP10') { store.setPromo(code); promoMsg = '10% off applied.'; }
      else { promoMsg = '“' + esc(code) + '” is not a code we recognise. Check the spelling.'; }
      render(); promoMsg = '';
    });
    render();
  }

  /* ============================= CHECKOUT ============================= */
  function checkout() {
    var host = $('#checkout');
    var lines = store.cart().filter(function (l) { return RL.byId(l.id); });
    if (!lines.length) {
      host.innerHTML = '<div class="page-head"><h1 class="d h-xl">Checkout</h1></div>' +
        emptyState('Your bag is empty', 'Add a pair to your bag before checking out.', 'shop.html', 'Find a pair');
      return;
    }
    var user = store.user() || {};
    function field(name, label, attrs, err, val) {
      return '<label class="field" data-f="' + name + '"><span>' + label + '</span><input name="' + name + '" ' + attrs + ' value="' + esc(val || '') + '"><small>' + err + '</small></label>';
    }
    host.innerHTML =
      '<div class="page-head"><h1 class="d h-xl">Checkout</h1></div>' +
      '<p class="demo-note">This is a design prototype. Placing an order charges nothing, and payment details are never saved or sent anywhere.</p>' +
      '<div class="two">' +
        '<form id="co" class="form" novalidate>' +
          '<fieldset class="step"><legend><span class="step__n">1</span>Where should we send it?</legend><div class="form">' +
            '<div class="form__row">' + field('name', 'Full name', 'autocomplete="name" required', 'Enter the name for the delivery label.', user.name) +
              field('phone', 'Mobile number', 'type="tel" inputmode="numeric" autocomplete="tel" maxlength="10" required', 'Enter a 10-digit mobile number.') + '</div>' +
            field('address', 'Flat, building and street', 'autocomplete="street-address" required', 'Enter the address the courier should come to.') +
            '<div class="form__row">' + field('city', 'City', 'autocomplete="address-level2" required', 'Enter your city.') +
              field('pin', 'PIN code', 'inputmode="numeric" autocomplete="postal-code" maxlength="6" required', 'Enter a 6-digit PIN code.') + '</div>' +
          '</div></fieldset>' +
          '<fieldset class="step"><legend><span class="step__n">2</span>How fast?</legend><div class="opts">' +
            '<label class="opt"><input type="radio" name="speed" value="standard" checked><span><b>Standard</b><small>Arrives in 2 to 4 days</small></span><span class="opt__end" id="stdPrice"></span></label>' +
            '<label class="opt"><input type="radio" name="speed" value="express"><span><b>Express</b><small>Arrives tomorrow in metro cities</small></span><span class="opt__end">₹299</span></label>' +
          '</div></fieldset>' +
          '<fieldset class="step"><legend><span class="step__n">3</span>How will you pay?</legend><div class="opts">' +
            '<label class="opt"><input type="radio" name="pay" value="UPI" checked><span><b>UPI</b><small>Google Pay, PhonePe, Paytm or any UPI app</small></span></label>' +
            '<label class="opt"><input type="radio" name="pay" value="Card"><span><b>Credit or debit card</b><small>Visa, Mastercard, RuPay</small></span></label>' +
            '<label class="opt"><input type="radio" name="pay" value="Net banking"><span><b>Net banking</b><small>All major Indian banks</small></span></label>' +
            '<label class="opt"><input type="radio" name="pay" value="Cash on delivery"><span><b>Cash on delivery</b><small>Pay the courier in cash or by UPI</small></span></label>' +
          '</div>' +
          '<div class="pay-extra form" data-pay="UPI">' + field('upi', 'UPI ID', 'placeholder="name@bank" autocomplete="off"', 'Enter a UPI ID like name@bank.') + '</div>' +
          '<div class="pay-extra form" data-pay="Card" hidden>' + field('card', 'Card number', 'inputmode="numeric" autocomplete="off" maxlength="19" placeholder="0000 0000 0000 0000"', 'Enter the 16-digit card number.') +
            '<div class="form__row">' + field('exp', 'Expiry', 'placeholder="MM/YY" maxlength="5" autocomplete="off"', 'Enter the expiry as MM/YY.') + field('cvv', 'CVV', 'type="password" inputmode="numeric" maxlength="4" autocomplete="off"', 'Enter the 3 or 4 digits on the back.') + '</div></div>' +
          '<div class="pay-extra form" data-pay="Net banking" hidden><label class="field" data-f="bank"><span>Your bank</span><select name="bank"><option value="">Choose a bank</option><option>State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Axis Bank</option><option>Kotak Mahindra Bank</option></select><small>Choose your bank.</small></label></div>' +
          '</fieldset>' +
        '</form>' +
        '<aside class="sum" aria-label="Order summary"><h2>Your order</h2>' +
          '<div class="mini">' + lines.map(function (l) {
            var p = RL.byId(l.id);
            return '<div class="mini__row"><span class="mini__img"><img src="' + RL.img(p) + '" alt=""></span><span><b>' + RL.label(p) + '</b><small>UK ' + l.size + ', qty ' + l.qty + '</small></span><span>' + RL.rupee(p.price * l.qty) + '</span></div>';
          }).join('') + '</div>' +
          '<div id="coSum"></div>' +
          '<button class="btn btn--red btn--block" type="submit" form="co">Place order</button>' +
          '<p class="sum__note">You can cancel free of charge until it ships.</p>' +
        '</aside>' +
      '</div>';

    var form = $('#co');
    function extra() { return form.speed.value === 'express' ? 299 - RL.totals().delivery : 0; }
    function sums() {
      var t = RL.totals();
      $('#stdPrice').textContent = t.delivery ? RL.rupee(t.delivery) : 'Free';
      $('#coSum').innerHTML = summaryRows(t, extra());
    }
    form.addEventListener('change', function (e) {
      if (e.target.name === 'pay') $$('.pay-extra', form).forEach(function (b) { b.hidden = b.getAttribute('data-pay') !== e.target.value; });
      if (e.target.name === 'speed') sums();
    });
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field'); if (f) f.classList.remove('is-bad');
      if (e.target.name === 'card') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ');
      if (e.target.name === 'exp') e.target.value = e.target.value.replace(/[^\d]/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');
      if (e.target.name === 'phone' || e.target.name === 'pin' || e.target.name === 'cvv') e.target.value = e.target.value.replace(/\D/g, '');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { return (form[n].value || '').trim(); };
      var pay = form.pay.value, bad = [];
      function check(name, ok) { var f = $('[data-f="' + name + '"]', form); f.classList.toggle('is-bad', !ok); if (!ok) bad.push(f); }
      check('name', v('name').length > 1);
      check('phone', /^\d{10}$/.test(v('phone')));
      check('address', v('address').length > 5);
      check('city', v('city').length > 1);
      check('pin', /^\d{6}$/.test(v('pin')));
      if (pay === 'UPI') check('upi', /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(v('upi')));
      if (pay === 'Card') { check('card', v('card').replace(/\s/g, '').length === 16); check('exp', /^(0[1-9]|1[0-2])\/\d{2}$/.test(v('exp'))); check('cvv', /^\d{3,4}$/.test(v('cvv'))); }
      if (pay === 'Net banking') check('bank', !!v('bank'));
      if (bad.length) { $('input, select', bad[0]).focus(); bad[0].scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }

      var t = RL.totals(), express = form.speed.value === 'express';
      var id = 'RL-' + (10000 + Math.floor(Math.random() * 89999));
      store.addOrder({
        id: id, placed: Date.now(), status: 0, eta: Date.now() + (express ? 1 : 3) * 86400000, total: t.total + extra(), pay: pay,
        address: v('address') + ', ' + v('city') + ' ' + v('pin'),
        items: lines.map(function (l) { return { id: l.id, size: l.size, qty: l.qty, price: RL.byId(l.id).price }; }),
      });
      store.setCart([]); store.setPromo(null);
      location.href = 'orders.html?placed=' + id;
    });
    sums();
  }

  /* ============================== ORDERS ============================== */
  function orders() {
    var host = $('#orders'), all = store.orders(), placed = qs.get('placed');
    var STEPS = ['Order placed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered'];
    var html = '<div class="page-head"><h1 class="d h-xl">Your orders</h1>' + (all.length ? '<p>' + all.length + (all.length === 1 ? ' order' : ' orders') + '</p>' : '') + '</div>';
    var just = placed && all.find(function (o) { return o.id === placed; });
    if (just) {
      html += '<div class="placed" role="status"><div><h2 class="d">Order placed</h2><p>' + esc(just.id) + ' is confirmed. It should reach you by ' + date(just.eta) + '.</p></div><a class="btn btn--white" href="shop.html">Keep shopping</a></div>';
    }
    if (!all.length) {
      html += emptyState('No orders yet', 'When you buy a pair, you can follow it here from our shelf to your door.', 'shop.html', 'Find a pair');
    } else {
      html += all.map(function (o) {
        var done = o.status >= 4;
        return '<article class="order" data-order="' + esc(o.id) + '">' +
          '<div class="order__head"><h2 class="order__id">' + esc(o.id) + '</h2>' +
            '<p class="order__meta"><span>Placed <b>' + date(o.placed) + '</b></span><span>' + (done ? 'Delivered' : 'Arriving by') + ' <b>' + date(o.eta) + '</b></span><span>Paid by <b>' + esc(o.pay) + '</b></span><span>Total <b>' + RL.rupee(o.total) + '</b></span></p></div>' +
          '<ol class="track" data-p="' + (o.status / 4) + '" aria-label="Delivery progress: ' + STEPS[o.status] + '">' + STEPS.map(function (s, i) {
            return '<li class="' + (i <= o.status ? 'is-done' : '') + '"' + (i === o.status ? ' aria-current="step"' : '') + '>' + s + '</li>';
          }).join('') + '</ol>' +
          '<div class="order__items">' + o.items.map(function (it) {
            var p = RL.byId(it.id); if (!p) return '';
            return '<a class="order__item" href="product.html?id=' + p.id + '"><span class="line__img"><img src="' + RL.img(p) + '" alt="' + full(p) + '" loading="lazy"></span><span><b>' + RL.label(p) + '</b><small>' + p.colorway + ', UK ' + it.size + ', qty ' + it.qty + '</small></span></a>';
          }).join('') + '</div>' +
          '<div class="order__foot"><button class="btn btn--ink" type="button" data-again="' + esc(o.id) + '">Buy again</button><a class="btn btn--line" href="contact.html?order=' + encodeURIComponent(o.id) + '">Get help with this order</a></div>' +
        '</article>';
      }).join('');
    }
    host.innerHTML = html;
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      $$('.track', host).forEach(function (t) { t.style.setProperty('--p', t.getAttribute('data-p')); });
    }); });
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-again]'); if (!b) return;
      var o = all.find(function (x) { return x.id === b.getAttribute('data-again'); });
      o.items.forEach(function (it) { if (RL.byId(it.id)) store.add(it.id, it.size, it.qty); });
      RL.toast('Added to bag', { href: 'cart.html', label: 'View bag' });
    });
  }

  /* ============================== CONTACT ============================= */
  function contact() {
    var form = $('#contactForm');
    if (qs.get('order')) { form.order.value = qs.get('order'); form.topic.value = 'An order'; }
    var u = store.user(); if (u) { form.name.value = u.name || ''; form.email.value = u.email || ''; }
    form.addEventListener('input', function (e) { var f = e.target.closest('.field'); if (f) f.classList.remove('is-bad'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = [];
      function check(name, ok) { var f = $('[data-f="' + name + '"]', form); f.classList.toggle('is-bad', !ok); if (!ok) bad.push(f); }
      check('name', form.name.value.trim().length > 1);
      check('email', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.value.trim()));
      check('message', form.message.value.trim().length > 9);
      if (bad.length) { $('input, textarea', bad[0]).focus(); return; }
      var first = esc(form.name.value.trim().split(' ')[0]);
      form.outerHTML = '<div class="sent" role="status" tabindex="-1" id="sent"><h2>Message sent</h2><p>Thanks, ' + first + '. We reply within one working day, to ' + esc(form.email.value.trim()) + '.</p></div>';
      $('#sent').focus();
    });
  }

  /* ============================== WISHLIST ============================ */
  function wishlist() {
    var host = $('#wishlist');
    function render() {
      var items = store.wish().map(RL.byId).filter(Boolean);
      host.innerHTML = '<div class="page-head"><h1 class="d h-xl">Wishlist</h1>' + (items.length ? '<p>' + items.length + (items.length === 1 ? ' pair' : ' pairs') + ' saved</p>' : '') + '</div>' +
        (items.length ? '<div class="grid">' + items.map(RL.card).join('') + '</div>'
          : emptyState('Nothing saved yet', 'Tap the heart on any pair to keep it here for later.', 'shop.html', 'Browse the shop'));
      $$('[data-wish]', host).forEach(function (b) { b.setAttribute('aria-pressed', 'true'); });
    }
    doc.addEventListener('rl:change', function () { if (store.wish().length !== $$('.card', host).length) render(); });
    render();
  }

  /* =============================== LOGIN ============================== */
  function login() {
    var host = $('#auth'), mode = qs.get('mode') === 'create' ? 'up' : 'in';
    var art =
      '<div class="auth__art" aria-hidden="true">' +
        '<p class="d auth__word">Lace<br>up.</p>' +
        '<img src="assets/hero/05.webp" alt="">' +
      '</div>';

    function signedIn(u) {
      host.innerHTML = art +
        '<div class="auth__panel">' +
          '<h1 class="d">Hello, ' + esc(u.name.split(' ')[0]) + '</h1>' +
          '<p class="auth__sub">Signed in as ' + esc(u.email) + '.</p>' +
          '<div class="auth__links"><a class="btn btn--ink" href="orders.html">Your orders</a><a class="btn btn--line" href="wishlist.html">Wishlist</a><a class="btn btn--line" href="shop.html">Keep shopping</a></div>' +
          '<button class="link" type="button" data-out>Sign out</button>' +
        '</div>';
    }
    function signedOut() {
      host.innerHTML = art +
        '<div class="auth__panel">' +
          '<h1 class="d" id="authH"></h1>' +
          '<p class="auth__sub" id="authSub"></p>' +
          '<div class="seg" role="tablist" aria-label="Sign in or create an account">' +
            '<button type="button" role="tab" data-mode="in">Sign in</button><button type="button" role="tab" data-mode="up">Create account</button>' +
          '</div>' +
          '<form class="form" id="authForm" novalidate>' +
            '<label class="field" data-f="name" data-only="up"><span>Full name</span><input name="name" autocomplete="name"><small>Enter your name.</small></label>' +
            '<label class="field" data-f="email"><span>Email</span><input name="email" type="email" autocomplete="email" placeholder="you@example.com"><small>Enter an email like you@example.com.</small></label>' +
            '<div class="field" data-f="password"><label for="pw">Password</label>' +
              '<div class="field__pw"><input id="pw" name="password" type="password"><button type="button" data-show aria-pressed="false">Show</button></div>' +
              '<small>Use at least 8 characters.</small></div>' +
            '<p class="auth__forgot" data-only="in"><a class="link" href="contact.html">Forgot your password?</a></p>' +
            '<button class="btn btn--red btn--block" type="submit" id="authGo"></button>' +
            '<p class="auth__note">Prototype sign-in: your name and email stay in this browser, and the password is not stored.</p>' +
          '</form>' +
        '</div>';
      setMode(mode);
    }
    /* switch in place: nothing re-renders, so the page does not jump and focus stays where it was */
    function setMode(m) {
      mode = m;
      var create = m === 'up';
      $('#authH', host).textContent = create ? 'Create account' : 'Sign in';
      $('#authSub', host).textContent = create ? 'Follow your orders, keep a wishlist and check out faster.' : 'Good to see you again.';
      $('#authGo', host).textContent = create ? 'Create account' : 'Sign in';
      $('.seg', host).setAttribute('data-mode', m);
      $$('.seg button', host).forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-mode') === m ? 'true' : 'false'); });
      $$('[data-only]', host).forEach(function (el) { el.hidden = el.getAttribute('data-only') !== m; });
      $('#pw', host).setAttribute('autocomplete', create ? 'new-password' : 'current-password');
      $$('.field.is-bad', host).forEach(function (f) { f.classList.remove('is-bad'); });
    }
    function render() { var u = store.user(); if (u) signedIn(u); else signedOut(); }

    host.addEventListener('click', function (e) {
      var m = e.target.closest('[data-mode]');
      if (m) return setMode(m.getAttribute('data-mode'));
      var show = e.target.closest('[data-show]');
      if (show) {
        var pw = $('#pw', host), on = pw.type === 'password';
        pw.type = on ? 'text' : 'password'; show.textContent = on ? 'Hide' : 'Show'; show.setAttribute('aria-pressed', on ? 'true' : 'false');
        return;
      }
      if (e.target.closest('[data-out]')) { store.setUser(null); mode = 'in'; render(); RL.toast('Signed out'); }
    });
    host.addEventListener('input', function (e) { var f = e.target.closest('.field'); if (f) f.classList.remove('is-bad'); });
    host.addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target, create = mode === 'up', bad = [];
      function check(name, ok) { var f = $('[data-f="' + name + '"]', form); f.classList.toggle('is-bad', !ok); if (!ok) bad.push(f); }
      if (create) check('name', form.name.value.trim().length > 1);
      check('email', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.value.trim()));
      check('password', form.password.value.length >= 8);
      if (bad.length) { $('input', bad[0]).focus(); return; }
      var email = form.email.value.trim();
      var name = create ? form.name.value.trim() : (email.split('@')[0].replace(/[._\d]+/g, ' ').trim().replace(/^./, function (c) { return c.toUpperCase(); }) || 'there');
      store.setUser({ name: name, email: email });
      render(); RL.toast(create ? 'Account created' : 'Signed in');
    });
    render();
  }

  var pages = { home: home, shop: shop, product: product, cart: cart, checkout: checkout, orders: orders, contact: contact, wishlist: wishlist, login: login };
  if (pages[page]) pages[page]();
})();
