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

function functionSource(source,name){
  const start=source.indexOf(`function ${name}(`);
  assert.ok(start>=0,`${name} 함수를 찾지 못했습니다.`);
  const brace=source.indexOf("{",start);
  let depth=0;
  let quote="";
  let escaped=false;
  for(let i=brace;i<source.length;i++){
    const char=source[i];
    if(quote){
      if(escaped)escaped=false;
      else if(char==="\\")escaped=true;
      else if(char===quote)quote="";
      continue;
    }
    if(char==='"'||char==="'"||char==='`'){
      quote=char;
      continue;
    }
    if(char==="{")depth++;
    if(char==="}"&&--depth===0)return source.slice(start,i+1);
  }
  assert.fail(`${name} 함수 끝을 찾지 못했습니다.`);
}

const script=inlineScript();
const versionMatch=script.match(/const APP_VERSION\s*=\s*["']([^"']+)["']/);
assert.ok(versionMatch,"APP_VERSION 상수를 찾지 못했습니다.");
const appVersion=versionMatch[1];
const releaseMatch=script.match(/const APP_RELEASE_NAME\s*=\s*["']([^"']+)["']/);
assert.ok(releaseMatch,"APP_RELEASE_NAME 상수를 찾지 못했습니다.");
const releaseName=releaseMatch[1];

const templateMatch=script.match(/const TEMPLATES\s*=\s*(\[[\s\S]*?\n\]);/);
assert.ok(templateMatch,"TEMPLATES 배열을 찾지 못했습니다.");
const templates=vm.runInNewContext(`(${templateMatch[1]})`,Object.create(null));

check("inline JavaScript 문법",()=>new vm.Script(script,{filename:"index.html"}));

check("APP_VERSION과 화면/패키지/README 버전 일치",()=>{
  assert.equal(appVersion,"1.3.1");
  assert.equal(releaseName,"QUICK START");
  assert.equal(pkg.version,appVersion);
  assert.match(index,new RegExp(`id="appVersionCurrent">V${appVersion} · ${releaseName}<`));
  assert.equal(readme.split(/\r?\n/,1)[0],`디지털 사이니지 제작기 V${appVersion} · ${releaseName}`);
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
  for(const id of ["quickEventName","quickDate","quickLocation"]){
    assert.match(index,new RegExp(`<label for="${id}"`),`${id}: QUICK START label 누락`);
  }
});

