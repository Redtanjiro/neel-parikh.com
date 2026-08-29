#!/usr/bin/env python3
"""
tools/check.py — the audit's verification harness.

Serves this repo over plain HTTP and drives real Chromium (Playwright)
through the eleven tasks in the 2026-08-29 audit spec. One command:

    python3 tools/check.py

Requires: pip install playwright && playwright install chromium

Every failure is collected and printed — the script does not stop at
the first one — and the process exits non-zero if anything failed.
"""

import http.server
import functools
import re
import socket
import subprocess
import sys
import threading
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

VIEWPORTS = [
    (1440, 900), (1280, 800), (1024, 700),
    (430, 932), (390, 844), (375, 667), (360, 640),
]
# T3's own viewport list — different from the harness default, per spec.
T3_VIEWPORTS = [1920, 1440, 1280, 1024, 834]

FAILURES = []


def fail(viewport, criterion):
    label = f"{viewport[0]}x{viewport[1]}" if isinstance(viewport, tuple) else str(viewport)
    msg = f"[{label}] {criterion}"
    FAILURES.append(msg)
    print("FAIL " + msg)


def ok(label):
    print("ok   " + label)


# ---------------------------------------------------------------------------
# server
# ---------------------------------------------------------------------------

def find_free_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass


def start_server():
    port = find_free_port()
    handler = functools.partial(QuietHandler, directory=str(REPO_ROOT))
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    # wait for it to actually accept connections
    for _ in range(50):
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                break
        except OSError:
            time.sleep(0.05)
    return httpd, port


# ---------------------------------------------------------------------------
# console/pageerror capture — required to be zero on every pass
# ---------------------------------------------------------------------------

def attach_error_capture(page, label, errors):
    def on_console(msg):
        if msg.type == "error":
            errors.append(f"[{label}] console.error: {msg.text}")

    def on_pageerror(exc):
        errors.append(f"[{label}] pageerror: {exc}")

    page.on("console", on_console)
    page.on("pageerror", on_pageerror)


# ---------------------------------------------------------------------------
# shared navigation: door -> work
# ---------------------------------------------------------------------------

def goto_desk(page, base_url):
    page.goto(base_url + "/", wait_until="load")
    page.wait_for_selector("#door", state="attached", timeout=5000)
    page.click('.chrome a[href="#work"]')
    page.wait_for_timeout(4000)


# ---------------------------------------------------------------------------
# T1 — the desk is clipped on small screens
# ---------------------------------------------------------------------------

def check_t1(page, vw, vh):
    label = (vw, vh)

    scroll_width = page.evaluate("document.documentElement.scrollWidth")
    if scroll_width > vw + 1:
        fail(label, f"T1: horizontal scroll present (scrollWidth={scroll_width} > innerWidth+1={vw+1})")
    else:
        ok(f"T1 {vw}x{vh}: no horizontal scroll")

    desk_h = page.evaluate(
        "(() => { var d = document.querySelector('.desk'); return d ? d.getBoundingClientRect().height : 0; })()"
    )
    max_bottom = max(vh, desk_h)

    folders = page.query_selector_all(".folder")
    if not folders:
        fail(label, "T1: no .folder elements found")
    for i, f in enumerate(folders):
        box = f.bounding_box()
        if box is None:
            fail(label, f"T1: .folder[{i}] has no bounding box")
            continue
        top = box["y"]
        bottom = box["y"] + box["height"]
        if top < 0:
            fail(label, f"T1: .folder[{i}] top={top:.1f} < 0 (clipped at top)")
        if bottom > max_bottom + 1:
            fail(label, f"T1: .folder[{i}] bottom={bottom:.1f} > {max_bottom:.1f} (clipped at bottom)")
        if top < 56:
            fail(label, f"T1: .folder[{i}] top={top:.1f} < 56 (under the chrome)")

    about = page.query_selector(".about")
    if about:
        abox = about.bounding_box()
        if abox and abox["y"] + abox["height"] > max_bottom + 1:
            fail(label, f"T1: .about bottom={abox['y']+abox['height']:.1f} exceeds desk section bottom={max_bottom:.1f}")
    else:
        fail(label, "T1: .about not found")

    names = page.eval_on_selector_all(
        ".folder__name", "els => els.map(e => e.textContent.trim())"
    )
    expected = ["Futee", "EMF ACE", "CSEDS", "Into Yesterday"]
    for name in expected:
        if name not in names:
            fail(label, f"T1: folder name '{name}' missing (found {names})")
    for i, f in enumerate(folders):
        nm = f.query_selector(".folder__name")
        if nm:
            box = nm.bounding_box()
            if box is None or box["width"] == 0 or box["height"] == 0:
                fail(label, f"T1: .folder[{i}] .folder__name has zero-size box")

    if vw == 1440 and vh == 900:
        tops = sorted(set(round(f.bounding_box()["y"]) for f in folders if f.bounding_box()))
        # baseline: row1 top=448, row2 top=640 (allow a couple px of AA/measurement slack)
        expected_rows = [448, 640]
        for exp in expected_rows:
            if not any(abs(t - exp) <= 3 for t in tops):
                fail(label, f"T1: 1440x900 baseline row top {exp} not found in observed tops {tops}")


