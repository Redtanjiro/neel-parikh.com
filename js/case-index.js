/* Case study index (css/case-index.css).
   Reads the chapters marked data-index="Name" on the page, builds a fixed
   rail of ticks in the left gutter and keeps it in step with the scroll:
   read / here / still to come, plus "04 / 12". Hidden on the title screen. */
(function () {
  var marks = [].slice.call(document.querySelectorAll('[data-index]'));
  if (marks.length < 3) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  var nav = document.createElement('nav');
  nav.className = 'cix';
  nav.setAttribute('aria-label', 'Case study chapters');
  var count = document.createElement('span');
  count.className = 'cix__count';
  count.setAttribute('aria-hidden', 'true');
  var list = document.createElement('ol');
  list.className = 'cix__list';
  var toast = document.createElement('span');
  toast.className = 'cix__toast';
  toast.setAttribute('aria-hidden', 'true');

  var links = marks.map(function (el, i) {
    if (!el.id) el.id = 'ch-' + pad(i + 1);
    el.style.scrollMarginTop = '64px';
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.className = 'cix__a';
    a.href = '#' + el.id;
    a.innerHTML = '<span class="cix__tick"></span><span class="cix__name"></span>';
    a.lastChild.textContent = el.getAttribute('data-index');
    a.addEventListener('click', function (e) {
      e.preventDefault();
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + el.id);
    });
    li.appendChild(a);
    list.appendChild(li);
    return a;
  });
  nav.appendChild(count);
  nav.appendChild(list);
  nav.appendChild(toast);
  document.body.appendChild(nav);

  var here = -1, toastT = 0, first = true;
  function update() {
    var line = innerHeight * 0.4, cur = 0;
    for (var i = 0; i < marks.length; i++) {
      if (marks[i].getBoundingClientRect().top <= line) cur = i;
    }
    /* the last chapter is short: count it once the page bottoms out */
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = marks.length - 1;

    if (scrollY > innerHeight * 0.45) nav.setAttribute('data-show', '');
    else nav.removeAttribute('data-show');

    if (cur === here) return;
    here = cur;
    links.forEach(function (a, i) {
      a.classList.toggle('is-read', i < cur);
      a.classList.toggle('is-here', i === cur);
      if (i === cur) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    count.innerHTML = '<b>' + pad(cur + 1) + '</b><i> / ' + pad(marks.length) + '</i>';

    /* phones: say the chapter's name for a moment, beside its tick */
    if (first) { first = false; return; }
    if (!nav.hasAttribute('data-show')) return;
    var t = links[cur].getBoundingClientRect(), n = nav.getBoundingClientRect();
    toast.style.setProperty('--cix-y', (t.top - n.top + t.height / 2) + 'px');
    toast.innerHTML = '<b>' + pad(cur + 1) + '</b>';
    toast.appendChild(document.createTextNode(marks[cur].getAttribute('data-index')));
    toast.setAttribute('data-show', '');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.removeAttribute('data-show'); }, 1600);
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; update(); });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
})();
