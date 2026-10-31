/**
 * Receiver for the /dive reaction tab (js/dive-reactions.js).
 * Every Like / Love it / Not for me becomes one row in a Google Sheet.
 *
 * SETUP — about five minutes, once:
 *   1. Make a new Google Sheet, e.g. "neel-parikh.com — dive reactions".
 *   2. Extensions › Apps Script. Delete what is there, paste this whole file, Save.
 *   3. Deploy › New deployment › type "Web app".
 *        Execute as:     Me
 *        Who has access: Anyone
 *      Deploy, approve the permissions, copy the Web app URL
 *      (https://script.google.com/macros/s/…/exec).
 *   4. Paste that URL into REACTIONS_ENDPOINT in scripts/build-dive.py,
 *      run  python3 scripts/build-dive.py  and push.
 *
 * Opening the /exec URL in a browser shows a running tally, which is a
 * quick way to check it is live.
 *
 * Nothing personal is collected: page, section, reaction, what it was on
 * (a folder, an image, a section heading), how (tab, double-tap, key), time, a random
 * per-browser id (so one visitor's answers can be read together),
 * viewport size and referrer.
 */

var SHEET = 'Reactions';
var HEADERS = ['received', 'at (visitor clock)', 'page', 'section', 'label',
               'reaction', 'target', 'via', 'visitor', 'viewport', 'referrer'];
var REACTIONS = { like: 1, love: 1, meh: 1 };

function sheet_() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sh = book.getSheetByName(SHEET) || book.insertSheet(SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function clip_(v, n) { return String(v == null ? '' : v).slice(0, n); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!REACTIONS[d.reaction]) return ContentService.createTextOutput('ignored');
    sheet_().appendRow([
      new Date(),
      clip_(d.at, 40),
      clip_(d.page, 60),
      clip_(d.section, 40),
      clip_(d.label, 80),
      d.reaction,
      clip_(d.target, 120),
      clip_(d.via, 20),
      clip_(d.visitor, 20),
      clip_(d.viewport, 20),
      clip_(d.referrer, 200)
    ]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  var rows = sheet_().getDataRange().getValues().slice(1);
  var tally = {};
  rows.forEach(function (r) {
    var k = r[2] + ' · ' + r[3];
    tally[k] = tally[k] || { like: 0, love: 0, meh: 0 };
    tally[k][r[5]] = (tally[k][r[5]] || 0) + 1;
  });
  var lines = Object.keys(tally).sort().map(function (k) {
    var t = tally[k];
    return k + '   like ' + t.like + '   love ' + t.love + '   not for me ' + t.meh;
  });
  return ContentService.createTextOutput(
    rows.length + ' reactions\n\n' + (lines.join('\n') || 'none yet'));
}