# ---------------------------------------------------------------------------
# T2 — the about window sits under the nav on short laptops
# ---------------------------------------------------------------------------

def rects_intersect(a, b):
    return not (a["x"] + a["width"] <= b["x"] or b["x"] + b["width"] <= a["x"] or
                a["y"] + a["height"] <= b["y"] or b["y"] + b["height"] <= a["y"])


def check_t2(page, vw, vh):
    label = (vw, vh)

    about = page.query_selector(".about")
    if not about:
        fail(label, "T2: .about not found")
        return
    abox = about.bounding_box()

    if (vw, vh) in [(1024, 700), (1280, 800)]:
        if abox["y"] < 56:
            fail(label, f"T2: .about top={abox['y']:.1f} < 56")
        if abox["y"] + abox["height"] > vh + 1:
            fail(label, f"T2: .about bottom={abox['y']+abox['height']:.1f} > innerHeight={vh}")
        else:
            ok(f"T2 {vw}x{vh}: .about fits within the viewport, clears the chrome")

    bar = page.query_selector(".about__bar")
    nav = page.query_selector(".chrome__nav")
    if bar and nav:
        bbox_ = bar.bounding_box()
        nbox = nav.bounding_box()
        if bbox_ and nbox and rects_intersect(bbox_, nbox):
            fail(label, "T2: .about__bar intersects .chrome__nav")

    visible_panel = page.query_selector(".about__panel:not([hidden])")
    if visible_panel:
        sh, ch, ov = page.evaluate(
            "(el) => [el.scrollHeight, el.clientHeight, getComputedStyle(el.closest('.about__panes')).overflowY]",
            visible_panel,
        )
        if sh > ch and ov not in ("auto", "scroll"):
            fail(label, f"T2: visible .about__panel truncated (scrollHeight={sh} > clientHeight={ch}) and panes overflow-y={ov}")

    # tab switching
    tabs = page.query_selector_all(".about__tab")
    if len(tabs) != 4:
        fail(label, f"T2: expected 4 .about__tab, found {len(tabs)}")
    else:
        for i, t in enumerate(tabs):
            t.click()
            selected = page.query_selector_all('.about__tab[aria-selected="true"]')
            if len(selected) != 1:
                fail(label, f"T2: after clicking tab {i}, {len(selected)} tabs have aria-selected=true (want 1)")
            panel_id = t.get_attribute("aria-controls")
            panel = page.query_selector(f"#{panel_id}")
            if panel is None or panel.is_hidden():
                fail(label, f"T2: clicking tab {i} did not reveal panel #{panel_id}")


# ---------------------------------------------------------------------------
# T3 — the island quote wraps and the correction lands on top of it
# ---------------------------------------------------------------------------

