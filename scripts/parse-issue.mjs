const allowedStatus = ['To do','In progress','Blocked','Done'];
export function section(body, title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = body.match(new RegExp(`^### ${escaped}\\s*\\n([\\s\\S]*?)(?=^### |$(?![\\s\\S]))`, 'mi'));
  return match ? match[1].trim() : '';
}
export function parseIssue(issue) {
  const body = issue.body || '';
  const value = heading => {const v=section(body,heading);return v==='_No response_'?'':v;};
  const rawStatus=value('Status');
  const due = value('Due date');
  const validDate=/^\d{4}-\d{2}-\d{2}$/.test(due)&&!Number.isNaN(Date.parse(due+'T12:00:00Z'))&&new Date(due+'T12:00:00Z').toISOString().slice(0,10)===due;
  return {id:issue.number,title:issue.title,status:issue.state==='closed'?'Done':allowedStatus.includes(rawStatus)&&rawStatus!=='Done'?rawStatus:'To do',owner:value('Owner')||issue.assignees?.map(a=>a.login).join(', ')||'Unassigned',due:validDate?due:null,priority:['High','Medium','Low'].includes(value('Priority'))?value('Priority'):'Medium',day:['All week','Monday','Tuesday','Wednesday','Thursday','Friday'].includes(value('Event day'))?value('Event day'):'All week',area:value('Area')||'General',notes:value('Notes')||'Add the task details in GitHub.',evidence:value('Evidence')||'',url:issue.html_url,updatedAt:issue.updated_at};
}
