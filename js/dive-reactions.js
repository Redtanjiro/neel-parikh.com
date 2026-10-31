/* ============ THE REACTION TAB — /dive only ============
   After a reader leaves a section, a small tab slides up above the
   Inflight button: "How did this land?" — Like / Love it / Not for me.
   One tap, a short thanks with an optional Comment (which opens the
   Inflight panel), then it hides itself. Each checkpoint is asked once
   per visit. Loaded only by the review copy; scripts/build-dive.py adds
   the <script> tag, and refuses to build if a public page carries it.

   WHERE THE ANSWERS GO
   Inflight has no API for posting from a page, so reactions are sent to
   the URL in this script tag's data-endpoint — a Google Apps Script web
   app that appends a row to a Sheet (scripts/dive-reactions-sheet.gs has
   the code and the five-minute setup). Until data-endpoint is filled in
   the tab still works end to end; answers are only logged to the console.

   QUICK INPUT: A AND S
     A   Like          S   Not for me
   While the tab is asking, A and S answer it, with the same pressed beat
   as a click. Any other time they react to whatever is under the cursor
   (mid-screen if there is no cursor), with a small burst there. Ignored
   while typing, inside the Inflight widget, and with Ctrl/Cmd/Alt held.
   Love it is the tab's own button; it has no key.

   An in-place reaction is sent with the thing it was on (a folder, an
   image, a section's heading) and also counts as that section's answer,
   so the tab won't ask about a section the reader has already reacted in.

   There are no tap or double-click gestures: the page's own clicks, text
   selection and double-tap zoom are left exactly as they are.

   TEACHING IT
   Desktop: a small card on the right says what A and S do, once per
   browser, and goes as soon as a key is used or it is dismissed. Phones
   have no keys, so they get the two quick reactions as buttons at the top
   right, under the nav — they answer the tab when it is asking, and react
   to what is on screen otherwise — with the same card under them once.

   WHEN IT ASKS
   A checkpoint fires once the reader has scrolled past it — the section
   has left the top half of the screen — so people react to something they
   have actually seen, not to something that has just arrived.
     home        Opening (the lid and the title card) · Work · About
     case study  "so far" at the turn · "overall" at the close
   Never during the opening, never while the Inflight panel is open (it
   waits until the panel closes), and a checkpoint passed while another is still being asked
   replaces it rather than stacking. */