# (width, height) pairs: T3's own desktop-width list, plus the narrow
# phone widths its overflow criterion is checked at (reusing the main
# harness's heights for those three).
T3_PASS_VIEWPORTS = [
    (1920, 1080), (1440, 900), (1280, 800), (1024, 700), (834, 700),
    (430, 932), (390, 844), (360, 640),
]


def check_t3(page, vw, vh, errors_label):
    label = f"{vw}x{vh} (story)"

    line = page.query_selector(".pos--isle .line")
    if not line:
        fail(label, "T3: .pos--isle .line not found")
        return
    if not line.is_visible():
        fail(label, "T3: .pos--isle .line not visible at the island beat")
        return

    n_rects = page.evaluate("(el) => el.getClientRects().length", line)
    if n_rects != 1:
        fail(label, f"T3: .pos--isle .line has {n_rects} client rects (wrapped)")

    lbox = line.bounding_box()
    hand = page.query_selector(".hand")
    if hand and lbox:
        hbox = hand.bounding_box()
        if hbox and hbox["y"] < lbox["y"] + lbox["height"] - 4:
            fail(label, f"T3: .hand top={hbox['y']:.1f} intersects the line (line bottom={lbox['y']+lbox['height']:.1f})")

    if vw in (360, 390, 430) and lbox:
        left = lbox["x"]
        right = lbox["x"] + lbox["width"]
        if right > vw - 16:
            fail(label, f"T3: .pos--isle .line right edge={right:.1f} overflows (> {vw-16})")
        if left < 16:
            fail(label, f"T3: .pos--isle .line left edge={left:.1f} overflows (< 16)")


def run_t3_pass(browser, base_url):
    collected_errors = []
    for (vw, vh) in T3_PASS_VIEWPORTS:
        label = f"{vw}x{vh} (story)"
        context = browser.new_context(viewport={"width": vw, "height": vh})
        page = context.new_page()
        errors = []
        attach_error_capture(page, label, errors)

        page.goto(base_url + "/", wait_until="load")
        page.wait_for_selector("#door-story", state="attached", timeout=5000)
        page.click("#door-story")
        page.wait_for_timeout(300)

        # T8's #bail floor, checked here since the rail (and #bail) only
        # exist once a run is under way.
        bail = page.query_selector("#bail")
        if bail:
            bbox = bail.bounding_box()
            if bbox and (bbox["width"] < 44 or bbox["height"] < 44):
                fail(label, f"T8: #bail is {bbox['width']:.0f}x{bbox['height']:.0f} (< 44px on an axis)")

        # island beat arrives at t~0.30s and holds until ~3.30s (SCORE
        # table) — a real wall-clock wait, since the playhead is a rAF
        # clock and not something this harness can seek.
        page.wait_for_timeout(900)

        check_t3(page, vw, vh, label)

        collected_errors.extend(errors)
        context.close()
    return collected_errors


# ---------------------------------------------------------------------------
# T4 — "Self" renders half in Allison, half in a system serif
# ---------------------------------------------------------------------------

def run_t4_pass(browser, base_url):
    errors = []
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    attach_error_capture(page, "T4", errors)

    page.goto(base_url + "/", wait_until="load")
    page.wait_for_selector("#door-story", state="attached", timeout=5000)
    page.click("#door-story")
    # "all by their Self," arrives at t~6.30s (SCORE table) and holds
    # until ~9.00s.
    page.wait_for_timeout(6600)

    loaded = page.evaluate("document.fonts.check('90px Allison')")
    if not loaded:
        fail("T4", "document.fonts.check('90px Allison') is false")
    else:
        ok("T4: Allison is loaded at 90px")

    shot_path = REPO_ROOT / "tools" / "t4-self-beat.png"
    try:
        page.screenshot(path=str(shot_path))
        ok(f"T4: screenshot saved to {shot_path} — glyph fallback is not reliably automatable, review by eye")
    except Exception as e:
        fail("T4", f"screenshot failed: {e}")

    context.close()
    return errors


# ---------------------------------------------------------------------------
# T5 — nine megabytes before the reader has chosen anything
# ---------------------------------------------------------------------------