check("출력 신뢰성 계약",()=>{
  assert.match(script,/normalize\("NFC"\)/);
  assert.match(script,/naturalWidth\/img\.naturalHeight/);
  assert.match(script,/async function ensureExportLayoutsValid/);
  assert.match(script,/if\(!await ensureExportLayoutsValid\(snapshots\)\)return;/);
  assert.match(script,/const snapshots=exportStates\(\)\.map\(snapshot=>normalizeState\(deepCopy\(snapshot\)\)\)/);
  assert.match(script,/async function runExport\(task\)/);
  assert.match(script,/app\.inert=busy/);
  assert.match(script,/chosen=await window\.showDirectoryPicker\([\s\S]*?ensureExportLayoutsValid\(snapshots\)/,
    "폴더 선택은 transient user activation이 끝나기 전에 실행해야 합니다.");
  assert.match(script,/const SAFE_MARGIN=54/);
  assert.match(script,/if\(out&&!out\.endsWith\("<br>"\)\)out\+="<br>"/);
  assert.match(script,/box\.querySelectorAll\("br"\)\.forEach\(br=>br\.replaceWith\("\\n"\)\)/);
});

check("QUICK START 및 자동 색상 계약",()=>{
  assert.match(index,/id="quickStartSection"/);
  assert.equal((index.match(/data-quick-key=/g)||[]).length,3);
  for(const [id,key] of [["quickEventName","title"],["quickDate","subtitle"],["quickLocation","body"]]){
    assert.match(index,new RegExp(`id="${id}"[\\s\\S]*?data-quick-key="${key}"`));
  }
  assert.match(index,/id="quickModeButton" aria-pressed="true"/);
  assert.match(index,/id="advancedModeButton" aria-pressed="false"/);
  assert.match(index,/id="quickPreviewButton"[\s\S]*?aria-controls="workspace"/);
  assert.match(script,/const QUICK_START_FIELDS=\[/);
  assert.match(script,/function syncQuickStartInput\(input\)/);
  assert.match(script,/state\[key\]=migrateRich\(input\.value\)/);
  assert.match(script,/function setEditorMode\(mode,/);
  assert.match(script,/renderQuickStart\(\);[\s\S]*?updateLayoutStatus\(\)/);
  assert.match(script,/\$\("quickPreviewButton"\)\.onclick=\(\)=>setMobilePreview\(true\)/);
  assert.match(index,/자동 텍스트 색상/);
  assert.match(index,/id="useAutoTextColor"[\s\S]*?aria-pressed="true"/);
  assert.equal((index.match(/data-auto-color-key=/g)||[]).length,5);
  assert.match(index,/id="autoColorStatus" role="status" aria-live="polite"/);
  assert.match(script,/const AUTO_CONTRAST_TARGET=4\.5/);
  for(const color of ["#FFFFFF","#16283B","#111820","#F3C866"]){
    assert.ok(script.includes(color),`${color}: 자동 후보색 누락`);
  }
  assert.match(script,/function defaultTextColorModes\(mode="auto"\)/);
  assert.match(script,/getClientRects\(\)/);
  assert.match(script,/clone\.classList\.add\("exporting","auto-color-sampling"\)/);
  assert.match(script,/state\.textColorModes\[key\]="manual"/);
  assert.match(script,/state\.textColorModes\[key\]="auto"/);
  assert.match(script,/await Promise\.all\(\[document\.fonts\.ready,waitImages\(page\)\]\)/);
  assert.match(script,/autoTextColor:"#F3C866"/);
  assert.match(script,/function resolveStableAutoTextColors\(options=\{\}\)/);
  assert.ok((script.match(/await resolveStableAutoTextColors\(\{persist:false\}\)/g)||[]).length>=2,
    "preflight와 출력 캡처의 자동 색상 재검증이 필요합니다.");
  assert.match(script,/function clearInlineTextColors\(value\)/);
  assert.match(script,/state\[key\]=clearInlineTextColors\(state\[key\]\)/);
  const templateClick=script.match(/btn\.onclick=\(\)=>\{\s*state\.template=t\.id;([\s\S]*?)\n\s*\};/);
  assert.ok(templateClick,"템플릿 선택 핸들러를 찾지 못했습니다.");
  assert.doesNotMatch(templateClick[0],/state\.textColor\s*=/,
    "템플릿 변경이 수동 글자색을 덮어쓰면 안 됩니다.");
});

check("자동 후보의 대비 우선·ERICA 톤 선택",()=>{
  const context=Object.create(null);
  vm.runInNewContext([
    "const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));",
    "const AUTO_CONTRAST_TARGET=4.5;",
    `const AUTO_TEXT_COLORS=${JSON.stringify([
      {name:"White",value:"#FFFFFF"},
      {name:"ERICA Navy",value:"#16283B"},
      {name:"Dark Charcoal",value:"#111820"},
      {name:"Light Gold",value:"#F3C866"}
    ])};`,
    `const AUTO_SAFE_COLORS=${JSON.stringify([{name:"Safe Black",value:"#000000"}])};`,
    functionSource(script,"normalizeColor"),
    "function robustContrast(samples,color){return samples[color]||0;}",
    functionSource(script,"selectContrastCandidate")
  ].join("\n"),context);

  const passing={
    "#FFFFFF":9.5,"#16283B":8.2,"#111820":10.1,"#F3C866":5.4,"#000000":11
  };
  assert.equal(context.selectContrastCandidate([{key:"title",samples:passing}],"#16283B").value,"#16283B");
  assert.equal(context.selectContrastCandidate([{key:"title",samples:passing}],"").value,"#111820");
  const emergency={
    "#FFFFFF":4.3,"#16283B":3.4,"#111820":4.1,"#F3C866":1.2,"#000000":4.8
  };
  assert.equal(context.selectContrastCandidate([{key:"title",samples:emergency}],"#16283B").value,"#000000");
});

check("WCAG 상대휘도와 대비율",()=>{
  const context=Object.create(null);
  const pure=[
    "const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));",
    functionSource(script,"normalizeColor"),
    functionSource(script,"hexToRgb"),
    functionSource(script,"linearSrgb"),
    functionSource(script,"rgbRelativeLuminance"),
    functionSource(script,"relativeLuminance"),
    functionSource(script,"contrastRatio")
  ].join("\n");
  vm.runInNewContext(pure,context);
  assert.ok(Math.abs(context.contrastRatio("#000000","#FFFFFF")-21)<.001);
  assert.ok(Math.abs(context.contrastRatio("#FFFFFF","#0E4A84")-9.01)<.03);
  assert.ok(context.contrastRatio("#FFFFFF","#16283B")>14.5);
});

check("V1.0.1 / V1.3.0 작업 JSON 호환",()=>{
  const fixture130={
    app:"digital-signage-maker",
    version:"1.3.0",
    state:{version:"1.3.0",title:"V1.3.0 행사",subtitle:"2026. 9. 15.",body:"ERICA 컨벤션센터",textColor:"#FFFFFF"},
    playlist:[{version:"1.3.0",title:"V1.3.0 재생목록",textColor:"#FFFFFF"}]
  };
  assert.equal(fixture.version,"1.0.1");
  assert.ok(fixture.state);
  assert.equal(typeof fixture.state.title,"string");
  assert.equal(fixture130.version,"1.3.0");
  assert.equal(fixture130.state.version,"1.3.0");
  assert.equal(fixture130.playlist[0].version,"1.3.0");
  assert.match(script,/state=normalizeState\(data\.state\|\|data\)/);
  assert.match(script,/playlist\.map\(normalizeState\)/);
  assert.match(script,/hasLegacyColor\?"manual":"auto"/);
});

console.log(`\n검증 완료: V${appVersion}, 템플릿 ${templates.length}종`);
