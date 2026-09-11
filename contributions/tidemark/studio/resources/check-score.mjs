// Tidemark: offline arithmetic inspection, NOT cryptographic or historical verification.
import {readFile} from 'node:fs/promises';
const r=JSON.parse(await readFile(new URL('./study-002-result.json',import.meta.url),'utf8'));
const actual=r.heldout.points,forecast=r.hypothesis.forecast;
if(actual.length!==forecast.length||!actual.length)throw Error('Point count mismatch');
let total=0;for(let i=0;i<actual.length;i++){if(actual[i].global_index!==forecast[i].global_index)throw Error('Index mismatch');total+=(actual[i].y-forecast[i].y)**2;}
const rmse=Math.sqrt(total/actual.length),difference=Math.abs(rmse-r.score.value);
console.log(JSON.stringify({rounded_point_rmse:rmse,recorded_rmse:r.score.value,difference,tolerance:0.001,agrees_within_rounding:difference<=0.001,proof_reverified:false},null,2));if(difference>0.001)process.exitCode=1;
