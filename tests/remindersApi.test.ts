import express from 'express';
import assert from 'node:assert/strict';
import { registerReminders } from '../server/reminders';
const app=express();app.use(express.json());
registerReminders(app,{getDb:()=>{throw Error('Database must not be accessed by rejected requests');},getUid:async req=>req.headers.authorization==='Bearer signed-test'?'test-user':null,getIdentity:async()=>({email:'test@example.com',emailVerified:false})});
const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',()=>r()));
const address=server.address() as any;const base='http://127.0.0.1:'+address.port;
try{
 for(const [path,method] of [['settings','GET'],['settings','POST'],['subscribe','POST'],['test','POST'],['run','GET']]){
  const r=await fetch(base+'/api/reminders/'+path,{method});assert.equal(r.status,401,path);
 }
 async function post(path:string,data:any){return fetch(base+'/api/reminders/'+path,{method:'POST',headers:{Authorization:'Bearer signed-test','Content-Type':'application/json'},body:JSON.stringify(data)});}
 assert.equal((await post('settings',{timeZone:'not-a-zone'})).status,400);
 assert.equal((await post('settings',{timeZone:'UTC',times:{morning:'25:00'}})).status,400);
 assert.equal((await post('settings',{timeZone:'UTC',emailEnabled:true})).status,400);
 assert.equal((await post('test',{channel:'sms'})).status,400);
 console.log('9 API authorization/validation checks passed. No provider or database was called.');
}finally{server.close();}
