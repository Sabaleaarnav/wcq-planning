import test from 'node:test';
import assert from 'node:assert/strict';
import {parseIssue,section} from './parse-issue.mjs';
const issue=(body,state='open')=>({number:42,title:'Confirm venue',body,state,html_url:'https://github.com/example/wcq/issues/42',assignees:[{login:'coordinator'}]});
test('reads all multiline issue form sections without swallowing adjacent headings',()=>{
 const body='### Status\n\nBlocked\n\n### Area\n\nCoordination\n\n### Event day\n\nTuesday\n\n### Owner\n\nAlex\n\n### Due date\n\n2026-11-05\n\n### Priority\n\nHigh\n\n### Notes\n\nWaiting on the room.\nConfirm capacity too.\n\n### Evidence\n\nReservation pending.';
 const t=parseIssue(issue(body));
 assert.equal(t.status,'Blocked');assert.equal(t.owner,'Alex');assert.equal(t.due,'2026-11-05');assert.equal(t.day,'Tuesday');assert.equal(t.area,'Coordination');assert.equal(t.priority,'High');assert.equal(t.notes,'Waiting on the room.\nConfirm capacity too.');assert.equal(t.evidence,'Reservation pending.');
});
test('closed issue wins over stale status and reopened Done does not stay done',()=>{
 assert.equal(parseIssue(issue('### Status\nIn progress','closed')).status,'Done');
 assert.equal(parseIssue(issue('### Status\nDone','open')).status,'To do');
});
test('blank GitHub form values fall back to assignees and no deadline',()=>{
 const t=parseIssue(issue('### Owner\n\n_No response_\n\n### Due date\n\n_No response_\n\n### Status\n\nTo do'));
 assert.equal(t.owner,'coordinator');assert.equal(t.due,null);
});
test('invalid or impossible dates are not accepted',()=>{
 for(const due of ['tomorrow','2026-02-30','2026-13-01'])assert.equal(parseIssue(issue('### Due date\n'+due)).due,null);
});
test('missing sections do not crash imports',()=>{
 assert.equal(section('Notes only','Status'),'');assert.equal(parseIssue(issue(null)).status,'To do');
});
