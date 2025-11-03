/* ====== state ====== */
let split      = [];           // [ {day, exercises[]}, ... ]
let history    = [];           // [ {date, day, exercise, sets[]}, ... ]
let activeDay  = 0;

/* ====== init ====== */
document.getElementById('buildSplitBtn').onclick = buildSplit;
document.getElementById('saveSessionBtn').onclick = saveSession;
document.getElementById('exportBtn').onclick     = exportCSV;
document.getElementById('clearBtn').onclick      = ()=>{
  if(confirm('Delete everything?')){ localStorage.clear(); location.reload(); }
};
loadFromStorage();
renderHistory();

/* ====== core ====== */
function buildSplit(){
  const raw = document.getElementById('splitInput').value.trim();
  if(!raw){ alert('Paste your split first'); return; }
  split = raw.split('\n').map(line=>{
    const [day, rest] = line.split('–').map(s=>s.trim());
    return { day, exercises: rest.split(',').map(e=>e.trim()) };
  });
  localStorage.setItem('split', JSON.stringify(split));
  document.getElementById('setup').hidden = true;
  document.getElementById('logger').hidden = false;
  renderDayPicker();
  renderExercises(0);
}
function renderDayPicker(){
  const box = document.getElementById('dayPicker');
  box.innerHTML = '';
  split.forEach((d,idx)=>{
    const tab = document.createElement('span');
    tab.className = 'day-tab' + (idx===activeDay?' active':'');
    tab.textContent = d.day;
    tab.onclick = ()=>{ activeDay=idx; renderExercises(idx); renderDayPicker(); };
    box.appendChild(tab);
  });
}
function renderExercises(dayIdx){
  const container = document.getElementById('exerciseList');
  container.innerHTML = '';
  split[dayIdx].exercises.forEach(ex=>{
    const block = document.createElement('div');
    block.innerHTML = `<h4>${ex}</h4>`;
    for(let i=0;i<3;i++){  // default 3 sets
      const row = document.createElement('div'); row.className='set-row';
      row.innerHTML = `
        <label>Set ${i+1}</label>
        <input type="number" placeholder="kg" data-ex="${ex}" data-set="${i}" class="wt"/>
        <input type="number" placeholder="reps" data-ex="${ex}" data-set="${i}" class="rp"/>
      `;
      block.appendChild(row);
    }
    container.appendChild(block);
  });
}
function saveSession(){
  const date = new Date().toLocaleDateString();
  const dayName = split[activeDay].day;
  split[activeDay].exercises.forEach(ex=>{
    const sets = [];
    document.querySelectorAll(`input[data-ex="${ex}"].wt`).forEach((wtInput,idx)=>{
      const w = wtInput.value, r = wtInput.nextElementSibling.value;
      if(w && r) sets.push({w:+w, r:+r});
    });
    if(sets.length) history.push({date, day:dayName, exercise:ex, sets});
  });
  saveToStorage();
  renderHistory();
  alert('Session saved');
}
function renderHistory(){
  const box = document.getElementById('historyTable');
  if(!history.length){ box.innerHTML='<p>No sessions yet</p>'; return; }
  let html = '<table border="1" cellpadding="4"><tr><th>Date</th><th>Day</th><th>Exercise</th><th>Sets</th></tr>';
  history.slice().reverse().forEach(entry=>{
    const sets = entry.sets.map(s=>`${s.w}×${s.r}`).join(', ');
    html += `<tr><td>${entry.date}</td><td>${entry.day}</td><td>${entry.exercise}</td><td>${sets}</td></tr>`;
  });
  html += '</table>';
  box.innerHTML = html;
}
function exportCSV(){
  if(!history.length){ alert('Nothing to export'); return; }
  let csv = 'Date,Day,Exercise,Weight,Reps\n';
  history.forEach(e=>{
    e.sets.forEach(s=> csv += `${e.date},${e.day},${e.exercise},${s.w},${s.r}\n`);
  });
  const blob = new Blob([csv], {type:'text/csv'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download='lift_history.csv'; a.click();
}
/* ====== storage ====== */
function saveToStorage(){
  localStorage.setItem('history', JSON.stringify(history));
}
function loadFromStorage(){
  if(localStorage.getItem('split')) {
    split = JSON.parse(localStorage.getItem('split'));
    document.getElementById('setup').hidden = true;
    document.getElementById('logger').hidden = false;
    renderDayPicker();
    renderExercises(0);
  }
  if(localStorage.getItem('history')) history = JSON.parse(localStorage.getItem('history'));
}