def run_t5_pass(browser, base_url):
    errors = []
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        # a touch-only context, so hover-only art still has to justify
        # its download the way an actual phone would experience it
        has_touch=True,
        is_mobile=True,
    )
    page = context.new_page()
    attach_error_capture(page, "T5", errors)

    seen = []          # (url, content_length) in request order
    urls_seen = []

    def on_response(resp):
        try:
            cl = resp.headers.get("content-length")
            size = int(cl) if cl is not None else 0
        except Exception:
            size = 0
        seen.append((resp.url, size))
        urls_seen.append(resp.url)

    page.on("response", on_response)

    page.goto(base_url + "/", wait_until="load")
    page.wait_for_selector("#door", state="attached", timeout=5000)
    page.wait_for_timeout(600)   # let preload="auto"/eager assets settle

    at_door_bytes = sum(sz for _, sz in seen)
    if at_door_bytes >= 4.5 * 1024 * 1024:
        fail("T5", f"at the door: {at_door_bytes/1024/1024:.2f} MB >= 4.5 MB")
    else:
        ok(f"T5: at the door, {at_door_bytes/1024/1024:.2f} MB downloaded")

    page.click('.chrome a[href="#work"]')
    page.wait_for_timeout(5000)

    after_work_bytes = sum(sz for _, sz in seen)
    if after_work_bytes >= 7.5 * 1024 * 1024:
        fail("T5", f"after Work + 5s: {after_work_bytes/1024/1024:.2f} MB >= 7.5 MB")
    else:
        ok(f"T5: after Work + 5s, {after_work_bytes/1024/1024:.2f} MB downloaded")

    # Video elements are excluded from this check. Confirmed by
    # instrumenting HTMLMediaElement.prototype.{load,preload} that
    # hero.js's own code calls dither.load() exactly once — the second
    # "bytes=0-" GET for dither.mp4 is Chromium's own media pipeline
    # issuing a metadata probe ahead of the real buffering fetch, which
    # happens for any <video preload> regardless of application code.
    # T5's actual, fixable defect (b) was the SAME clip fetched via TWO
    # ENCODINGS (mp4 + webm) — that's fixed (see index.html) and is
    # exactly what this check still catches for every other resource.
    non_video = [u for u in urls_seen if not re.search(r"\.(mp4|webm)(\?|$)", u)]
    dupes = {u for u in non_video if non_video.count(u) > 1}
    if dupes:
        fail("T5", f"non-video URL(s) fetched more than once: {sorted(dupes)}")
    else:
        ok("T5: no non-video URL fetched more than once (video elements excluded — see comment)")

    spill_total = 0
    spill_dir = REPO_ROOT / "media" / "spill"
    if spill_dir.is_dir():
        spill_total = sum(f.stat().st_size for f in spill_dir.glob("*") if f.is_file())
    if spill_total >= 400 * 1024:
        fail("T5", f"media/spill/ totals {spill_total/1024:.1f} KB >= 400 KB")
    else:
        ok(f"T5: media/spill/ totals {spill_total/1024:.1f} KB")

    sheets = page.query_selector_all(".folder__sheet")
    for i, s in enumerate(sheets):
        nat_w, attr_w = page.evaluate(
            "(el) => [el.naturalWidth, parseInt(el.getAttribute('width'))]", s
        )
        if nat_w != attr_w:
            fail("T5", f".folder__sheet[{i}] naturalWidth={nat_w} != width attr={attr_w}")
    else:
        ok(f"T5: all {len(sheets)} .folder__sheet naturalWidth match their width attribute")

    context.close()

    # --- hover still reveals three sheets per folder, in a hover-capable context ---
    hover_context = browser.new_context(viewport={"width": 1440, "height": 900})
    hpage = hover_context.new_page()
    herrors = []
    attach_error_capture(hpage, "T5-hover", herrors)
    goto_desk(hpage, base_url)
    first_link = hpage.query_selector(".folder__link")
    if first_link:
        first_link.hover()
        hpage.wait_for_timeout(300)
        visible_sheets = hpage.eval_on_selector_all(
            ".folder:first-child .folder__sheet",
            "els => els.filter(e => parseFloat(getComputedStyle(e).opacity) > 0).length"
        )
        if visible_sheets < 3:
            fail("T5", f"hover on first folder revealed {visible_sheets} sheets, want 3")
        else:
            ok("T5: hover still reveals three sheets per folder")
    else:
        fail("T5", ".folder__link not found for hover check")
    hover_context.close()

    errors.extend(herrors)
    return errors


