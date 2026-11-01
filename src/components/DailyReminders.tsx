import React, { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';

type Settings={pushEnabled:boolean;emailEnabled:boolean;timeZone:string;times:{morning:string;evening:string;night:string};publicKey?:string;pushReady?:boolean;emailReady?:boolean};
export default function DailyReminders(){
 const [prefs,setPrefs]=useState<Settings>({pushEnabled:false,emailEnabled:false,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,times:{morning:'07:00',evening:'18:00',night:'22:00'}});
 const [busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[message,setMessage]=useState('');
 async function api(path:string,body?:any){
  if(!auth.currentUser)throw Error('Please sign in again');
  const token=await auth.currentUser.getIdToken();
  const r=await fetch('/api/reminders/'+path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await r.json();if(!r.ok)throw Error(data.error||'Request failed');return data;
 }
 useEffect(()=>{let active=true;api('settings').then(p=>{if(active){setPrefs({...p,timeZone:p.updatedAt?p.timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone});setLoaded(true);}}).catch(e=>{if(active)setMessage(e.message);});return()=>{active=false;};},[]);
 async function run(action:()=>Promise<void>){setBusy(true);setMessage('');try{await action();}catch(e:any){setMessage(e.message);}finally{setBusy(false);}}
 async function connect(){
  // Called directly from a user gesture, before network calls (required by mobile browsers).
  if(!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window))throw Error('Web push is unavailable. On iPhone, install this app to Home Screen first (iOS 16.4+).');
  if(!prefs.pushReady||!prefs.publicKey)throw Error('Server push setup is pending. Email can be enabled separately.');
  const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Allow notifications in browser settings. On iPhone, use the installed Home Screen app.');
  await navigator.serviceWorker.register('/sw.js');
  const reg=await navigator.serviceWorker.ready;
  const padding='='.repeat((4-prefs.publicKey.length%4)%4);const raw=atob((prefs.publicKey+padding).replace(/-/g,'+').replace(/_/g,'/'));
  const key=Uint8Array.from(raw,c=>c.charCodeAt(0));
  const sub=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
  await api('subscribe',{subscription:sub.toJSON()});
  setPrefs(p=>({...p,pushEnabled:true}));setMessage('Device connected. Save settings to enable scheduled push.');
 }
 return <section className="p-4 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03]" aria-label="Daily reminders">
  <h3 className="text-lg font-bold text-white">Daily reminders & progress reports</h3>
  <p className="text-xs text-white/60">Morning plan · Evening completed/pending status · Night report. Channels are opt-in. Delivery depends on network and device settings.</p>
  <fieldset disabled={busy||!loaded} className="space-y-3 disabled:opacity-50">
   <label className="flex gap-3 items-center"><input type="checkbox" checked={prefs.emailEnabled} onChange={e=>setPrefs({...prefs,emailEnabled:e.target.checked})}/> Email reminders & reports</label>
   <label className="flex gap-3 items-center"><input type="checkbox" checked={prefs.pushEnabled} onChange={e=>setPrefs({...prefs,pushEnabled:e.target.checked})}/> Push reminders on connected devices</label>
   <button type="button" onClick={()=>run(connect)} className="px-3 py-2 rounded-lg bg-amber-500 text-black font-semibold">Connect this device for push</button>
   <label className="block text-sm">Timezone <input aria-label="Reminder timezone" value={prefs.timeZone} onChange={e=>setPrefs({...prefs,timeZone:e.target.value})} className="block w-full p-2 rounded bg-black border border-white/20"/></label>
   <div className="grid grid-cols-3 gap-2">{(['morning','evening','night'] as const).map(slot=><label key={slot} className="text-xs capitalize">{slot}<input type="time" aria-label={slot+' reminder time'} value={prefs.times[slot]} onChange={e=>setPrefs({...prefs,times:{...prefs.times,[slot]:e.target.value}})} className="block w-full mt-1 p-2 bg-black border border-white/20 rounded"/></label>)}</div>
   <button type="button" onClick={()=>run(async()=>{await api('settings',prefs);setMessage('Saved. Unchecked channels are disabled on all your devices.');})} className="px-4 py-2 rounded-lg bg-white text-black font-semibold">Save reminder settings</button>
   <div className="flex flex-wrap gap-3">{['push','email'].map(channel=><button key={channel} type="button" className="text-sm underline" onClick={()=>run(async()=>{await api('test',{channel});setMessage(channel+' test accepted by the delivery provider. Check your device/inbox.');})}>Test {channel}</button>)}</div>
  </fieldset>
  <p className="text-xs text-white/50">iPhone: install to Home Screen and allow notifications. Reports currently use the app’s quest reset day (Asia/Kolkata); delivery times use your timezone. Turn channels off and save to stop reminders.</p>
  {loaded&&(!prefs.pushReady||!prefs.emailReady)&&<p className="text-xs text-amber-300">Server setup pending: {!prefs.pushReady?'push keys. ':''}{!prefs.emailReady?'email provider.':''}</p>}
  <p role="status" className="text-sm text-amber-200">{busy?'Working…':message}</p>
 </section>;
}
