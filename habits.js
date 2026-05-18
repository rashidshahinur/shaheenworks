/* ══════════════════════════════════
   CONSTANTS
══════════════════════════════════ */
const STORAGE_PW     = 'h-password';
const STORAGE_HABITS = 'shaheen-habits-v1';
const STORAGE_THEME  = 'h-theme';
const SESSION_AUTH   = 'h-auth';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];


/* ══════════════════════════════════
   HELPERS
══════════════════════════════════ */

// Local date string — avoids UTC timezone issues (important for Bangladesh UTC+6)
function localDateStr(date) {
  const d = date || new Date();
  return d.getFullYear()
    + '-' + String(d.getMonth() + 1).padStart(2, '0')
    + '-' + String(d.getDate()).padStart(2, '0');
}

const TODAY = localDateStr();


/* ══════════════════════════════════
   AUTO EMOJI
   Add more keywords here as you add new habits.
══════════════════════════════════ */
function getEmoji(name) {
  const n = name.toLowerCase();
  if (n.includes('duolingo') || n.includes('language'))                          return '🦉';
  if (n.includes('dumble') || n.includes('dumbbell'))                            return '🏋️';
  if (n.includes('gym') || n.includes('workout') || n.includes('exercise') || n.includes('pushup')) return '💪';
  if (n.includes('run') || n.includes('jog'))                                    return '🏃';
  if (n.includes('walk'))                                                        return '🚶';
  if (n.includes('swim'))                                                        return '🏊';
  if (n.includes('yoga') || n.includes('stretch') || n.includes('medit'))       return '🧘';
  if (n.includes('read') || n.includes('book'))                                  return '📚';
  if (n.includes('write') || n.includes('journal') || n.includes('diary'))      return '✍️';
  if (n.includes('water') || n.includes('drink'))                               return '💧';
  if (n.includes('sleep') || n.includes('bed'))                                 return '😴';
  if (n.includes('pray') || n.includes('namaz') || n.includes('salah'))         return '🤲';
  if (n.includes('morning'))                                                     return '🌅';
  if (n.includes('night') || n.includes('evening'))                             return '🌙';
  if (n.includes('code') || n.includes('program') || n.includes('coding'))      return '💻';
  if (n.includes('music') || n.includes('guitar') || n.includes('piano') || n.includes('sing')) return '🎵';
  if (n.includes('cook') || n.includes('food'))                                 return '🍳';
  if (n.includes('vitamin') || n.includes('medicine') || n.includes('pill'))    return '💊';
  if (n.includes('fast') || n.includes('fasting'))                              return '⏱️';
  if (n.includes('diet') || n.includes('sugar') || n.includes('healthy'))       return '🥗';
  if (n.includes('study') || n.includes('learn'))                               return '📖';
  if (n.includes('gratitude') || n.includes('thank'))                           return '🙏';
  if (n.includes('cold') || n.includes('shower'))                               return '🚿';
  if (n.includes('breath'))                                                      return '🫁';
  if (n.includes('draw') || n.includes('sketch') || n.includes('paint'))        return '🎨';
  if (n.includes('photo'))                                                       return '📷';
  if (n.includes('no phone') || n.includes('screen'))                           return '📵';
  return '✨';
}


/* ══════════════════════════════════
   STATE
══════════════════════════════════ */
let habits           = [];
let pendingDelete    = null;
let sortableInstance = null;

const nowDate = new Date();
let viewYear  = nowDate.getFullYear();
let viewMonth = nowDate.getMonth();


/* ══════════════════════════════════
   AUTH — password lives in localStorage, never in code
══════════════════════════════════ */
function initAuth() {
  const saved = localStorage.getItem(STORAGE_PW);
  if (!saved) {
    document.getElementById('setup').style.display = 'flex';
  } else if (sessionStorage.getItem(SESSION_AUTH) === '1') {
    showApp();
  } else {
    document.getElementById('lock').style.display = 'flex';
  }
}

function saveNewPassword() {
  const pw1 = document.getElementById('setupPw1').value;
  const pw2 = document.getElementById('setupPw2').value;
  const err = document.getElementById('setupErr');
  if (!pw1)           { err.textContent = 'Please enter a password.'; return; }
  if (pw1 !== pw2)    { err.textContent = 'Passwords do not match.'; return; }
  if (pw1.length < 4) { err.textContent = 'At least 4 characters please.'; return; }
  localStorage.setItem(STORAGE_PW, pw1);
  sessionStorage.setItem(SESSION_AUTH, '1');
  document.getElementById('setup').style.display = 'none';
  err.textContent = '';
  showApp();
}

function unlock() {
  const entered = document.getElementById('pwInput').value;
  const saved   = localStorage.getItem(STORAGE_PW);
  const err     = document.getElementById('pwErr');
  if (entered === saved) {
    sessionStorage.setItem(SESSION_AUTH, '1');
    err.textContent = '';
    document.getElementById('lock').style.display = 'none';
    showApp();
  } else {
    err.textContent = 'Wrong password.';
    document.getElementById('pwInput').value = '';
    document.getElementById('pwInput').focus();
  }
}