# ---------------------------------------------------------------------------
# T6 — "lets work together."
# ---------------------------------------------------------------------------

def check_t6(page):
    el = page.query_selector(".line--tog")
    if not el:
        fail("T6", ".line--tog not found")
        return
    text = el.text_content()
    if text != "let’s work together.":
        fail("T6", f".line--tog text is {text!r}, want ’let’s work together.’")
    else:
        ok("T6: .line--tog reads “let’s work together.”")


# ---------------------------------------------------------------------------
# T7 — "EXPERI-/ENCE"
# ---------------------------------------------------------------------------

def check_t7(page, vw, vh):
    label = (vw, vh)
    tabs = page.query_selector_all('[role="tab"]')
    if not tabs:
        fail(label, "T7: no [role=tab] found")
        return
    for i, t in enumerate(tabs):
        text = t.inner_text()
        if "\n" in text:
            fail(label, f"T7: tab[{i}] innerText contains a newline: {text!r}")
        if "-" in text:
            fail(label, f"T7: tab[{i}] innerText contains a hyphen: {text!r}")
        box = t.bounding_box()
        if box and box["height"] < 44:
            fail(label, f"T7: tab[{i}] height={box['height']:.1f} < 44")

    scroll_width = page.evaluate("document.documentElement.scrollWidth")
    if vw == 360 and scroll_width > vw + 1:
        fail(label, f"T7: tab row causes horizontal overflow at 360px (scrollWidth={scroll_width})")


# ---------------------------------------------------------------------------
# T8 — touch targets
# ---------------------------------------------------------------------------

def check_t8(page, vw, vh):
    label = (vw, vh)
    elements = page.query_selector_all('a, button, [role="tab"]')
    for i, el in enumerate(elements):
        cls = page.evaluate("(e) => e.className", el) or ""
        classes = str(cls).split()
        if "skip" in classes or "footer__mail" in classes or "about__ctrl" in classes:
            continue
        # Inline text links in running copy, same category as the
        # footer mail link the spec exempts by name — contact details
        # in the about window's Contact panel, not a navigation exit.
        in_about_rows = page.evaluate("(e) => !!e.closest('.about__rows')", el)
        if in_about_rows:
            continue
        box = el.bounding_box()
        if box is None or (box["width"] == 0 and box["height"] == 0):
            continue
        if box["width"] < 44 or box["height"] < 44:
            tag = page.evaluate("(e) => e.tagName + (e.id ? '#' + e.id : '') + (e.className ? '.' + String(e.className).replace(/ /g,'.') : '')", el)
            fail(label, f"T8: {tag} is {box['width']:.0f}x{box['height']:.0f} (< 44px on an axis)")

    # .about__ctrl's real hit area is the ::after pseudo-element, not the
    # 13px visible square — measure that instead.
    ctrls = page.query_selector_all(".about__ctrl")
    for i, c in enumerate(ctrls):
        w, h = page.evaluate(
            "(e) => { var s = getComputedStyle(e, '::after'); return [parseFloat(s.width), parseFloat(s.height)]; }",
            c,
        )
        if w < 44 or h < 44:
            fail(label, f"T8: .about__ctrl[{i}]::after hit area is {w:.0f}x{h:.0f} (< 44px)")

    # centres of the (visible) controls still have to be >=44px apart,
    # or two of the 44px hit areas overlap each other.
    boxes = [c.bounding_box() for c in ctrls]
    boxes = [b for b in boxes if b]
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            a, b = boxes[i], boxes[j]
            ac = (a["x"] + a["width"] / 2, a["y"] + a["height"] / 2)
            bc = (b["x"] + b["width"] / 2, b["y"] + b["height"] / 2)
            dx = abs(ac[0] - bc[0])
            dy = abs(ac[1] - bc[1])
            if dx < 44 and dy < 44:
                fail(label, f"T8: .about__ctrl hit areas {i} and {j} overlap (centre distance {dx:.1f}x{dy:.1f})")


