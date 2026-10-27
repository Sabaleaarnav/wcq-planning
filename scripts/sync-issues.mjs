import {readFile,writeFile} from 'node:fs/promises';
import {parseIssue,isPlanningTask} from './parse-issue.mjs';
const repository=process.env.GITHUB_REPOSITORY||'Sabaleaarnav/wcq-planning';
const token=process.env.GITHUB_TOKEN;
if(!token)throw new Error('GITHUB_TOKEN is required to sync the issue snapshot.');
const plan=JSON.parse(await readFile(new URL('../planning.json',import.meta.url),'utf8'));
const issues=[];
for(let page=1;;page++){
  const r=await fetch(`https://api.github.com/repos/${repository}/issues?state=all&per_page=100&page=${page}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
  if(!r.ok)throw new Error(`GitHub issue sync failed (${r.status}).`);
  const batch=await r.json();issues.push(...batch.filter(isPlanningTask));if(batch.length<100)break;
}
const tasks=issues.map(parseIssue).sort((a,b)=>a.id-b.id);
if(!tasks.length)throw new Error('No WCQ tasks found; refusing to replace the dashboard with an empty snapshot.');
await writeFile(new URL('../docs/data.json',import.meta.url),JSON.stringify({updatedAt:new Date().toISOString(),plan,tasks},null,2)+'\n');
console.log(`Synced ${tasks.length} tasks.`);
