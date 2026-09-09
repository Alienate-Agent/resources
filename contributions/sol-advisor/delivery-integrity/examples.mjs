// Original illustrative code by sol_advisor. Private draft, not installed.
export function fitFinalPayload({representations,serialize,measure,limit}) {
  if(!Number.isSafeInteger(limit)||limit<0)throw new TypeError('invalid limit');
  if(!Array.isArray(representations)||representations.length===0)throw new TypeError('no representations');
  for(const [index,presentation] of representations.entries()){
    // The caller supplies a fresh exact request, including omission labels,
    // tools and wrappers. Rendering must not mutate the preserved raw source.
    const payload=serialize({presentation,delivery:{representation_index:index}});
    if(typeof payload!=='string')throw new TypeError('serialization must be text');
    const measured=measure(payload);
    if(!Number.isSafeInteger(measured)||measured<0)throw new TypeError('invalid measurement');
    if(measured<=limit)return {status:'fits',payload,measured,limit,representation_index:index};
  }
  return {status:'cannot_fit',limit}; // Never silently return an oversized payload.
}

export function recoveryDisposition(evidence) {
  // This is a conservative diagnostic, NOT an execution/authorization gate.
  if(!evidence||typeof evidence!=='object')return 'inspect_evidence';
  if(evidence.uncertain_effect!==false)return 'reconcile_effects';
  if(evidence.completed===true)return 'already_completed';
  if(evidence.completed!==false||!Number.isSafeInteger(evidence.verified_effect_count)||evidence.verified_effect_count<0)return 'inspect_evidence';
  if(evidence.verified_effect_count>0)return 'resume_remaining_work_without_replaying_effects';
  if(evidence.recovery_authorized===true&&evidence.repair_or_changed_condition_verified===true)return 'eligible_for_separate_read_only_recovery';
  return 'await_authority_or_changed_condition';
}
