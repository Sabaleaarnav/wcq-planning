const $ = (s) => document.querySelector(s);
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL = (value) => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : '#'; } catch { return '#'; } };
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const statuses = ['To do', 'In progress', 'Blocked', 'Done'];
let plan, tasks = [], page = 'overview', view = 'list';
let filters = { query: '', status: '', day: '', owner: '' };
const today = () => new Intl.DateTimeFormat('en-CA', {timeZone:'America/Indiana/Indianapolis',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const localDate = d => new Date(`${d}T12:00:00`);
const shortDate = d => d ? localDate(d).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'Not set';
const overdue = t => t.status !== 'Done' && t.due && t.due < today();
const statusClass = s => s.toLowerCase().replaceAll(' ','-');
const badge = t => `<span class="status ${statusClass(t.status)}">${esc(t.status)}</span>`;
const percent = ts => ts.length ? Math.round(ts.filter(t=>t.status==='Done').length / ts.length * 100) : 0;
const progress = ts => `<div class="progress" role="progressbar" aria-label="Task completion" aria-valuenow="${percent(ts)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent(ts)}%"></span></div>`;
const dayTasks = d => tasks.filter(t => t.day === d);
const taskLink = t => safeURL(t.url);
const byPriority = (a,b) => ({High:0,Medium:1,Low:2}[a.priority]??1)-({High:0,Medium:1,Low:2}[b.priority]??1) || (a.due||'9999').localeCompare(b.due||'9999') || a.id-b.id;

async function load() {
  $('#refresh').disabled = true;
  try {
    const response = await fetch(`data.json?t=${Date.now()}`, {cache:'no-store'});
    if (!response.ok) throw new Error(`Could not load task data (${response.status}).`);
    const next = await response.json();
    if (!next.plan || !Array.isArray(next.tasks)) throw new Error('The plan data is incomplete.');
    plan = next.plan; tasks = next.tasks;
    $('#repo-link').href = safeURL(plan.repositoryURL);
    $('#source-link').href = safeURL(plan.sources[0].url);
    $('#nav-count').textContent = tasks.length;
    const stamp = new Date(next.updatedAt);
    $('#sync-status').textContent = Number.isNaN(stamp.valueOf()) ? 'Saved plan' : `Snapshot · ${stamp.toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/Indiana/Indianapolis'})}`;
    $('#sync-status').title = 'Task snapshot generated from GitHub Issues. Refresh loads the latest published snapshot.';
    $('#loading').hidden = true; $('#content').hidden = false;
    render();
  } catch (error) {
    $('#sync-status').textContent = 'Refresh failed';
    if (!plan) $('#loading').innerHTML = `<div class="error">${esc(error.message)} <button class="button" data-retry>Try again</button></div>`;
  } finally { $('#refresh').disabled = false; }
}

function header(title, desc, extra='') {
  return `<div class="page-head"><div><p class="eyebrow">WHITE CARNATION QUEEN / ${esc(plan.dateLabel)}</p><h1>${title}</h1><p>${desc}</p></div><div class="actions">${extra}<a class="button primary" href="${safeURL(plan.repositoryURL+'/issues/new?template=task.yml')}" target="_blank" rel="noopener">＋ Add task</a></div></div>`;
}
function render() {
  $('#breadcrumb').textContent = `Workspace / ${{overview:'Overview',tasks:'All tasks',week:'Event week',notes:'Planning notes'}[page]}`;
  document.querySelectorAll('[data-nav]').forEach(b=>{b.classList.toggle('active',b.dataset.nav===page);if(b.dataset.nav===page)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  $('#content').innerHTML = ({overview:overviewPage,tasks:tasksPage,week:weekPage,notes:notesPage})[page]();
  if (page==='tasks') {
    $('#search-tasks').value=filters.query;
    $('#status-filter').value=filters.status;
    $('#day-filter').value=filters.day;
    $('#owner-filter').value=filters.owner;
  }
}
function navigate(next) { page=next; history.replaceState(null,'',`#${page}`); render(); window.scrollTo({top:0,behavior:'instant'}); }
function row(t) {return `<button class="list-row" data-task="${t.id}"><span class="row-number">${t.id ? '#'+t.id : '—'}</span><span class="row-copy"><strong>${esc(t.title)}</strong><small>${esc(t.day)} · ${esc(t.owner||'Unassigned')}${t.due?' · '+shortDate(t.due):''}</small></span>${badge(t)}</button>`;}
function overviewPage() {
  const done = tasks.filter(t=>t.status==='Done').length;
  const open = tasks.filter(t=>t.status!=='Done');
  const decisions = tasks.filter(t=>t.area==='Decisions' && t.status!=='Done');
  const unassigned = open.filter(t=>!t.owner||t.owner==='Unassigned').length;
  const late = open.filter(overdue).length;
  const start=localDate(plan.startDate); const now=localDate(today());
  const days=Math.round((start-now)/86400000);
  const countdown=days>0?`${days}`:today()<=plan.endDate?'Live':'Ended';
  const next=open.filter(t=>t.area!=='Decisions').sort(byPriority).slice(0,5);
  return header('Planning overview.','Track what’s ready, what needs a decision, and who’s taking the next step.',`<button class="button" data-help>How to update ↗</button>`)+
  `<section class="summary" aria-label="Planning summary"><div class="metric"><span class="label">Preparation complete</span><strong>${percent(tasks)}<span style="font-size:17px">%</span></strong><small>${done} of ${tasks.length} tasks done</small>${progress(tasks)}</div><div class="metric"><span class="label">${days>0?'Days until event week':'Event week'}</span><strong>${countdown}</strong><small>${esc(plan.dateLabel)}</small></div><div class="metric"><span class="label">Open decisions</span><strong>${decisions.length}</strong><small>Need an answer to move forward</small></div><div class="metric"><span class="label">Needs an owner</span><strong>${unassigned}</strong><small>${late?late+' tasks overdue':'Open tasks without an owner'}</small></div></section>
  <div class="attention"><span class="eyebrow">WHERE WE STAND</span><p>${open.length} tasks open · ${unassigned} need an owner · ${open.filter(t=>t.status==='Blocked').length} blocked. ${esc(plan.dateNote)}</p></div>
  <section aria-labelledby="week-heading"><div class="section-title"><div><h2 id="week-heading">Five days, at a glance.</h2><p>The working lineup from your planning doc.</p></div><button class="text-button" data-go="week">View event week ↗</button></div><div class="week-grid">${plan.days.map((d,i)=>{const ts=dayTasks(dayNames[i]);return `<button class="day" data-day="${dayNames[i]}"><span class="date">${dayNames[i].slice(0,3).toUpperCase()} · NOV</span><span class="day-no">${localDate(d.date).getDate()}</span><h3>${esc(d.title)}</h3><small>${ts.filter(t=>t.status==='Done').length}/${ts.length} prep tasks complete</small>${progress(ts)}</button>`;}).join('')}</div></section>
  <div class="columns"><section><div class="section-title"><h2>Next up</h2><button class="text-button" data-go="tasks">All tasks ↗</button></div>${next.map(row).join('')||'<p class="empty">All preparation tasks are complete.</p>'}</section><section><div class="section-title"><h2>Decisions to make</h2></div>${decisions.slice(0,4).map(row).join('')||'<p class="empty">No open decisions.</p>'}</section></div>
  <div class="columns"><section><div class="section-title"><h2>House confirmations</h2><button class="text-button" data-go="notes">Planning notes ↗</button></div>${plan.houses.confirmed.map(h=>`<div class="roster-row"><span>${esc(h.house)}</span><small>${esc(h.liaison)} · noted yes</small></div>`).join('')}<p class="note">${esc(plan.houses.note)}</p></section><section><div class="section-title"><h2>Already in place</h2></div>${tasks.filter(t=>t.status==='Done').map(row).join('')}<p class="note">These are documented preparation milestones. Other tasks stay open until someone verifies completion.</p></section></div>`;
}
function filteredTasks(){return tasks.filter(t=>(!filters.query||`${t.title} ${t.notes} ${t.owner} ${t.area}`.toLowerCase().includes(filters.query.toLowerCase()))&&(!filters.status||(filters.status==='Overdue'?overdue(t):t.status===filters.status))&&(!filters.day||t.day===filters.day)&&(!filters.owner||(t.owner||'Unassigned')===filters.owner)).sort((a,b)=>(a.status==='Done')-(b.status==='Done')||byPriority(a,b));}
function taskResults(){const ts=filteredTasks();return `<p class="note" role="status">${ts.length} of ${tasks.length} tasks${filters.day?' · '+esc(filters.day):''}</p>`+(view==='board'?board(ts):table(ts));}
function tasksPage(){const owners=[...new Set(tasks.map(t=>t.owner||'Unassigned'))].sort();return header('All tasks.','A shared task list for the whole week. Open any task for context and updates.',`<button class="button" data-help>How to update ↗</button>`)+`<div class="task-toolbar"><label class="sr-only" for="search-tasks">Search tasks</label><input id="search-tasks" type="search" placeholder="Search tasks, owners, notes…"><select id="status-filter" aria-label="Filter by status"><option value="">All statuses</option>${[...statuses,'Overdue'].map(s=>`<option>${s}</option>`).join('')}</select><select id="day-filter" aria-label="Filter by event day"><option value="">All days</option>${['All week',...dayNames].map(d=>`<option>${d}</option>`).join('')}</select><select id="owner-filter" aria-label="Filter by owner"><option value="">All owners</option>${owners.map(o=>`<option>${esc(o)}</option>`).join('')}</select><div class="view-switch" aria-label="Task view"><button data-view="list" class="${view==='list'?'active':''}" aria-pressed="${view==='list'}">List</button><button data-view="board" class="${view==='board'?'active':''}" aria-pressed="${view==='board'}">Board</button></div><button class="text-button" data-clear>Clear</button><button class="text-button" data-export>Export CSV ↓</button></div><div id="task-results">${taskResults()}</div>`;}
function table(ts){return ts.length?`<div class="task-table-wrap"><table class="task-table"><thead><tr><th scope="col">Task</th><th scope="col">Status</th><th scope="col">Owner</th><th scope="col">Due</th><th scope="col">Priority</th></tr></thead><tbody>${ts.map(t=>`<tr><td><button class="task-title" data-task="${t.id}">${esc(t.title)}<small>#${t.id} · ${esc(t.day)} · ${esc(t.area)}</small></button></td><td>${badge(t)}</td><td>${esc(t.owner||'Unassigned')}</td><td class="${overdue(t)?'overdue':''}">${shortDate(t.due)}</td><td><span class="priority ${t.priority==='High'?'high':''}">${esc(t.priority)}</span></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No tasks match these filters. Try clearing a filter.</div>';}
function board(ts){return `<div class="board">${statuses.map(s=>`<section class="board-column" aria-label="${s}"><div class="board-heading"><span>${s}</span><span>${ts.filter(t=>t.status===s).length}</span></div>${ts.filter(t=>t.status===s).map(t=>`<button class="task-card" data-task="${t.id}"><small>${esc(t.day)} · #${t.id}</small><strong>${esc(t.title)}</strong><div class="card-meta"><small>${esc(t.owner||'Unassigned')}</small><small class="${overdue(t)?'overdue':''}">${shortDate(t.due)}</small></div></button>`).join('')||'<p class="empty">No tasks</p>'}</section>`).join('')}</div><p class="note">Open a task to update its shared status on GitHub.</p>`;}
function weekPage(){return header('Event week.','The five-day plan and the preparation behind each event.')+`<p class="note">${esc(plan.dateNote)} Event times and venues still need confirmation.</p>`+plan.days.map((d,i)=>`<section class="week-section"><div class="week-section-head"><div class="large-date">${localDate(d.date).getDate()}</div><div><p class="eyebrow">${dayNames[i]} · NOVEMBER</p><h2>${esc(d.title)}</h2><p>${esc(d.description)}</p>${d.tentative?'<span class="tag">PART OF PLAN STILL TENTATIVE</span>':''}</div></div>${dayTasks(dayNames[i]).map(row).join('')}</section>`).join('');}
function notesPage(){return header('The planning notes.','The facts carried over from Drive, with loose ends kept visible.')+`<div class="notes-grid"><section class="notes-block"><h2>Participating houses</h2>${plan.houses.confirmed.map(h=>`<div class="roster-row"><span>${esc(h.house)}</span><small>${esc(h.liaison)} · noted yes</small></div>`).join('')}<p class="note">${esc(plan.houses.note)}</p><p><strong>Also listed as likely:</strong> ${esc(plan.houses.likely.join(', '))}.</p><p><strong>Follow-up list:</strong> ${esc(plan.houses.followUp.join(', '))}.</p></section><section class="notes-block"><h2>Shirts</h2><div class="size-row">${Object.entries(plan.shirts.sizes).map(([s,n])=>`<div><strong>${n}</strong><small>${s}</small></div>`).join('')}</div><p>${plan.shirts.total} shirts recorded in the planning doc. This is a size count; an order and delivery are not confirmed.</p><h3>Ideas still under consideration</h3><ul>${plan.ideas.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section class="notes-block"><h2>Scavenger hunt</h2><p>${esc(plan.scavenger.summary)}</p><ul>${plan.scavenger.openQuestions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul><p class="note">No checkpoint locations, trivia answers, or personal contact details are included here.</p></section><section class="notes-block"><h2>Source documents</h2>${plan.sources.map(s=>`<a class="document" href="${safeURL(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗<small>${esc(s.description)}</small></a>`).join('')}<p class="note">Drive permissions still apply. Source docs were read on ${esc(plan.sourceReadDate)}. Later edits in Drive are not automatically imported; keep task updates in GitHub.</p><h3>Dates and ownership</h3><p>${esc(plan.dateNote)} Task deadlines are blank unless explicitly confirmed. House liaisons are shown from the doc; they are not automatically assigned as task owners.</p></section></div>`;}
function openTask(id){const t=tasks.find(x=>x.id===Number(id));if(!t)return;$('#detail-content').innerHTML=`<p class="eyebrow">TASK #${t.id} / ${esc(t.day)}</p><h2 id="detail-title">${esc(t.title)}</h2>${badge(t)}<div class="meta-grid"><div><small>Owner</small><span>${esc(t.owner||'Unassigned')}</span></div><div><small>Due date</small><span>${shortDate(t.due)}</span></div><div><small>Area</small><span>${esc(t.area)}</span></div><div><small>Priority</small><span>${esc(t.priority)}</span></div></div><h3>What needs to happen</h3><p class="detail-notes">${esc(t.notes)}</p><p class="detail-source">${esc(t.evidence||'Imported from the WCQ planning documents. Completion needs confirmation.')}</p><div class="actions"><a class="button primary" href="${taskLink(t)}" target="_blank" rel="noopener">Update on GitHub ↗</a><button class="button" data-help>Update guide</button></div>`;$('#detail').showModal();}
function exportCSV(){const fields=['id','title','status','owner','due','priority','day','area','notes','url'];const csv=[fields.join(','),...filteredTasks().map(t=>fields.map(k=>{let v=String(t[k]??'');if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"';}).join(','))].join('\r\n');const u=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=u;a.download='wcq-tasks.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.nav){navigate(b.dataset.nav);}else if(b.dataset.go){navigate(b.dataset.go);}else if(b.dataset.task){openTask(b.dataset.task);}else if(b.dataset.day){filters.day=b.dataset.day;navigate('tasks');}else if(b.hasAttribute('data-help')){$('#detail').close();$('#help').showModal();}else if(b.classList.contains('close')){b.closest('dialog').close();}else if(b.dataset.view){view=b.dataset.view;render();}else if(b.hasAttribute('data-clear')){filters={query:'',status:'',day:'',owner:''};render();}else if(b.hasAttribute('data-export')){exportCSV();}else if(b.hasAttribute('data-retry')){load();}});
document.addEventListener('input',e=>{if(e.target.id==='search-tasks'){filters.query=e.target.value;$('#task-results').innerHTML=taskResults();}});
document.addEventListener('change',e=>{const key={'status-filter':'status','day-filter':'day','owner-filter':'owner'}[e.target.id];if(key){filters[key]=e.target.value;$('#task-results').innerHTML=taskResults();}});
$('#refresh').addEventListener('click',load);
const initial=location.hash.slice(1);if(['overview','tasks','week','notes'].includes(initial))page=initial;
load();
