import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const readme=fs.readFileSync(path.join(root,"README.txt"),"utf8");
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
const fixture=JSON.parse(fs.readFileSync(path.join(root,"tests/fixtures/work-v1.0.1.json"),"utf8"));

function check(label,fn){
  fn();
  console.log(`✓ ${label}`);
}

function inlineScript(){
  const scripts=[...index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match=>match[1])
    .filter(script=>script.trim());
  assert.ok(scripts.length,"inline script를 찾지 못했습니다.");
  return scripts.at(-1);
}

const script=inlineScript();
const versionMatch=script.match(/const APP_VERSION\s*=\s*["']([^"']+)["']/);
assert.ok(versionMatch,"APP_VERSION 상수를 찾지 못했습니다.");
const appVersion=versionMatch[1];

const templateMatch=script.match(/const TEMPLATES\s*=\s*(\[[\s\S]*?\n\]);/);
assert.ok(templateMatch,"TEMPLATES 배열을 찾지 못했습니다.");
const templates=vm.runInNewContext(`(${templateMatch[1]})`,Object.create(null));

check("inline JavaScript 문법",()=>new vm.Script(script,{filename:"index.html"}));

check("APP_VERSION과 화면/패키지/README 버전 일치",()=>{
  assert.equal(appVersion,"1.3.0");
  assert.equal(pkg.version,appVersion);
  assert.match(index,new RegExp(`V${appVersion} · OUTPUT RELIABILITY`));
  assert.match(readme,new RegExp(`V${appVersion} · OUTPUT RELIABILITY`));
  assert.match(script,/version:APP_VERSION/);
  assert.match(script,/merged\.version=APP_VERSION/);
});

check("템플릿 22종 및 그룹별 개수",()=>{
  assert.equal(templates.length,22);
  assert.equal(new Set(templates.map(item=>item.id)).size,22);
  assert.equal(templates.filter(item=>item.group==="basic").length,6);
  assert.equal(templates.filter(item=>item.group==="image").length,10);
  assert.equal(templates.filter(item=>item.group==="brand").length,6);
});

check("모든 이미지 템플릿 자산 존재",()=>{
  const imageTemplates=templates.filter(item=>item.group==="image");
  assert.equal(imageTemplates.length,10);
  for(const item of imageTemplates){
    assert.ok(item.path,`${item.name}: 경로가 비었습니다.`);
    assert.ok(fs.existsSync(path.join(root,item.path)),`${item.name}: ${item.path} 없음`);
    assert.ok(readme.includes(item.path),`${item.path}: README 목록 누락`);
  }
});

check("sinage 오타 잔존 없음",()=>{
  const tracked=[];
  for(const entry of fs.readdirSync(path.join(root,"templates")))tracked.push(`templates/${entry}`);
  assert.ok(!/sinage_/i.test([index,readme,...tracked].join("\n")));
});

check("정적 HTML 중복 id 없음",()=>{
  const ids=[...index.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(match=>match[1]);
  const duplicates=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
  assert.deepEqual(duplicates,[]);
});

check("접근성 핵심 계약",()=>{
  assert.equal((index.match(/role="textbox"/g)||[]).length,5);
  assert.match(index,/id="status" role="status" aria-live="polite"/);
  assert.match(index,/:focus-visible/);
  assert.match(index,/aria-pressed/);
  for(const id of ["titleSize","subtitleSize","bodySize","emSize","footerSize","photoW","photoH","logo1W","logo2W"]){
    assert.match(index,new RegExp(`<label for="${id}"`),`${id}: label 누락`);
  }
});

check("출력 신뢰성 계약",()=>{
  assert.match(script,/normalize\("NFC"\)/);
  assert.match(script,/naturalWidth\/img\.naturalHeight/);
  assert.match(script,/async function ensureExportLayoutsValid/);
  assert.match(script,/if\(!await ensureExportLayoutsValid\(\)\)return;/);
  assert.match(script,/const SAFE_MARGIN=54/);
  assert.match(script,/if\(out&&!out\.endsWith\("<br>"\)\)out\+="<br>"/);
});

check("V1.0.1 작업 JSON 호환 fixture",()=>{
  assert.equal(fixture.version,"1.0.1");
  assert.ok(fixture.state);
  assert.equal(typeof fixture.state.title,"string");
  assert.match(script,/state=normalizeState\(data\.state\|\|data\)/);
  assert.match(script,/playlist\.map\(normalizeState\)/);
});

console.log(`\n검증 완료: V${appVersion}, 템플릿 ${templates.length}종`);