function logout() {
  sessionStorage.removeItem(SESSION_AUTH);
  document.getElementById('app').style.display  = 'none';
  document.getElementById('lock').style.display = 'flex';
  document.getElementById('pwInput').value      = '';
  document.getElementById('pwErr').textContent  = '';
}

function showApp() {
  document.getElementById('lock').style.display = 'none';
  document.getElementById('app').style.display  = 'block';
  applyTheme();
  setGreeting();
  loadHabits();
}

document.getElementById('setupPw2').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') saveNewPassword();
});

document.getElementById('pwInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') unlock();
});


/* ══════════════════════════════════
   CHANGE PASSWORD
══════════════════════════════════ */
function openChangePw() {
  document.getElementById('cpCurrent').value   = '';
  document.getElementById('cpNew1').value      = '';
  document.getElementById('cpNew2').value      = '';
  document.getElementById('cpErr').textContent = '';
  document.getElementById('changePwOverlay').classList.add('open');
}

function closeChangePw() {
  document.getElementById('changePwOverlay').classList.remove('open');
}

function doChangePw() {
  const current = document.getElementById('cpCurrent').value;
  const new1    = document.getElementById('cpNew1').value;
  const new2    = document.getElementById('cpNew2').value;
  const err     = document.getElementById('cpErr');
  const saved   = localStorage.getItem(STORAGE_PW);
  if (current !== saved)  { err.textContent = 'Current password is wrong.'; return; }
  if (!new1)              { err.textContent = 'Enter a new password.'; return; }
  if (new1 !== new2)      { err.textContent = 'New passwords do not match.'; return; }
  if (new1.length < 4)    { err.textContent = 'At least 4 characters please.'; return; }
  localStorage.setItem(STORAGE_PW, new1);
  err.textContent = '';
  closeChangePw();
}


/* ══════════════════════════════════
   THEME
══════════════════════════════════ */
function applyTheme() {
  const t = localStorage.getItem(STORAGE_THEME) || 'light';
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('themeBtn').textContent = t === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  localStorage.setItem(STORAGE_THEME, cur === 'dark' ? 'light' : 'dark');
  applyTheme();
}


/* ══════════════════════════════════
   GREETING
══════════════════════════════════ */
function setGreeting() {
  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greetLine').textContent = greet + ', Shaheen.';
  document.getElementById('greetDate').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
}


/* ══════════════════════════════════
   MONTH NAVIGATION
══════════════════════════════════ */
function prevMonth() {
  if (viewMonth === 0) { viewMonth = 11; viewYear--; } else viewMonth--;
  render();
}

function nextMonth() {
  if (viewMonth === 11) { viewMonth = 0; viewYear++; } else viewMonth++;
  render();
}


/* ══════════════════════════════════
   STREAK
══════════════════════════════════ */
function getStreak(checkins) {
  if (!checkins || checkins.length === 0) return 0;
  const set    = new Set(checkins);
  let   count  = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!set.has(TODAY)) cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < 730; i++) {
    const ds = localDateStr(cursor);
    if (set.has(ds)) { count++; cursor.setDate(cursor.getDate() - 1); }
    else break;
  }
  return count;
}


/* ══════════════════════════════════
   CALENDAR RENDERER
══════════════════════════════════ */
function renderCalendar(habit) {
  const set         = new Set(habit.checkins);
  const firstDayJS  = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = firstDayJS === 0 ? 6 : firstDayJS - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const todayObj   = new Date();
  const todayYear  = todayObj.getFullYear();
  const todayMonth = todayObj.getMonth();
  const todayDate  = todayObj.getDate();

  let html = '<div class="cal-grid">';

  ['M','T','W','T','F','S','S'].forEach(function(l) {
    html += '<div class="cal-hdr">' + l + '</div>';
  });

  for (let i = 0; i < startOffset; i++) {
    html += '<div class="cal-cell empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const ds = viewYear
      + '-' + String(viewMonth + 1).padStart(2, '0')
      + '-' + String(d).padStart(2, '0');

    const isDone  = set.has(ds);
    const isToday = (viewYear === todayYear && viewMonth === todayMonth && d === todayDate);

    const cellDate = new Date(viewYear, viewMonth, d);
    cellDate.setHours(0, 0, 0, 0);
    const isFuture = cellDate > todayObj;

    let cls = 'cal-cell';
    if (isDone)   cls += ' done';
    if (isToday)  cls += ' today';
    if (isFuture) cls += ' future';

    const click = isFuture ? '' : 'onclick="toggleDate(\'' + habit.id + '\',\'' + ds + '\')"';
    const label = isDone ? '✕' : d;

    html += '<div class="' + cls + '" ' + click + '>' + label + '</div>';
  }

  html += '</div>';
  return html;
}