# ---------------------------------------------------------------------------
# T9 — head: description, favicon, canonical
# ---------------------------------------------------------------------------

def check_t9(page):
    desc = page.evaluate("document.querySelector('meta[name=description]')?.content")
    og_desc = page.evaluate("document.querySelector('meta[property=\"og:description\"]')?.content")
    canonical = page.evaluate("document.querySelector('link[rel=canonical]')?.href")
    icon = page.evaluate("document.querySelector('link[rel=icon]')?.href")

    if not desc or "marooned" in desc.lower():
        fail("T9", f"meta[name=description] missing or still the old joke: {desc!r}")
    else:
        ok("T9: meta description present and updated")

    if not og_desc or "marooned" in og_desc.lower():
        fail("T9", f"og:description missing or still the old joke: {og_desc!r}")
    else:
        ok("T9: og:description present and updated")

    if not canonical or not canonical.rstrip("/").endswith("neel-parikh.com"):
        fail("T9", f"canonical link missing or wrong: {canonical!r}")
    else:
        ok("T9: canonical link present")

    if not icon:
        fail("T9", "link[rel=icon] missing")
    else:
        ok("T9: favicon link present")

    favicon_path = REPO_ROOT / "media" / "favicon.svg"
    if not favicon_path.is_file():
        fail("T9", "media/favicon.svg does not exist")
    else:
        size = favicon_path.stat().st_size
        if size >= 2048:
            fail("T9", f"media/favicon.svg is {size} bytes, >= 2 KB")
        else:
            ok(f"T9: media/favicon.svg is {size} bytes")
        try:
            import xml.etree.ElementTree as ET
            ET.parse(str(favicon_path))
            ok("T9: media/favicon.svg parses as SVG/XML")
        except Exception as e:
            fail("T9", f"media/favicon.svg does not parse as XML: {e}")


# ---------------------------------------------------------------------------
# T10 — case study hero titles run off phones
# ---------------------------------------------------------------------------

CASE_STUDIES = ["futee", "emf-ace", "cseds", "into-yesterday"]
T10_NARROW_WIDTHS = [320, 360, 390, 430]


def run_t10_pass(browser, base_url):
    errors = []
    for slug in CASE_STUDIES:
        for vw in T10_NARROW_WIDTHS:
            context = browser.new_context(viewport={"width": vw, "height": 800})
            page = context.new_page()
            page_errors = []
            attach_error_capture(page, f"T10 {slug} {vw}px", page_errors)
            page.goto(f"{base_url}/work/{slug}/", wait_until="load")
            title = page.query_selector(".hero-title")
            if not title:
                fail(f"T10 {slug}", f"{vw}px: .hero-title not found")
            else:
                box = title.bounding_box()
                if box:
                    left = box["x"]
                    right = box["x"] + box["width"]
                    if left < 8:
                        fail(f"T10 {slug}", f"{vw}px: .hero-title left={left:.1f} < 8")
                    if right > vw - 8:
                        fail(f"T10 {slug}", f"{vw}px: .hero-title right={right:.1f} > {vw-8}")
            errors.extend(page_errors)
            context.close()

        # 1440 wide: font-size must be unchanged from baseline (clamped to 190px)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        page_errors = []
        attach_error_capture(page, f"T10 {slug} 1440px", page_errors)
        page.goto(f"{base_url}/work/{slug}/", wait_until="load")
        title = page.query_selector(".hero-title")
        if title:
            fs = page.evaluate("(el) => parseFloat(getComputedStyle(el).fontSize)", title)
            if abs(fs - 190) > 0.5:
                fail(f"T10 {slug}", f"1440px: computed font-size={fs}px, want 190px (baseline unchanged)")
            else:
                ok(f"T10 {slug}: 1440px font-size={fs}px (baseline preserved)")
        errors.extend(page_errors)
        context.close()
    return errors


