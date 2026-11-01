// Run from a trusted server scheduler every 5 minutes. Never expose CRON_SECRET to client code.
const origin = process.env.REMINDER_ORIGIN || 'https://www.menifestos.com';
if (!process.env.CRON_SECRET) throw new Error('CRON_SECRET required');
if (!origin.startsWith('https://')) throw new Error('HTTPS origin required');
let cursor = '', pages = 0;
do {
 const url=new URL('/api/reminders/run',origin);
 if(cursor) url.searchParams.set('cursor',cursor);
 const response=await fetch(url,{headers:{Authorization:`Bearer ${process.env.CRON_SECRET}`},signal:AbortSignal.timeout(120000)});
 const result=await response.json();
 if(!response.ok)throw new Error('Reminder run failed: '+JSON.stringify(result));
 console.log(JSON.stringify({sent:result.sent,failed:result.failed,page:++pages}));
 cursor=result.nextCursor||'';
 if(pages>=1000 && cursor)throw new Error('Pagination limit reached');
} while(cursor);
