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
  // Destructured/default parameters can contain braces before the function body.
  let parameterDepth=0;
  let parameterEnd=-1;
  for(let i=source.indexOf("(",start);i<source.length;i++){
    if(source[i]==="(")parameterDepth++;
    if(source[i]===")"&&--parameterDepth===0){parameterEnd=i;break;}
  }
  assert.ok(parameterEnd>=0,`${name} 함수 매개변수 끝을 찾지 못했습니다.`);
  const brace=source.indexOf("{",parameterEnd);
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
  assert.equal(appVersion,"1.5.1");
  assert.equal(releaseName,"NOTICE FRAME");
  assert.equal(pkg.version,appVersion);
  assert.match(index,new RegExp(`id="appVersionCurrent">V${appVersion} · ${releaseName}<`));
  assert.equal(readme.split(/\r?\n/,1)[0],`디지털 사이니지 제작기 V${appVersion} · ${releaseName}`);
  assert.match(script,/version:APP_VERSION/);
  assert.match(script,/merged\.version=APP_VERSION/);
});

check("템플릿 32종 및 그룹별 개수",()=>{
  assert.equal(templates.length,32);
  assert.equal(new Set(templates.map(item=>item.id)).size,32);
  assert.equal(templates.filter(item=>item.group==="basic").length,7);
  assert.equal(templates.filter(item=>item.group==="designer").length,9);
  assert.equal(templates.filter(item=>item.group==="image").length,10);
  assert.equal(templates.filter(item=>item.group==="brand").length,6);
});