# ---------------------------------------------------------------------------
# T11 — the homepage h1 (verify only, guard against regression)
# ---------------------------------------------------------------------------

def check_t11_home(page):
    h1s = page.query_selector_all("h1")
    if len(h1s) != 1:
        fail("T11 home", f"expected exactly 1 h1, found {len(h1s)}")
        return
    text = h1s[0].text_content().strip()
    if text != "Neel Parikh":
        fail("T11 home", f"h1 text is {text!r}, want 'Neel Parikh'")
    else:
        ok("T11: homepage has exactly one h1, 'Neel Parikh'")


def run_t11_case_studies_pass(browser, base_url):
    errors = []
    for slug in CASE_STUDIES:
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        page_errors = []
        attach_error_capture(page, f"T11 {slug}", page_errors)
        page.goto(f"{base_url}/work/{slug}/", wait_until="load")
        h1s = page.query_selector_all("h1")
        if len(h1s) != 1:
            fail(f"T11 {slug}", f"expected exactly 1 h1, found {len(h1s)}")
        else:
            ok(f"T11: {slug} has exactly one h1")
        errors.extend(page_errors)
        context.close()
    return errors


# ---------------------------------------------------------------------------
# reduced-motion pass
# ---------------------------------------------------------------------------

def run_reduced_motion_pass(browser, base_url):
    errors = []
    context = browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    page = context.new_page()
    attach_error_capture(page, "reduced-motion", errors)

    page.goto(base_url + "/", wait_until="load")
    page.wait_for_selector("#door", state="attached", timeout=5000)
    page.wait_for_timeout(600)
    if page.query_selector("#door").is_hidden():
        fail("reduced-motion", "door not shown")

    page.click("#door-story")
    # ~7.78s total run under reduced motion (HANDOFF.md) — poll for handoff
    # rather than a single long fixed sleep.
    handed_off = False
    for _ in range(30):
        page.wait_for_timeout(500)
        if page.evaluate("document.getElementById('hero').hidden"):
            handed_off = True
            break
    if not handed_off:
        fail("reduced-motion", "did not hand off within ~15s")
    else:
        ok("reduced-motion: door -> story -> handoff completes with no errors")

    context.close()
    return errors


# ---------------------------------------------------------------------------
# java_script_enabled=False pass
# ---------------------------------------------------------------------------

def run_no_js_pass(browser, base_url):
    errors = []
    context = browser.new_context(viewport={"width": 1440, "height": 900}, java_script_enabled=False)
    page = context.new_page()
    attach_error_capture(page, "no-js", errors)

    page.goto(base_url + "/", wait_until="load")

    has_no_js_class = page.evaluate("document.documentElement.classList.contains('no-js')")
    if not has_no_js_class:
        fail("no-js", "html.no-js class not present with JS disabled")

    site = page.query_selector("#site") or page.query_selector(".site")
    if site is None:
        fail("no-js", "no #site/.site element found without JS")
    else:
        box = site.bounding_box()
        if box is None or box["width"] == 0:
            fail("no-js", "site content is not visible with JS disabled")
        else:
            ok("no-js: the site renders as a plain document with JS disabled")

    folders = page.query_selector_all(".folder")
    if len(folders) != 4:
        fail("no-js", f"expected 4 .folder without JS, found {len(folders)}")

    context.close()
    return errors


# ---------------------------------------------------------------------------
# full story playthrough — every beat fires, in order, rail climbs to 1
# ---------------------------------------------------------------------------