/* ══════════════════════════════════
   DRAG TO REORDER (Sortable.js)
══════════════════════════════════ */
function initSortable() {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }

  sortableInstance = Sortable.create(document.getElementById('habitGrid'), {
    handle:      '.drag-handle',
    animation:   200,
    ghostClass:  'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: function(evt) {
      if (evt.oldIndex === evt.newIndex) return;
      const moved = habits.splice(evt.oldIndex, 1)[0];
      habits.splice(evt.newIndex, 0, moved);
      saveHabits();
    }
  });
}


/* ══════════════════════════════════
   DATA
══════════════════════════════════ */
function loadHabits() {
  const raw = localStorage.getItem(STORAGE_HABITS);
  habits = raw ? JSON.parse(raw) : [];
  if (habits.length === 0) {
    habits = [{ id: '1', name: 'Duolingo', checkins: [] }];
    saveHabits();
  }
  render();
}

function saveHabits() {
  localStorage.setItem(STORAGE_HABITS, JSON.stringify(habits));
}


/* ══════════════════════════════════
   ACTIONS
══════════════════════════════════ */
function toggleToday(id) { toggleDate(id, TODAY); }

function toggleDate(id, ds) {
  const habit = habits.find(function(h) { return h.id === id; });
  if (!habit) return;
  if (habit.checkins.includes(ds)) {
    habit.checkins = habit.checkins.filter(function(d) { return d !== ds; });
  } else {
    habit.checkins.push(ds);
  }
  saveHabits();
  render();
}

function addHabit() {
  const input = document.getElementById('addInput');
  const name  = input.value.trim();
  if (!name) return;
  habits.push({ id: Date.now().toString(), name: name, checkins: [] });
  input.value = '';
  saveHabits();
  render();
}

document.getElementById('addInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') addHabit();
});

function askDelete(id, name) {
  pendingDelete = id;
  document.getElementById('confirmMsg').textContent =
    'Delete "' + name + '"? All your streak history will be gone forever.';
  document.getElementById('confirmOverlay').classList.add('open');
}

function closeConfirm() {
  pendingDelete = null;
  document.getElementById('confirmOverlay').classList.remove('open');
}

function doDelete() {
  if (!pendingDelete) return;
  habits = habits.filter(function(h) { return h.id !== pendingDelete; });
  saveHabits();
  closeConfirm();
  render();
}


/* ══════════════════════════════════
   RENDER
══════════════════════════════════ */
function render() {
  document.getElementById('monthLabel').textContent =
    MONTH_NAMES[viewMonth] + ' ' + viewYear;

  const doneToday = habits.filter(function(h) { return h.checkins.includes(TODAY); }).length;
  const total     = habits.length;
  const pct       = total > 0 ? Math.round((doneToday / total) * 100) : 0;

  document.getElementById('doneCount').textContent    = doneToday;
  document.getElementById('totalCount').textContent   = total;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('doneMsg').style.display    =
    (doneToday === total && total > 0) ? 'block' : 'none';

  const grid = document.getElementById('habitGrid');

  if (habits.length === 0) {
    grid.innerHTML = '<p class="empty-state">No habits yet — add your first one below.</p>';
    return;
  }

  grid.innerHTML = habits.map(function(h) {
    const isTodayDone = h.checkins.includes(TODAY);
    const streak      = getStreak(h.checkins);
    const unit        = streak === 1 ? 'day' : 'days';
    const emoji       = getEmoji(h.name);
    const safeName    = h.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    return (
      '<div class="habit-card ' + (isTodayDone ? 'checked' : '') + '" data-id="' + h.id + '">' +
        '<div class="card-top">' +
          '<span class="drag-handle" title="Drag to reorder">⠿</span>' +
          '<button' +
          ' class="check-btn ' + (isTodayDone ? 'done' : '') + '"' +
          ' onclick="toggleToday(\'' + h.id + '\')"' +
          ' aria-label="' + (isTodayDone ? 'Uncheck' : 'Check') + ' ' + h.name + '"' +
          '>' + (isTodayDone ? '✓' : emoji) + '</button>' +
          '<span class="habit-name">' + h.name + '</span>' +
          '<div class="streak-col">' +
            '<span class="streak-num ' + (streak === 0 ? 'zero' : '') + '">' + (streak === 0 ? '—' : streak) + '</span>' +
            '<span class="streak-unit">' + unit + '</span>' +
          '</div>' +
          '<button class="del-btn" onclick="askDelete(\'' + h.id + '\', \'' + safeName + '\')" aria-label="Delete">✕</button>' +
        '</div>' +
        '<div class="cal-wrap">' + renderCalendar(h) + '</div>' +
      '</div>'
    );
  }).join('');

  initSortable();
}


/* ══════════════════════════════════
   START
══════════════════════════════════ */
initAuth();