check("웜 웰컴 우선 표시와 기존 템플릿 ID·자산 연결 보존",()=>{
  assert.equal(templates[0].id,23);
  assert.equal(templates[0].group,"basic");
  assert.equal(templates[0].name,"01 · 브라운 클래식");
  assert.equal(templates[0].path,"templates/signage_vertical_06_brown_classic_frame.svg");
  assert.ok(fs.existsSync(path.join(root,templates[0].path)),"브라운 클래식 세로형 배경이 없습니다.");
  assert.ok(readme.includes(templates[0].path),"브라운 클래식 배경 경로가 README에 없습니다.");
  const welcomeSvg=fs.readFileSync(path.join(root,templates[0].path),"utf8");
  assert.match(welcomeSvg,/viewBox="0 0 1080 1920"/);
  assert.match(welcomeSvg,/id="gold"/);
  assert.equal(templates[1].id,1,"기존 ERICA 블루는 두 번째 시안으로 유지해야 합니다.");
  templates.forEach((item,i)=>assert.equal(Number(item.name.match(/^\d+/)?.[0]),i+1,
    `${item.name}: 시안 표시 번호가 순서와 다릅니다.`));
  const originalPaths={
    1:"",2:"",3:"",4:"",5:"",6:"",
    7:"templates/signage_01.png",8:"templates/signage_02.png",9:"templates/signage_03.png",
    10:"",11:"",12:"",13:"",14:"",15:"",
    16:"templates/signage_04.png",17:"templates/signage_05.png",
    18:"templates/signage_vertical_01_navy_gold_letterhead.png",
    19:"templates/signage_vertical_02_navy_gold_border.png",
    20:"templates/signage_vertical_03_blue_wave.png",
    21:"templates/signage_vertical_04_navy_gold_curve_frame.png",
    22:"templates/signage_vertical_05_ivory_gold_frame.png"
  };
  for(const [id,originalPath] of Object.entries(originalPaths)){
    const item=templates.find(template=>template.id===Number(id));
    assert.ok(item,`기존 템플릿 ID ${id}가 사라졌습니다.`);
    assert.equal(item.path,originalPath,`ID ${id}에 저장된 기존 배경이 바뀌었습니다.`);
  }
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

check("디자이너 원본 9종과 글자 스타일 프리셋",()=>{
  const designer=templates.filter(item=>item.group==="designer");
  assert.equal(designer.map(item=>item.id).join(","),"24,25,26,27,28,29,30,31,32");
  assert.equal(designer.filter(item=>item.name.includes("공지사항")).length,3);
  assert.equal(designer.filter(item=>item.name.includes("행사")).length,3);
  assert.equal(designer.filter(item=>item.name.includes("시그니처")).length,3);
  const noticeFrames=designer.filter(item=>item.name.includes("공지사항"));
  assert.ok(noticeFrames.every(item=>item.preset.blocks.emphasis.background==="rgba(14,74,132,.10)"),"공지사항 문의 프레임의 색상·투명도가 클래식과 다릅니다.");
  for(const item of designer){
    const asset=path.join(root,item.path);
    assert.ok(fs.existsSync(asset),`${item.name}: ${item.path} 없음`);
    assert.ok(readme.includes(item.path),`${item.path}: README 목록 누락`);
    const png=fs.readFileSync(asset);
    assert.equal(png.toString("ascii",1,4),"PNG",`${item.path}: PNG 형식 아님`);
    assert.equal(png.readUInt32BE(16),4501,`${item.path}: 원본 너비 변경`);
    assert.equal(png.readUInt32BE(20),8001,`${item.path}: 원본 높이 변경`);
    assert.equal(item.quick.labels.length,3,`${item.name}: QUICK START 라벨 누락`);
    assert.equal(item.quick.placeholders.length,3,`${item.name}: QUICK START 예시 누락`);
    assert.ok(item.preset?.text?.title,`${item.name}: 제목 예시 누락`);
    assert.ok(item.preset?.text?.subtitle,`${item.name}: 보조 문구 예시 누락`);
    assert.ok(item.preset?.text?.body,`${item.name}: 일정·장소 예시 누락`);
    for(const key of ["title","subtitle","body"]){
      assert.ok(item.preset.blocks[key],`${item.name}: ${key} 배치 누락`);
      assert.ok(item.preset.colors[key],`${item.name}: ${key} 색상 누락`);
    }
  }
  assert.match(script,/function applyDesignerPreset\(template\)/);
  assert.match(script,/state\.textColorModes=defaultTextColorModes\("manual"\)/);
  assert.match(script,/if\(t\.preset\)applyDesignerPreset\(t\)/);
  assert.match(script,/function mergedPresetTextBlocks\(template\)/);
  assert.match(script,/\$\("quickStartHeading"\)\.textContent=quick\.heading/);
  assert.match(script,/el\.style\.fontWeight=cfg\.fontWeight/);
  assert.match(script,/el\.style\.background=cfg\.background/);
  assert.match(script,/templateOverlay\.style\.background=t\.preset/);
  assert.match(script,/page\.dataset\.designerPreset=t\.presetKey/);
  for(const tone of ["black","blue","white"]){
    const item=designer.find(template=>template.presetKey===`signature-${tone}`);
    assert.ok(item,`${tone}: 시그니처 프리셋 누락`);
    assert.ok(item.preset.blocks.subtitle.letterSpacing>0,`${tone}: 넓은 행사명 자간 누락`);
    assert.ok(item.preset.blocks.subtitle.lineHeight<=1.04,`${tone}: 촘촘한 행사명 행간 누락`);
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
  for(const id of ["spacingTarget","lineHeight","letterSpacing"]){
    assert.match(index,new RegExp(`<label for="${id}"`),`${id}: 행간·자간 label 누락`);
  }
  for(const id of ["quickEventName","quickDate","quickLocation"]){
    assert.match(index,new RegExp(`<label for="${id}"`),`${id}: QUICK START label 누락`);
  }
  assert.match(index,/id="resetAllTop"/);
});

check("항목별 행간·자간 조절과 출력·저장 계약",()=>{
  for(const id of ["spacingTarget","lineHeight","lineHeightOut","letterSpacing","letterSpacingOut","resetSpacing"]){
    assert.match(index,new RegExp(`id="${id}"`),`${id}: 행간·자간 컨트롤 누락`);
  }
  assert.match(script,/el\.style\.lineHeight=String\(cfg\.lineHeight\)/);
  assert.match(script,/el\.style\.letterSpacing=cfg\.letterSpacing\+"em"/);
  assert.match(script,/state\.textBlocks\[spacingTargetKey\]\.lineHeight=/);
  assert.match(script,/state\.textBlocks\[spacingTargetKey\]\.letterSpacing=/);
  assert.match(script,/cfg\.lineHeight,cfg\.letterSpacing,cfg\.align/);

  const context=stateContext();
  const legacy=context.normalizeState({version:"1.3.1",template:1});
  assert.equal(legacy.textBlocks.title.lineHeight,1.15);
  assert.equal(legacy.textBlocks.title.letterSpacing,-.045);
  assert.equal(legacy.textBlocks.body.lineHeight,1.58);
  assert.equal(legacy.textBlocks.body.letterSpacing,-.015);

  const customized=context.normalizeState({
    version:"1.5.0",layout:"warm-welcome",
    textBlocks:{title:{lineHeight:1.8,letterSpacing:.065}}
  });
  assert.equal(customized.textBlocks.title.lineHeight,1.8);
  assert.equal(customized.textBlocks.title.letterSpacing,.065);
  const clamped=context.normalizeState({
    version:"1.5.0",layout:"warm-welcome",
    textBlocks:{title:{lineHeight:8,letterSpacing:-2}}
  });
  assert.equal(clamped.textBlocks.title.lineHeight,2.2);
  assert.equal(clamped.textBlocks.title.letterSpacing,-.1);
});

check("상단·하단 전체 초기화가 같은 안전한 기본화면 복귀 동작 사용",()=>{
  const resetSource=functionSource(script,"resetAllWork");
  assert.match(resetSource,/localStorage\.removeItem\("digitalSignageMakerV1"\)/);
  assert.match(resetSource,/state=normalizeState\(freshState\(\)\)/);
  assert.match(resetSource,/playlist=\[\]/);
  assert.match(resetSource,/selectedPlaylistIndex=-1/);
  assert.match(resetSource,/setEditorMode\("quick"\)/);
  assert.match(script,/\$\("resetAll"\)\.onclick=resetAllWork/);
  assert.match(script,/\$\("resetAllTop"\)\.onclick=resetAllWork/);
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

function stateContext(){
  const context=Object.create(null);
  vm.runInNewContext([
    `const APP_VERSION=${JSON.stringify(appVersion)};`,
    'const RICH_KEYS=["title","subtitle","body","emphasis","footer"];',
    functionSource(script,"clamp"),
    functionSource(script,"normalizeColor"),
    functionSource(script,"escapeHtml"),
    // These fixtures contain trusted rich markup. Browser QA covers DOM sanitizing;
    // the real migration function still handles escaping and newline conversion.
    'function sanitizeRichHtml(value){return String(value??"");}',
    functionSource(script,"migrateRich"),
    functionSource(script,"defaultTextBlocks"),
    functionSource(script,"defaultObjects"),
    functionSource(script,"defaultTextColors"),
    functionSource(script,"defaultTextColorModes"),
    functionSource(script,"freshState"),
    functionSource(script,"normalizeState")
  ].join("\n"),context);
  return context;
}

function plainObject(value){return JSON.parse(JSON.stringify(value));}

check("새 작업의 환영 문구·정보 블록·중앙 ERICA 로고",()=>{
  const context=stateContext();
  const welcome=context.freshState();
  assert.equal(welcome.version,appVersion);
  assert.equal(welcome.layout,"warm-welcome");
  assert.equal(welcome.template,23);
  assert.equal(welcome.title,"OOO대학 OOO방문단의\nERICA 방문을 환영합니다");
  assert.equal(welcome.title.split("\n").length,2);
  assert.ok(!welcome.title.includes("\\n"),"기본 문구에 문자 그대로의 \\n이 노출되면 안 됩니다.");
  assert.equal(welcome.subtitle,"20XX년 X월 X일");
  assert.equal(welcome.body,"본관 2층 프라임 컨퍼런스 홀");
  const {title,subtitle,body}=welcome.textBlocks;
  assert.ok(title.size>=88&&title.size<=116);
  assert.ok(subtitle.size>=50&&subtitle.size<=64);
  assert.ok(body.size>=50&&body.size<=64);
  assert.ok(title.size>subtitle.size&&title.size>body.size);
  assert.ok(title.fitMin>=60&&title.fitMin<=title.size);
  assert.ok(subtitle.fitMin>=50&&body.fitMin>=50);
  assert.ok(title.w>=80&&title.w<=85);
  assert.ok(title.y>=20&&title.y<=40);
  assert.ok(title.y<subtitle.y&&subtitle.y<body.y);
  assert.ok(body.y-title.y<30,"안내 정보가 화면 전체에 흩어지면 안 됩니다.");
  for(const block of [title,subtitle,body]){
    assert.equal(block.x,50);
    assert.equal(block.align,"center");
  }
  const logo=welcome.objects.logo1;
  assert.equal(logo.x,50);
  assert.ok(logo.y>=85&&logo.y<=93);
  assert.match(logo.src,/^logos\/hyu_erica(?:_white)?\.png$/);
  assert.ok(fs.existsSync(path.join(root,logo.src)),"기본 ERICA 로고가 없습니다.");
  assert.ok(logo.aspect>0);
  assert.equal(welcome.objects.logo2.src,"");
  assert.ok(Object.values(welcome.textColorModes).every(mode=>mode==="auto"));
});

check("V1.0.1 / V1.3.0 / V1.3.1 부분 작업의 원래 기본값 보존",()=>{
  const context=stateContext();
  for(const version of ["1.0.1","1.3.0","1.3.1"]){
    for(let template=1;template<=22;template++){
      const original={version,template,title:`${version} 행사\n두 번째 줄`,textColor:"#FFFFFF"};
      const restored=context.normalizeState(original);
      assert.equal(restored.version,appVersion);
      assert.equal(restored.layout,"legacy");
      assert.equal(restored.template,template);
      assert.equal(restored.title,`${version} 행사<br>두 번째 줄`);
      for(const [key,size,y] of [["title",86,13],["subtitle",46,28],["body",38,43]]){
        assert.equal(restored.textBlocks[key].size,size,`${version} ${key}: 기존 크기 변경`);
        assert.equal(restored.textBlocks[key].y,y,`${version} ${key}: 기존 위치 변경`);
        assert.equal(restored.textBlocks[key].fitMin,undefined,`${version}: 자동 축소가 소급 적용됨`);
      }
      for(const [key,x] of [["logo1",35],["logo2",65]]){
        assert.equal(restored.objects[key].src,"",`${version}: 이전 작업에 로고가 추가됨`);
        assert.equal(restored.objects[key].x,x);
        assert.equal(restored.objects[key].y,92);
      }
      assert.ok(Object.values(restored.textColorModes).every(mode=>mode==="manual"));
      assert.equal(original.title,`${version} 행사\n두 번째 줄`,"불러오기가 원본 데이터를 변경했습니다.");
    }
    assert.equal(context.normalizeState({version}).template,1);
  }

  assert.equal(fixture.version,"1.0.1");
  const migrated=context.normalizeState(fixture.state);
  assert.equal(migrated.title,fixture.state.title);
  assert.equal(migrated.body,"첫 문단<br>둘째 문단<br>Third line");
  assert.equal(migrated.objects.logo1.src,"");
  const customized=context.normalizeState({
    version:"1.3.1",template:8,title:"기존 사용자 행사",
    textBlocks:{title:{x:46,y:17,size:91,align:"left"}},
    objects:{logo1:{src:"logos/hyu_erica.png",x:41,y:87,w:32}},
    textColor:"#FFFFFF",textColors:{title:"#123456"},textColorModes:{title:"manual",body:"auto"}
  });
  assert.equal(customized.textBlocks.title.size,91);
  assert.equal(customized.textBlocks.title.x,46);
  assert.equal(customized.textBlocks.title.y,17);
  assert.equal(customized.textBlocks.title.align,"left");
  assert.equal(customized.objects.logo1.src,"logos/hyu_erica.png");
  assert.equal(customized.objects.logo1.x,41);
  assert.equal(customized.objects.logo1.w,32);
  assert.equal(customized.textColors.title,"#123456");
  assert.equal(customized.textColorModes.title,"manual");
  assert.equal(customized.textColorModes.body,"auto");
  assert.match(script,/state=normalizeState\(data\.state\|\|data\)/);
  assert.match(script,/playlist\.map\(normalizeState\)/);
  assert.match(script,/hasLegacyColor\?"manual":"auto"/);
});

check("웜 웰컴 저장·불러오기와 수동 크기·색상·배치 보존",()=>{
  const context=stateContext();
  const welcome=context.normalizeState(context.freshState());
  assert.equal(welcome.title,"OOO대학 OOO방문단의<br>ERICA 방문을 환영합니다");
  const restored=context.normalizeState(plainObject(welcome));
  assert.deepEqual(plainObject(restored),plainObject(welcome));

  welcome.template=7;
  welcome.title="<strong>수정한 행사명</strong><br>두 번째 줄";
  welcome.textBlocks.title={...welcome.textBlocks.title,x:47,y:25,size:92,fitMin:null};
  welcome.textColors.title="#123456";
  welcome.textColorModes.title="manual";
  welcome.objects.logo1.x=48;
  const edited=context.normalizeState(plainObject(welcome));
  assert.deepEqual(plainObject(edited),plainObject(welcome));
  assert.equal(edited.layout,"warm-welcome");
  assert.equal(edited.textBlocks.title.fitMin,null,"수동 크기에 자동 축소를 다시 적용하면 안 됩니다.");
  assert.equal(edited.textBlocks.body.fitMin,welcome.textBlocks.body.fitMin);
});

check("명시적 줄의 자동 크기 조절·최소 크기·수동 설정·축척 독립성",()=>{
  const context=Object.create(null);
  vm.runInNewContext(`const PAGE_W=1080;\n${functionSource(script,"fitTextSize")}`,context);
  function measure(options={}){
    const {size=100,w=84,measured=1200,text="첫 줄\n두 번째 줄",scale=1}=options;
    const fitMin=Object.prototype.hasOwnProperty.call(options,"fitMin")?options.fitMin:64;
    const cfg=Object.freeze({size,fitMin,w});
    let reads=0;
    const element={
      textContent:text,
      style:{fontSize:`${size}px`,width:`${w}%`,whiteSpace:"",transform:`scale(${scale})`},
      dataset:{},
      get scrollWidth(){
        reads++;
        assert.equal(this.style.whiteSpace,"pre","명시적 줄바꿈을 유지한 채 측정해야 합니다.");
        assert.equal(this.style.width,"max-content");
        return measured;
      },
      getBoundingClientRect(){throw new Error("변환된 미리보기 크기로 글자 크기를 계산하면 안 됩니다.");}
    };
    const actual=context.fitTextSize(element,cfg);
    assert.equal(element.style.fontSize,`${actual}px`);
    assert.equal(element.dataset.renderedSize,String(actual));
    assert.equal(element.style.width,`${w}%`);
    assert.equal(element.style.whiteSpace,"");
    assert.equal(cfg.size,size,"자동 축소가 요청 글자 크기를 덮어썼습니다.");
    return {actual,reads};
  }
  assert.equal(measure({measured:700}).actual,100,"짧은 문구를 불필요하게 축소했습니다.");
  for(const scale of [.18,.48,1,2])assert.equal(measure({scale}).actual,75);
  assert.equal(measure({measured:2400}).actual,64,"긴 문구가 최소 글자 크기 아래로 줄었습니다.");
  assert.equal(measure({size:48,fitMin:64,measured:2400}).actual,48,"최소 크기로 인해 수동 요청값보다 커졌습니다.");
  assert.deepEqual(measure({size:92,fitMin:null,measured:2400}),{actual:92,reads:0});
  assert.deepEqual(measure({size:92,fitMin:undefined,measured:2400}),{actual:92,reads:0});
  assert.deepEqual(measure({text:"   ",measured:2400}),{actual:100,reads:0});
});

console.log(`\n검증 완료: V${appVersion}, 템플릿 ${templates.length}종`);
