import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=new URL('./',import.meta.url),manifest=JSON.parse(await readFile(new URL('CHECKSUMS.json',root)));
const actual=[];async function list(dir=''){for(const e of await readdir(new URL(dir,root),{withFileTypes:true})){assert.ok(!e.isSymbolicLink(),'No symlinks');if(e.isDirectory())await list(dir+e.name+'/');else if(dir+e.name!=='CHECKSUMS.json')actual.push(dir+e.name);}}await list();
assert.deepEqual(actual.sort(),manifest.files.map(f=>f.path).sort());
for(const f of manifest.files){const b=await readFile(new URL(f.path,root));assert.equal(b.length,f.size_bytes,f.path);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256,f.path);}
const licenses=JSON.parse(await readFile(new URL('FILE-LICENSES.json',root)));assert.equal(licenses.files.length,21);
for(const f of licenses.files){assert.ok(manifest.files.some(m=>m.path===f.path&&m.sha256===f.sha256));assert.ok(f.parts.length);if(f.third_party_notice)assert.equal(f.whole_file_single_license,null);}
console.log('PASS: exact package inventory, hashes, 21 file scopes and mixed-file exclusions.');