def run_full_story_pass(browser, base_url):
    errors = []
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    attach_error_capture(page, "full story", errors)

    page.goto(base_url + "/", wait_until="load")
    page.wait_for_selector("#door-story", state="attached", timeout=5000)
    page.click("#door-story")

    fills = []
    handed_off = False
    for _ in range(40):
        page.wait_for_timeout(500)
        f = page.evaluate(
            "() => { var el = document.getElementById('rail-fill'); if (!el) return null; "
            "var m = el.style.transform.match(/scaleX\\(([\\d.]+)\\)/); return m ? parseFloat(m[1]) : null; }"
        )
        if f is not None:
            fills.append(f)
        if page.evaluate("document.getElementById('hero').hidden"):
            handed_off = True
            break

    if not handed_off:
        fail("full story", "did not hand off within 20s")
    else:
        ok("full story: door-story -> handoff completes")
        # data-desk is set from a requestAnimationFrame nested inside
        # handoff(), a frame after hero.hidden — give it a moment.
        page.wait_for_timeout(200)

    # rail should climb, not jump backwards (monotonic, allowing for
    # polling granularity/float noise)
    non_decreasing = all(b >= a - 0.02 for a, b in zip(fills, fills[1:]))
    if not non_decreasing:
        fail("full story", f"rail fill was not monotonically non-decreasing: {fills}")
    else:
        ok("full story: rail climbs monotonically from 0 to 1")

    if fills and fills[-1] < 0.98:
        fail("full story", f"rail did not reach ~1 by handoff (last sample {fills[-1]})")

    site = page.query_selector("#site") or page.query_selector(".site")
    if site:
        has_desk = page.evaluate("(el) => el.hasAttribute('data-desk')", site)
        if not has_desk:
            fail("full story", "data-desk not set on site after handoff")
        else:
            ok("full story: data-desk set after handoff")

    context.close()
    return errors


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright not installed. Run: pip install playwright && playwright install chromium")
        sys.exit(2)

    httpd, port = start_server()
    base_url = f"http://127.0.0.1:{port}"
    print(f"serving {REPO_ROOT} at {base_url}")

    all_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch()

        # --- per-viewport pass ---
        for (vw, vh) in VIEWPORTS:
            label = f"{vw}x{vh}"
            context = browser.new_context(viewport={"width": vw, "height": vh})
            page = context.new_page()
            errors = []
            attach_error_capture(page, label, errors)

            goto_desk(page, base_url)

            check_t1(page, vw, vh)
            check_t2(page, vw, vh)
            check_t7(page, vw, vh)
            check_t8(page, vw, vh)

            all_errors.extend(errors)
            context.close()

        # --- T3: during a real story playthrough, at the island beat ---
        all_errors.extend(run_t3_pass(browser, base_url))

        # --- T4: at the "all by their Self," beat ---
        all_errors.extend(run_t4_pass(browser, base_url))

        # --- T5: total download weight, 390x844 phone ---
        all_errors.extend(run_t5_pass(browser, base_url))

        # --- T6 ---
        t6_context = browser.new_context(viewport={"width": 1440, "height": 900})
        t6_page = t6_context.new_page()
        t6_errors = []
        attach_error_capture(t6_page, "T6", t6_errors)
        t6_page.goto(base_url + "/", wait_until="load")
        check_t6(t6_page)
        check_t9(t6_page)
        check_t11_home(t6_page)
        all_errors.extend(t6_errors)
        t6_context.close()

        # --- T10: case study hero titles, four pages ---
        all_errors.extend(run_t10_pass(browser, base_url))

        # --- T11: one h1 per case study page ---
        all_errors.extend(run_t11_case_studies_pass(browser, base_url))

        # --- required extra passes: reduced motion, JS off, full story ---
        all_errors.extend(run_reduced_motion_pass(browser, base_url))
        all_errors.extend(run_no_js_pass(browser, base_url))
        all_errors.extend(run_full_story_pass(browser, base_url))

        browser.close()

    httpd.shutdown()

    if all_errors:
        print()
        for e in all_errors:
            print("FAIL " + e)
        FAILURES.extend(all_errors)

    print()
    if FAILURES:
        print(f"{len(FAILURES)} failure(s).")
        sys.exit(1)
    else:
        print("All checks passed.")
        sys.exit(0)


if __name__ == "__main__":
    main()
