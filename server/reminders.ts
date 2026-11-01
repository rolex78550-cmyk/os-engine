import type { Express } from 'express';
import webpush from 'web-push';
import crypto from 'node:crypto';
import { DEFAULT_TIMES, dueSlots, localClock, type Slot } from './reminderSchedule';
import { TASKS, claimDateKey, CLAIM_TIMEZONE } from '../src/lib/taskCatalog';
import { XP_PER_TASK } from '../src/lib/xpSeason';

export function registerReminders(app: Express, deps: { getDb: () => any; getUid: (req: any) => Promise<string | null>; getIdentity: (uid: string) => Promise<any> }) {
  const db = deps.getDb;
  const settings = (uid: string) => db().collection('notification_settings').doc(uid);
  const safe = (x: string) => x.replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  const defaults = { pushEnabled:false, emailEnabled:false, timeZone:'UTC', times:DEFAULT_TIMES };
  const pushReady = () => !!(process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY && process.env.WEB_PUSH_SUBJECT);
  async function identity(req: any, res: any) {
    const uid = await deps.getUid(req);
    if (!uid) res.status(401).json({error:'Sign in required'});
    return uid;
  }
  app.get('/api/reminders/settings', async (req,res) => {
    try {
      const uid = await identity(req,res); if (!uid) return;
      const snap = await settings(uid).get();
      res.json({ ...defaults, ...snap.data(), publicKey:process.env.WEB_PUSH_PUBLIC_KEY || '', pushReady:pushReady(), emailReady:!!(process.env.RESEND_API_KEY && process.env.NOTIFICATION_FROM_EMAIL) });
    } catch { res.status(500).json({error:'Could not load reminder settings'}); }
  });
  app.post('/api/reminders/settings', async (req,res) => {
    try {
      const uid = await identity(req,res); if (!uid) return;
      const b=req.body || {}; const timeZone=String(b.timeZone || 'UTC');
      try { localClock(new Date(),timeZone); } catch { return res.status(400).json({error:'Invalid timezone'}); }
      const times={...DEFAULT_TIMES,...b.times};
      if (!Object.values(times).every(t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) return res.status(400).json({error:'Invalid reminder time'});
      const user=await deps.getIdentity(uid);
      if (b.emailEnabled && (!user.email || !user.emailVerified)) return res.status(400).json({error:'Verify your account email before enabling email reminders'});
      const patch={pushEnabled:b.pushEnabled === true,emailEnabled:b.emailEnabled === true,timeZone,times,updatedAt:new Date().toISOString()};
      await settings(uid).set(patch,{merge:true});
      res.json({saved:true,...patch});
    } catch { res.status(500).json({error:'Could not save reminder settings'}); }
  });
  app.post('/api/reminders/subscribe', async (req,res) => {
    try {
      const uid=await identity(req,res); if(!uid)return;
      if(!pushReady())return res.status(503).json({error:'Push keys are not configured on the server'});
      const sub=req.body?.subscription;
      // Prevent SSRF: only known browser push services, HTTPS, no custom ports/credentials.
      let url:URL;try{url=new URL(sub?.endpoint);}catch{return res.status(400).json({error:'Invalid push subscription'});}
      const hosts=['fcm.googleapis.com','updates.push.services.mozilla.com','push.services.mozilla.com','web.push.apple.com','notify.windows.com'];
      if(url.protocol!=='https:' || url.port || url.username || url.password || !hosts.some(h=>url.hostname===h || url.hostname.endsWith('.'+h)) || !/^[A-Za-z0-9_-]{80,150}$/.test(sub?.keys?.p256dh||'') || !/^[A-Za-z0-9_-]{16,50}$/.test(sub?.keys?.auth||'')) return res.status(400).json({error:'Unsupported push subscription'});
      const id=crypto.createHash('sha256').update(sub.endpoint).digest('hex');
      const ref=settings(uid).collection('subscriptions');
      if((await ref.get()).size>=10 && !(await ref.doc(id).get()).exists)return res.status(400).json({error:'Device limit reached'});
      // A browser subscription can belong to only one account at a time.
      const ownerRef=db().collection('notification_push_owners').doc(id);
      await db().runTransaction(async(tx:any)=>{
        const owner=await tx.get(ownerRef);const previous=owner.data()?.uid;
        if(previous && previous!==uid)tx.delete(settings(previous).collection('subscriptions').doc(id));
        tx.set(ref.doc(id),{endpoint:sub.endpoint,keys:{p256dh:sub.keys.p256dh,auth:sub.keys.auth},updatedAt:new Date().toISOString()});
        tx.set(ownerRef,{uid});
      });
      res.json({subscribed:true});
    } catch {res.status(500).json({error:'Could not register device'});}
  });
  async function report(uid:string,slot:Slot) {
    // Quest reset is currently India-based in the app; label the same reporting day honestly.
    const date=claimDateKey(new Date());
    const snap=await db().collection('users').doc(uid).collection('task_claims').where('date','==',date).get();
    const completed=new Set<string>();snap.docs.forEach((d:any)=>{const v=d.data();if(v.verified && TASKS.some(t=>t.id===v.taskId))completed.add(v.taskId);});
    const pending=TASKS.filter(t=>!completed.has(t.id));
    const status=`${completed.size}/${TASKS.length} quests completed · ${completed.size * XP_PER_TASK} quest XP earned. ${pending.length} pending.`;
    const title=slot==='morning'?'Your daily plan':slot==='evening'?'Your evening progress check':'Your daily progress report';
    const text=`${status}\n${pending.length?'Next: '+pending.slice(0,3).map(t=>t.title).join(', ')+'.':'All daily quests complete—well done.'}\nQuest day: ${date} (${CLAIM_TIMEZONE}, the app’s current reset timezone).\n${slot==='night'?'This is your progress as of this report, not the end-of-day total.':'Choose one manageable next action.'}`;
    return {title,text};
  }
  async function send(uid:string,channel:string,message:{title:string;text:string},key:string) {
    if(channel==='email') {
      if(!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_FROM_EMAIL)throw Error('Email provider or verified sender not configured');
      const u=await deps.getIdentity(uid);if(!u.email || !u.emailVerified)throw Error('Verified email required');
      const origin='https://www.menifestos.com';
      const text=message.text+`\nOpen app: ${origin}/\nManage or disable reminders in Profile → Daily reminders.`;
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({from:process.env.NOTIFICATION_FROM_EMAIL,to:[u.email],subject:message.title+' · Menifest OS',text,html:`<div style="font-family:Arial;max-width:560px;margin:auto"><h1>${safe(message.title)}</h1><p style="white-space:pre-line">${safe(message.text)}</p><p><a href="${origin}/">Open Menifest OS</a></p><p>Manage or disable reminders in Profile → Daily reminders.</p></div>`}),signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error('Email provider rejected request: '+response.status);
    } else {
      if(!pushReady())throw Error('Push provider not configured');
      webpush.setVapidDetails(process.env.WEB_PUSH_SUBJECT!,process.env.WEB_PUSH_PUBLIC_KEY!,process.env.WEB_PUSH_PRIVATE_KEY!);
      const subs=await settings(uid).collection('subscriptions').get();
      if(subs.empty)throw Error('No registered device');
      let sent=0;
      for(const doc of subs.docs){try{await webpush.sendNotification(doc.data(),JSON.stringify({title:message.title,body:message.text,url:'/',tag:key}),{TTL:1800,timeout:10000});sent++;}catch(e:any){if(e.statusCode===404||e.statusCode===410)await doc.ref.delete();}}
      if(!sent)throw Error('No push delivery accepted');
    }
  }
  app.post('/api/reminders/test',async(req,res)=>{
    try{
      const uid=await identity(req,res);if(!uid)return;
      const channel=req.body?.channel;if(!['email','push'].includes(channel))return res.status(400).json({error:'Invalid channel'});
      const ref=settings(uid); const field=channel==='email'?'lastEmailTest':'lastPushTest';
      const allowed=await db().runTransaction(async(tx:any)=>{const s=await tx.get(ref);if(Date.now()-(s.data()?.[field]||0)<60000)return false;tx.set(ref,{[field]:Date.now()},{merge:true});return true;});
      if(!allowed)return res.status(429).json({error:'Wait one minute between tests'});
      await send(uid,channel,await report(uid,'evening'),'test-'+crypto.randomUUID());
      res.json({accepted:true});
    }catch(e:any){res.status(503).json({error:e.message});}
  });
  app.get('/api/reminders/run',async(req,res)=>{
    if(!process.env.CRON_SECRET || req.headers.authorization!==`Bearer ${process.env.CRON_SECRET}`)return res.status(401).json({error:'Scheduler authentication required'});
    let sent=0,failed=0; const now=new Date();
    try {
      // Cursor pagination keeps each invocation bounded; caller follows nextCursor, until null.
      const cursor=typeof req.query.cursor==='string'?req.query.cursor:'';
      let query=db().collection('notification_settings').orderBy('__name__').limit(50);
      if(cursor)query=query.startAfter(cursor);
      const snap=await query.get();
      for(const doc of snap.docs){const p=doc.data();if(!p.emailEnabled&&!p.pushEnabled)continue;
        let slots:Slot[];try{slots=dueSlots(now,p.timeZone||'UTC',{...DEFAULT_TIMES,...p.times});}catch{continue;}
        for(const slot of slots){const day=localClock(now,p.timeZone||'UTC').date;
          for(const channel of ['email','push']){if(!p[channel+'Enabled'])continue;
            const key=`${doc.id}_${day}_${slot}_${channel}`;const ref=db().collection('notification_deliveries').doc(key);
            const lease=crypto.randomUUID();
            const acquired=await db().runTransaction(async(tx:any)=>{const s=await tx.get(ref);const d=s.data();if(d?.status==='sent'||(d?.leaseUntil||0)>Date.now()||(d?.attempts||0)>=3)return false;tx.set(ref,{status:'sending',lease,leaseUntil:Date.now()+300000,attempts:(d?.attempts||0)+1,expiresAt:new Date(Date.now()+30*86400000)},{merge:true});return true;});
            if(!acquired)continue;
            try{await send(doc.id,channel,await report(doc.id,slot),key);await ref.set({status:'sent',sentAt:new Date().toISOString(),leaseUntil:0},{merge:true});sent++;}
            catch(e:any){await ref.set({status:'failed',error:String(e.message).slice(0,200),leaseUntil:0},{merge:true});failed++;}
          }
        }
      }
      res.json({sent,failed,nextCursor:snap.size===50?snap.docs[snap.docs.length-1].id:null});
    } catch {res.status(500).json({error:'Scheduler failed',sent,failed});}
  });
}
