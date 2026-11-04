/* Case study index (css/case-index.css).
   Reads the chapters marked data-index="Name" on the page and adds a row to
   the sticky project bar: "08 / 12 · Name" and one segment per chapter,
   kept in step with the scroll (read / here, filling / still to come). */
(function () {
  var marks = [].slice.call(document.querySelectorAll('[data-index]'));
  var bar = document.querySelector('.projbar');
  if (marks.length < 3 || !bar) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  var nav = document.createElement('nav');
  nav.className = 'cix';
  nav.setAttribute('aria-label', 'Case study chapters');
  nav.innerHTML = '<p class="cix__now" aria-hidden="true" style="margin:0">' +
    '<span class="cix__count"></span><span class="cix__name"></span></p><ol class="cix__list"></ol>';
  var count = nav.querySelector('.cix__count'), name = nav.querySelector('.cix__name');
  var list = nav.querySelector('.cix__list');

  var links = marks.map(function (el, i) {
    if (!el.id) el.id = 'ch-' + pad(i + 1);
    var label = el.getAttribute('data-index');
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.className = 'cix__a';
    a.href = '#' + el.id;
    a.setAttribute('aria-label', pad(i + 1) + ' ' + label);
    a.innerHTML = '<span class="cix__tip"></span>';
    a.firstChild.textContent = label;
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var y = el.getBoundingClientRect().top + scrollY - bar.offsetHeight;
      scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
      history.replaceState(null, '', '#' + el.id);
    });
    li.appendChild(a);
    list.appendChild(li);
    return a;
  });
  bar.appendChild(nav);

  var here = -1;
  function update() {
    var line = bar.offsetHeight + innerHeight * 0.3, cur = 0;
    for (var i = 0; i < marks.length; i++) {
      if (marks[i].getBoundingClientRect().top <= line) cur = i;
    }
    var end = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    if (end) cur = marks.length - 1;

    /* how far through the current chapter, for the gold fill */
    var r = marks[cur].getBoundingClientRect();
    var next = marks[cur + 1] ? marks[cur + 1].getBoundingClientRect().top : r.bottom;
    var f = end ? 1 : Math.min(Math.max((line - r.top) / Math.max(next - r.top, 1), 0), 1);
    links[cur].style.setProperty('--cix-f', f.toFixed(3));

    if (cur === here) return;
    here = cur;
    links.forEach(function (a, i) {
      a.classList.toggle('is-read', i < cur);
      a.classList.toggle('is-here', i === cur);
      if (i === cur) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    count.innerHTML = '<b>' + pad(cur + 1) + '</b> / ' + pad(marks.length);
    name.textContent = marks[cur].getAttribute('data-index');
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