(function () {
  'use strict';

  var script = document.currentScript;
  var ENDPOINT = (script && script.getAttribute('data-endpoint')) || '';
  var HOLD_PRESSED = 420;   // ms the pressed button shows before the thanks
  var HOLD_THANKS = 2200;   // ms the thanks stays before the tab hides

  var root = document.documentElement;
  var path = location.pathname.replace(/index\.html$/, '');
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- checkpoints for this page ----------
  function el(sel) { return document.querySelector(sel); }
  function vh() { return window.innerHeight || root.clientHeight; }
  function above(node, frac) {  // the node's bottom edge is above frac of the screen
    return !!node && node.getBoundingClientRect().bottom < vh() * frac;
  }
  function topAbove(node, frac) {
    return !!node && node.getBoundingClientRect().top < vh() * frac;
  }
  function atBottom() {
    return window.scrollY + vh() >= root.scrollHeight - 8;
  }

  var PROJECTS = {
    'futee': 'Futee', 'emf-ace': 'EMF ACE', 'cseds': 'CSEDS',
    'into-yesterday': 'Into Yesterday', 'superfood': 'Superfood'
  };

  var page, checkpoints;
  var m = path.match(/\/work\/([^/]+)\/?$/);
  if (m) {
    var name = PROJECTS[m[1]] || (document.title.split(' — ')[0] || m[1]);
    page = 'work/' + m[1];
    checkpoints = [
      { key: 'so-far', label: name + ' · so far',
        past: function () { return topAbove(el('section.turn'), .5); } },
      { key: 'overall', label: name + ' · overall', last: true,
        past: function () { return topAbove(el('.close'), .35) || atBottom(); } }
    ];
  } else {
    page = 'home';
    checkpoints = [
      { key: 'opening', label: '01 · Opening',
        past: function () { return above(el('#title'), .5); } },
      { key: 'work', label: '02 · Work',
        past: function () {
          return root.classList.contains('atoll-on')
            ? topAbove(el('#about'), .5)          // the 1px cue where About has settled
            : above(el('#desk'), .5);
        } },
      { key: 'about', label: '03 · About', last: true,
        past: function () {
          return root.classList.contains('atoll-on')
            ? above(el('#atoll'), .75) || atBottom()
            : above(el('#about-sec'), .5) || atBottom();
        } }
    ];
  }

  // ---------- once per checkpoint per visit ----------
  var SEEN = 'np:rx:';
  function seen(cp) { try { return sessionStorage.getItem(SEEN + page + ':' + cp.key) === '1'; } catch (e) { return false; } }
  function mark(cp) { try { sessionStorage.setItem(SEEN + page + ':' + cp.key, '1'); } catch (e) {} }

  var visitor = (function () {
    var k = 'np:rx:visitor', v = null;
    try { v = localStorage.getItem(k); } catch (e) {}
    if (!v) {
      v = Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem(k, v); } catch (e) {}
    }
    return v;
  })();

  // ---------- the Inflight widget, from the outside ----------
  function inflight() {
    var host = document.getElementById('inflight-widget-host');
    return host && host.shadowRoot;
  }
  function panelOpen() {
    var sr = inflight();
    return !!(sr && sr.querySelector('[role="dialog"][data-state="open"]'));
  }
  function openPanel() {
    var sr = inflight();
    var b = sr && sr.querySelector('button[aria-label="Open panel"]');
    if (b) b.click();
    return !!b;
  }

  // ---------- markup ----------
  var ICON = {
    like: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M5 7v6.5H2.5V7H5zm0 0l2.6-4.6c.3-.5.9-.6 1.3-.3.4.3.6.8.5 1.3L9 6h3.6c.8 0 1.4.7 1.2 1.5l-1 4.8c-.1.7-.7 1.2-1.4 1.2H5"/></svg>',
    love: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M8 13.5S2 10 2 5.8C2 4.2 3.2 3 4.8 3c1.3 0 2.4.8 3.2 2 .8-1.2 1.9-2 3.2-2C12.8 3 14 4.2 14 5.8 14 10 8 13.5 8 13.5z"/></svg>',
    meh:  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M11 9V2.5h2.5V9H11zm0 0l-2.6 4.6c-.3.5-.9.6-1.3.3-.4-.3-.6-.8-.5-1.3L7 10H3.4c-.8 0-1.4-.7-1.2-1.5l1-4.8c.1-.7.7-1.2 1.4-1.2H11"/></svg>',
    x:    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7"/></svg>'
  };
  var LABEL = { like: 'Like', love: 'Love it', meh: 'Not for me' };
  var THANKS = { like: 'Nice — noted.', love: 'Made my day. Thank you!', meh: 'Fair. That helps me fix it.' };

  var tab = document.createElement('div');
  tab.className = 'rx';
  tab.setAttribute('role', 'region');
  tab.setAttribute('aria-label', 'Quick reaction');
  tab.innerHTML =
    '<div class="rx__ask">' +
      '<div class="rx__head">' +
        '<div class="rx__title"><span class="rx__pill"></span><span class="rx__q">How did this land?</span></div>' +
        '<button type="button" class="rx__x" aria-label="Dismiss">' + ICON.x + '</button>' +
      '</div>' +
      '<div class="rx__picks" role="group" aria-label="Your reaction">' +
        ['like', 'love', 'meh'].map(function (id) {
          return '<button type="button" class="rx__pick rx__pick--' + id + '" data-rx="' + id + '" aria-pressed="false">' +
                 ICON[id] + '<span>' + LABEL[id] + '</span></button>';
        }).join('') +
      '</div>' +
      '<p class="rx__hint"></p>' +
    '</div>' +
    '<div class="rx__thanks" hidden>' +
      '<div class="rx__thanks-copy"><span class="rx__thanks-line"></span>' +
      '<span class="rx__thanks-sub">Want to say more? Leave a comment.</span></div>' +
      '<button type="button" class="rx__comment">Comment</button>' +
    '</div>' +
    '<p class="rx__sr" aria-live="polite"></p>';

  var askBox = tab.querySelector('.rx__ask');
  var thanksBox = tab.querySelector('.rx__thanks');
  var pill = tab.querySelector('.rx__pill');
  var live = tab.querySelector('.rx__sr');
  var hint = tab.querySelector('.rx__hint');
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer) hint.innerHTML = 'Quicker: <kbd>A</kbd> like <kbd>S</kbd> not for me, anywhere on the page.';
  else hint.hidden = true;

  // ---------- state ----------
  var current = null;     // the checkpoint being asked
  var timer = 0;

  function show(cp) {
    clearTimeout(timer);
    current = cp;
    mark(cp);
    pill.textContent = cp.label;
    tab.removeAttribute('data-picked');
    [].forEach.call(tab.querySelectorAll('.rx__pick'), function (b) { b.setAttribute('aria-pressed', 'false'); });
    askBox.hidden = false;
    thanksBox.hidden = true;
    tab.setAttribute('data-open', '');
    live.textContent = 'Quick reaction: how did ' + cp.label.replace(/^\d+ · /, '') + ' land?';
  }

  function hide() {
    clearTimeout(timer);
    tab.removeAttribute('data-open');
    var hadFocus = tab.contains(document.activeElement);
    current = null;
    if (hadFocus && document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function send(cp, reaction, extra) {
    extra = extra || {};
    var row = {
      page: page, section: cp.key, label: cp.label, reaction: reaction,
      target: extra.target || '', via: extra.via || 'tab',
      at: new Date().toISOString(), visitor: visitor,
      viewport: window.innerWidth + 'x' + window.innerHeight,
      referrer: document.referrer || ''
    };
    if (!ENDPOINT) {
      if (window.console) console.info('[reaction]', row);
      return;
    }
    try {
      fetch(ENDPOINT, {
        method: 'POST', mode: 'no-cors', keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(row)
      }).catch(function () {});
    } catch (e) {}
  }

  function pick(id, via) {
    if (!current || tab.hasAttribute('data-picked')) return;
    var cp = current;
    send(cp, id, { via: via || 'tab' });
    tab.setAttribute('data-picked', '');
    var btn = tab.querySelector('[data-rx="' + id + '"]');
    if (btn) btn.setAttribute('aria-pressed', 'true');
    timer = setTimeout(function () {
      askBox.hidden = true;
      thanksBox.hidden = false;
      tab.querySelector('.rx__thanks-line').textContent = THANKS[id];
      live.textContent = THANKS[id];
      timer = setTimeout(function () { if (current === cp) hide(); }, HOLD_THANKS);
    }, reduced ? 0 : HOLD_PRESSED);
  }

  tab.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-rx')) pick(b.getAttribute('data-rx'));
    else if (b.classList.contains('rx__x')) hide();
    else if (b.classList.contains('rx__comment')) { hide(); openPanel(); }
  });
  tab.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.stopPropagation(); hide(); }
  });
  // hovering keeps the thanks up for as long as the pointer is on it
  tab.addEventListener('pointerenter', function () {
    if (!thanksBox.hidden) clearTimeout(timer);
  });
  tab.addEventListener('pointerleave', function () {
    if (!thanksBox.hidden && current) {
      var cp = current;
      timer = setTimeout(function () { if (current === cp) hide(); }, 1200);
    }
  });


  // ---------- reacting in place: the A and S keys ----------
  function text(node, n) { return (node && node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, n); }

  // which checkpoint a node belongs to, and a readable name for the thing itself
  function describe(node) {
    if (node && node.nodeType !== 1) node = node.parentElement;
    if (!node) return null;
    var cp = null, target = '';
    if (page === 'home') {
      if (node.closest('#hero, #title')) cp = checkpoints[0];
      else if (node.closest('#desk')) cp = checkpoints[1];
      else if (node.closest('#about-sec, .atoll__slot, footer, .footer')) cp = checkpoints[2];
    } else {
      var turn = el('section.turn');
      cp = turn && (turn === node || turn.contains(node) ||
                    (turn.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING))
        ? checkpoints[1] : checkpoints[0];
    }
    var folder = node.closest('.folder');
    var img = node.closest('img');
    var sect = node.closest('section, footer, .close, .projbar');
    var head = sect && sect.querySelector('h1, h2, h3');
    if (folder) target = 'folder: ' + text(folder.querySelector('.folder__name'), 40);
    else if (img) target = 'image: ' + (img.getAttribute('alt') || (img.getAttribute('src') || '').split('/').pop());
    else if (sect) target = (sect.className.split(' ')[0] || sect.tagName.toLowerCase()) +
                            (head ? ': ' + text(head, 60) : '');
    if (!cp) cp = { key: 'page', label: 'Page' };
    return { cp: cp, target: target || 'page' };
  }

  var RX_ICON = { like: ICON.like, meh: ICON.meh };
  var RX_WORD = { like: 'Liked', meh: 'Not for me' };
  function burst(kind, x, y) {
    var b = document.createElement('div');
    b.className = 'rx-burst rx-burst--' + kind;
    b.setAttribute('aria-hidden', 'true');
    b.style.left = x + 'px';
    b.style.top = y + 'px';
    b.innerHTML = '<span class="rx-burst__dot">' + RX_ICON[kind] + '</span><span class="rx-burst__word">' + RX_WORD[kind] + '</span>';
    document.body.appendChild(b);
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 1000);
  }

  var lastReact = { key: '', t: 0 };
  function react(kind, x, y, node, via) {
    if (blocked()) return;
    var d = describe(node);
    if (!d) return;
    var key = kind + '|' + d.target;
    var now = Date.now();
    if (key === lastReact.key && now - lastReact.t < 900) return;
    lastReact = { key: key, t: now };

    var sel = window.getSelection && window.getSelection();
    if (sel && sel.removeAllRanges) sel.removeAllRanges();

    send(d.cp, kind, { target: d.target, via: via });
    burst(kind, x, y);
    live.textContent = RX_WORD[kind] + ': ' + d.target.replace(/^\w+: /, '');
    learn();
    if (d.cp.key !== 'page') {
      mark(d.cp);
      if (current === d.cp && !tab.hasAttribute('data-picked')) hide();
    }
  }

  // keys: whatever the cursor is over, or mid-screen if there is no cursor
  var cursor = null;
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse') cursor = { x: e.clientX, y: e.clientY };
  }, { passive: true, capture: true });
  document.addEventListener('mouseleave', function () { cursor = null; });

  document.addEventListener('keydown', function (e) {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = (e.key || '').toLowerCase();
    if (k !== 'a' && k !== 's') return;
    var path = e.composedPath ? e.composedPath() : [e.target];
    for (var i = 0; i < path.length; i++) {
      var n = path[i];
      if (!n || n.nodeType !== 1) continue;
      if (n.id === 'inflight-widget-host' || n.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName)) return;
    }
    if (blocked()) return;
    e.preventDefault();
    var kind = k === 'a' ? 'like' : 'meh';
    // the tab is asking: the key is the answer
    if (current && !tab.hasAttribute('data-picked')) {
      learn();
      pick(kind, 'key ' + k.toUpperCase());
      return;
    }
    var x = cursor ? cursor.x : window.innerWidth / 2;
    var y = cursor ? cursor.y : window.innerHeight / 2;
    var node = document.elementFromPoint(x, y);
    if (!node || node.closest('.rx, #inflight-widget-host')) {
      x = window.innerWidth / 2; y = window.innerHeight / 2;
      node = document.elementFromPoint(x, y);
    }
    react(kind, x, y, node, 'key ' + k.toUpperCase());
  });

  // ---------- teaching it: a one-time card, and the phone's own buttons ----------
  var TAUGHT = 'np:rx:taught';
  function taught() { try { return localStorage.getItem(TAUGHT) === '1'; } catch (e) { return false; } }
  function learn() {
    try { localStorage.setItem(TAUGHT, '1'); } catch (e) {}
    tab.setAttribute('data-taught', '');
    coachGone = true;
    coach.removeAttribute('data-show');
  }

  var coach = document.createElement('div');
  coach.className = 'rx-coach' + (finePointer ? '' : ' rx-coach--touch');
  coach.setAttribute('role', 'note');
  coach.innerHTML =
    '<p class="rx-coach__t">Quick reactions</p>' +
    (finePointer
      ? '<p class="rx-coach__b">Press <kbd>A</kbd> to like, <kbd>S</kbd> for not for me. It reacts to whatever is under your cursor.</p>'
      : '<p class="rx-coach__b">Tap ' + ICON.like + ' to like, ' + ICON.meh + ' for not for me. It reacts to what is on screen.</p>') +
    '<button type="button" class="rx-coach__ok">Got it</button>';
  // once it has been used or dismissed it never comes back; left alone it
  // steps aside after COACH_FOR and tries again on the next visit
  var coachGone = taught(), coachAt = 0, COACH_FOR = 14000;
  coach.querySelector('.rx-coach__ok').addEventListener('click', function () {
    try { localStorage.setItem(TAUGHT, '1'); } catch (e) {}
    coachGone = true;
    coach.removeAttribute('data-show');
  });

  var quick = null;
  if (!finePointer) {
    quick = document.createElement('div');
    quick.className = 'rx-quick';
    quick.setAttribute('role', 'group');
    quick.setAttribute('aria-label', 'Quick reaction to what is on screen');
    quick.innerHTML =
      '<button type="button" class="rx-quick__b" data-rx="like" aria-label="Like">' + ICON.like + '</button>' +
      '<button type="button" class="rx-quick__b" data-rx="meh" aria-label="Not for me">' + ICON.meh + '</button>';
    quick.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button');
      if (!b || blocked()) return;
      var kind = b.getAttribute('data-rx');
      learn();
      if (current && !tab.hasAttribute('data-picked')) { pick(kind, 'button'); return; }
      var x = window.innerWidth / 2, y = window.innerHeight / 2;
      react(kind, x, y, document.elementFromPoint(x, y), 'button');
    });
  }

  // both wait for the page to be the reader's: never over the opening or
  // the Inflight panel, and the card a beat after that
  function teach() {
    var ok = !blocked();
    if (quick) {
      if (ok) quick.setAttribute('data-show', '');
      else quick.removeAttribute('data-show');
    }
    if (coachGone) return;
    if (!ok) { coach.removeAttribute('data-show'); return; }
    var now = Date.now();
    if (!coachAt) { coachAt = now + 1200; setTimeout(teach, 1250); }
    if (now < coachAt) return;
    if (now - coachAt > COACH_FOR) { coachGone = true; coach.removeAttribute('data-show'); return; }
    coach.setAttribute('data-show', '');
  }

  // ---------- watching the scroll ----------
  function blocked() {
    return root.classList.contains('is-opening') || panelOpen();
  }

  function check() {
    teach();
    if (blocked()) {
      if (current && !tab.hasAttribute('data-picked') && panelOpen()) hide();
      return;
    }
    // a thanks still on screen finishes first; anything passed meanwhile is
    // still unasked, so the next check after it hides picks it up
    if (current && tab.hasAttribute('data-picked')) return;

    // the furthest checkpoint passed and not yet asked; earlier ones that
    // were skipped over in one jump are let go rather than asked late
    var next = null;
    for (var i = 0; i < checkpoints.length; i++) {
      var cp = checkpoints[i];
      if (seen(cp)) continue;
      var passed = false;
      try { passed = cp.past(); } catch (e) {}
      if (passed) next = cp;
    }
    if (!next) return;
    for (var j = 0; j < checkpoints.length; j++) {
      if (checkpoints[j] === next) break;
      if (!seen(checkpoints[j])) {
        var passedEarlier = false;
        try { passedEarlier = checkpoints[j].past(); } catch (e) {}
        if (passedEarlier) mark(checkpoints[j]);
      }
    }
    show(next);
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; check(); });
  }

  function start() {
    document.body.appendChild(tab);
    document.body.appendChild(coach);
    if (quick) document.body.appendChild(quick);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // the opening ending, and the panel closing, are not scroll events: the
    // first is seen the moment html loses .is-opening, the second on a tick
    if ('MutationObserver' in window) {
      new MutationObserver(onScroll).observe(root, { attributes: true, attributeFilter: ['class'] });
    }
    setInterval(check, 1000);
    check();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
