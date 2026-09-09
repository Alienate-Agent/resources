import test from 'node:test';
import assert from 'node:assert/strict';
import {fitFinalPayload,recoveryDisposition} from './examples.mjs';
const measure=s=>Buffer.byteLength(s,'utf8');
test('includes wrappers in final measurement',()=>{
 const r=fitFinalPayload({representations:['long text','x'],serialize:JSON.stringify,measure,limit:65});
 assert.equal(r.status,'fits');assert.equal(r.measured,measure(r.payload));assert(r.measured<=65);
});
test('exhausted ladder returns no payload',()=>{
 const r=fitFinalPayload({representations:['x',''],serialize:JSON.stringify,measure,limit:1});
 assert.equal(r.status,'cannot_fit');assert.equal(r.payload,undefined);
});
test('non-ASCII measurement is explicitly bytes, not character or token count',()=>{
 const r=fitFinalPayload({representations:['é'],serialize:x=>x.presentation,measure,limit:1});assert.equal(r.status,'cannot_fit');
});
test('invalid measurement or limit fails instead of fitting',()=>{
 for(const n of [NaN,-1,1.5])assert.throws(()=>fitFinalPayload({representations:['x'],serialize:JSON.stringify,measure:()=>n,limit:10}));
 assert.throws(()=>fitFinalPayload({representations:['x'],serialize:JSON.stringify,measure,limit:Infinity}));
});
test('no raw source mutation in ordinary JSON serialization',()=>{
 const source=Object.freeze({body:'original'});fitFinalPayload({representations:[source],serialize:JSON.stringify,measure,limit:1000});assert.equal(source.body,'original');
});
test('uncertain or absent effect evidence overrides done',()=>{
 assert.equal(recoveryDisposition({completed:true,uncertain_effect:true}),'reconcile_effects');assert.equal(recoveryDisposition({completed:true}),'reconcile_effects');
});
test('chosen silence may be complete',()=>{assert.equal(recoveryDisposition({completed:true,uncertain_effect:false,verified_effect_count:0}),'already_completed');});
test('missing done after known effect does not permit replay',()=>{assert.equal(recoveryDisposition({completed:false,uncertain_effect:false,verified_effect_count:1}),'resume_remaining_work_without_replaying_effects');});
test('read-only recovery needs both authorization and changed condition',()=>{
 const e={completed:false,uncertain_effect:false,verified_effect_count:0,recovery_authorized:true};assert.equal(recoveryDisposition(e),'await_authority_or_changed_condition');assert.equal(recoveryDisposition({...e,repair_or_changed_condition_verified:true}),'eligible_for_separate_read_only_recovery');
});
test('malformed counts remain unknown',()=>{assert.equal(recoveryDisposition({completed:false,uncertain_effect:false,verified_effect_count:-1}),'inspect_evidence');});
