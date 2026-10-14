const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>[...c.querySelectorAll(s)];

let xp=0;
const earned=new Set();
function award(key,n=10){
  if(earned.has(key)) return;
  earned.add(key); xp+=n; $('#xp').textContent=xp;
}

// ---------- sound ----------
let soundOn=true;
let audioCtx=null;
function tone(freq=440,duration=.08,type='square',gain=.045,delay=0){
  if(!soundOn) return;
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;o.frequency.value=freq;g.gain.value=0;
    o.connect(g);g.connect(audioCtx.destination);
    const t=audioCtx.currentTime+delay;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+duration);
    o.start(t);o.stop(t+duration+.02);
  }catch(e){}
}
function sfx(name){
  if(name==='click') tone(330,.045,'square',.025);
  if(name==='correct'){tone(520,.07,'square',.035);tone(720,.10,'square',.035,.075)}
  if(name==='wrong'){tone(170,.12,'sawtooth',.035);tone(120,.15,'sawtooth',.025,.08)}
  if(name==='start'){tone(340,.06);tone(500,.06,'square',.03,.07);tone(680,.09,'square',.03,.14)}
  if(name==='level'){tone(440,.06);tone(660,.06,'square',.03,.07);tone(880,.13,'square',.035,.14)}
}
$('#soundToggle').addEventListener('click',()=>{
  soundOn=!soundOn;$('#soundToggle').classList.toggle('off',!soundOn);$('#soundToggle').setAttribute('aria-pressed',String(soundOn));$('#soundToggle').textContent=soundOn?'🔊 Sound':'🔇 Sound';
  if(soundOn)sfx('click');
});
document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('#soundToggle'))sfx('click')});

// ---------- navigation / reveals ----------
$$('[data-jump]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.jump)?.scrollIntoView({behavior:'smooth'})));
$$('.flip').forEach(card=>card.addEventListener('click',()=>card.classList.toggle('flipped')));

const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.07});
$$('.zone>*').forEach(el=>{el.classList.add('reveal');io.observe(el)});
addEventListener('scroll',()=>{
  const d=document.documentElement,max=d.scrollHeight-d.clientHeight;
  $('#scrollProgress').style.width=(max?d.scrollTop/max*100:0)+'%';
  let active='';
  $$('.zone').forEach(z=>{if(scrollY>=z.offsetTop-125)active=z.id});
  $$('nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+active));
},{passive:true});

// ---------- GAME 1: CIA Defender ----------
const ciaThreats=[
  {text:'Attacker steals the customer database',hint:'Sensitive records are exposed',a:'C'},
  {text:'Someone secretly changes exam marks',hint:'The data is no longer accurate',a:'I'},
  {text:'A DDoS attack takes the website offline',hint:'Legitimate users cannot reach the service',a:'A'},
  {text:'A stranger reads private medical records',hint:'Information is disclosed without permission',a:'C'},
  {text:'Malware changes bank account balances',hint:'Trusted values are modified',a:'I'},
  {text:'Ransomware stops hospital computers working',hint:'The service cannot be used when needed',a:'A'},
  {text:'An employee emails secret designs outside',hint:'Protected information leaves the organisation',a:'C'},
  {text:'An attacker edits a software update package',hint:'The package can no longer be trusted',a:'I'}
];
let ciaRunning=false,ciaRound=0,ciaLives=3,ciaScore=0,ciaClock=null,ciaAnswered=false;
function updateLives(){ $('#ciaLives').textContent='❤'.repeat(Math.max(ciaLives,0))+'♡'.repeat(Math.max(0,3-ciaLives)); }
function stopCIAClock(){clearInterval(ciaClock);ciaClock=null}
function nextCIA(){
  stopCIAClock();
  if(ciaLives<=0||ciaRound>=ciaThreats.length){
    ciaRunning=false;$('#startCIA').style.display='inline-block';
    const win=ciaLives>0;
    $('#attackCard').classList.remove('attack-live');
    $('#attackCard').innerHTML='<b>'+(win?'MISSION COMPLETE':'SYSTEM BREACHED')+'</b><span>Final score: '+ciaScore+'</span>';
    $('#ciaFeedback').textContent=win?'Strong CIA classification. You protected the system.':'Re-run the mission and focus on what each attack harms.';
    $('#ciaFeedback').className='feedback '+(win?'good':'bad');
    if(win){award('cia',25);sfx('level')}else sfx('wrong');
    return;
  }
  const t=ciaThreats[ciaRound];ciaAnswered=false;
  const card=$('#attackCard');card.classList.remove('attack-live');void card.offsetWidth;card.classList.add('attack-live');
  card.innerHTML='<b>'+t.text+'</b><span>'+t.hint+'</span>';
  let left=100;$('#ciaTimer').style.transform='scaleX(1)';
  ciaClock=setInterval(()=>{
    left-=1.25;$('#ciaTimer').style.transform='scaleX('+(left/100)+')';
    if(left<=0){
      stopCIAClock();if(ciaAnswered)return;ciaAnswered=true;ciaLives--;updateLives();sfx('wrong');
      $('#ciaFeedback').textContent='Too slow — that attack reached the system. Correct answer: '+t.a+'.';$('#ciaFeedback').className='feedback bad';
      ciaRound++;setTimeout(nextCIA,700);
    }
  },50);
}
$('#startCIA').addEventListener('click',()=>{
  if(ciaRunning)return;ciaRunning=true;ciaRound=0;ciaLives=3;ciaScore=0;$('#ciaScore').textContent='0';updateLives();$('#startCIA').style.display='none';sfx('start');nextCIA();
});
$$('[data-cia]').forEach(b=>b.addEventListener('click',()=>{
  if(!ciaRunning||ciaAnswered)return;ciaAnswered=true;stopCIAClock();
  const t=ciaThreats[ciaRound],ok=b.dataset.cia===t.a;
  if(ok){ciaScore+=10;$('#ciaScore').textContent=ciaScore;sfx('correct');$('#ciaFeedback').textContent='Correct — '+t.a+' is the primary property under attack.';$('#ciaFeedback').className='feedback good'}
  else{ciaLives--;updateLives();sfx('wrong');$('#ciaFeedback').textContent='Not quite. This primarily affects '+t.a+'.';$('#ciaFeedback').className='feedback bad'}
  ciaRound++;setTimeout(nextCIA,650);
}));

// ---------- GAME 2: Defense in Depth ----------
const defenses=[
  {id:'physical',name:'Locked server room',cost:2,protect:['physical']},
  {id:'firewall',name:'Firewall + segmentation',cost:3,protect:['network','dos']},
  {id:'mfa',name:'MFA + least privilege',cost:2,protect:['identity','phish']},
  {id:'app',name:'Input validation + patching',cost:2,protect:['application','exploit']},
  {id:'monitor',name:'Monitoring + backups',cost:3,protect:['ransomware','recovery','detect']}
];
const waves=[
  {name:'Wave 1: Stolen admin password',tags:['identity','phish'],damage:35},
  {name:'Wave 2: Internet exploit attempt',tags:['application','exploit'],damage:35},
  {name:'Wave 3: Ransomware + service disruption',tags:['ransomware','recovery','dos'],damage:40}
];
let bought=new Set(),budget=10;
function renderDefenseShop(){
  const host=$('#defenseShop');host.innerHTML='';
  defenses.forEach(d=>{
    const b=document.createElement('button');b.classList.toggle('selected',bought.has(d.id));
    b.innerHTML='<b>'+d.name+'</b><span>Cost '+d.cost+' · '+d.protect.slice(0,2).join(' / ')+'</span>';
    b.addEventListener('click',()=>{
      if(bought.has(d.id)){bought.delete(d.id);budget+=d.cost}
      else if(budget>=d.cost){bought.add(d.id);budget-=d.cost;sfx('correct')}
      else{sfx('wrong');return}
      $('#budget').textContent=budget;renderDefenseShop();
      $('#selectedDefense').textContent=bought.size?'Purchased: '+[...bought].map(id=>defenses.find(d=>d.id===id).name).join(' · '):'No defenses purchased yet.';
    });host.appendChild(b);
  });
}
$('#runWaves').addEventListener('click',()=>{
  let health=100;const log=$('#waveLog');log.innerHTML='';sfx('start');
  waves.forEach((w,i)=>setTimeout(()=>{
    const active=defenses.filter(d=>bought.has(d.id));
    const blocked=active.some(d=>d.protect.some(p=>w.tags.includes(p)));
    const dmg=blocked?7:w.damage;health=Math.max(0,health-dmg);$('#depthHealth').textContent=health;
    const row=document.createElement('div');row.className=blocked?'hit':'damage';row.textContent=w.name+' → '+(blocked?'layer absorbed most of the attack (-7%)':'no suitable layer (-'+dmg+'%)');log.appendChild(row);
    sfx(blocked?'correct':'wrong');
    if(i===waves.length-1){
      setTimeout(()=>{
        if(health>=70){award('depth',20);sfx('level');const x=document.createElement('div');x.className='hit';x.textContent='SURVIVED: layered defenses kept the system resilient.';log.appendChild(x)}
        else{const x=document.createElement('div');x.className='damage';x.textContent='FAILED: add complementary layers and try again.';log.appendChild(x)}
      },500);
    }
  },i*650));
});
renderDefenseShop();

// ---------- GAME 3: Threat model builder ----------
const tmScenarios=[
  {
    title:'Online school portal',
    desc:'Students submit assignments and teachers record grades.',
    steps:[
      {stage:'Asset',correct:'Student grades and accounts',opts:['Student grades and accounts','Random Internet scanner','Weak password policy']},
      {stage:'Threat',correct:'Credential-stealing attacker',opts:['Credential-stealing attacker','Encrypted backup','Student grades and accounts']},
      {stage:'Vulnerability',correct:'Weak reused passwords',opts:['Weak reused passwords','MFA','Teacher timetable']},
      {stage:'Control',correct:'MFA + login monitoring',opts:['MFA + login monitoring','Publish all passwords','Remove backups']}
    ]
  },
  {
    title:'Hospital appointment system',
    desc:'Patients book appointments and staff access sensitive records.',
    steps:[
      {stage:'Asset',correct:'Patient records and service availability',opts:['Patient records and service availability','DDoS botnet','Missing patch']},
      {stage:'Threat',correct:'Ransomware operator',opts:['Ransomware operator','Encrypted database','Patch management']},
      {stage:'Vulnerability',correct:'Unpatched public server',opts:['Unpatched public server','Offline backup','Security awareness']},
      {stage:'Control',correct:'Patch + segmentation + backups',opts:['Patch + segmentation + backups','Disable monitoring','Share one admin account']}
    ]
  }
];
let tmScenarioIndex=0,tmStep=0;
function renderTM(){
  const s=tmScenarios[tmScenarioIndex],step=s.steps[tmStep];
  $('#tmPrompt').textContent='Scenario: '+s.title;$('#tmStage').textContent=(tmStep+1)+'/4';
  $('#tmScenario').innerHTML='<b>Current stage: '+step.stage+'</b><p>'+s.desc+'</p>';
  const host=$('#tmOptions');host.innerHTML='';
  [...step.opts].sort(()=>Math.random()-.5).forEach(opt=>{
    const b=document.createElement('button');b.textContent=opt;b.addEventListener('click',()=>{
      if(host.dataset.done)return;host.dataset.done='1';const ok=opt===step.correct;
      b.classList.add(ok?'correct':'wrong');
      if(ok){sfx('correct');$('#tmFeedback').textContent='Correct. That is the '+step.stage.toLowerCase()+' in this scenario.';$('#tmFeedback').className='feedback good';tmStep++;
        setTimeout(()=>{host.dataset.done='';if(tmStep>=4){award('tm'+tmScenarioIndex,18);sfx('level');tmScenarioIndex=(tmScenarioIndex+1)%tmScenarios.length;tmStep=0}renderTM()},800);
      }else{sfx('wrong');$('#tmFeedback').textContent='Not this stage. Keep asset, threat, vulnerability and control separate.';$('#tmFeedback').className='feedback bad';setTimeout(()=>{host.dataset.done=''},450)}
    });host.appendChild(b);
  });
}
renderTM();

// ---------- GAME 4: Patch race ----------
let patchTimer=null,patchRiskTimer=null,patchRunning=false,patched=new Set(),risk=0;
function buildServers(){
  const host=$('#serverGrid');host.innerHTML='';patched=new Set();
  for(let i=0;i<8;i++){
    const b=document.createElement('button');b.className='server';b.dataset.server=i;b.innerHTML='<span>SERVER '+String(i+1).padStart(2,'0')+'</span><b>Apache service</b><small>Status: waiting</small>';
    b.addEventListener('click',()=>{
      if(!patchRunning||!b.classList.contains('vulnerable')||patched.has(i))return;
      patched.add(i);b.classList.remove('vulnerable');b.classList.add('patched');b.querySelector('small').textContent='Status: patched ✓';$('#patchedCount').textContent=patched.size+'/8';sfx('correct');
      if(patched.size===8)endPatch(true);
    });host.appendChild(b);
  }
}
function exposeRandomServer(){
  const choices=$$('.server').filter((b,i)=>!patched.has(i)&&!b.classList.contains('vulnerable'));
  if(!choices.length)return;
  const b=choices[Math.floor(Math.random()*choices.length)];b.classList.add('vulnerable');b.querySelector('small').textContent='Status: vulnerable — PATCH NOW';
}
function endPatch(success){
  patchRunning=false;clearInterval(patchTimer);clearInterval(patchRiskTimer);
  if(success){$('#patchFeedback').textContent='All servers patched before breach. Operational discipline turned a known fix into real protection.';$('#patchFeedback').className='feedback good';award('patch',25);sfx('level')}
  else{$('#patchFeedback').textContent='Breach meter reached 100%. A known vulnerability remained exposed too long.';$('#patchFeedback').className='feedback bad';sfx('wrong')}
  $('#startPatchGame').style.display='inline-block';
}
$('#startPatchGame').addEventListener('click',()=>{
  if(patchRunning)return;buildServers();patchRunning=true;risk=0;$('#breachRisk').textContent='0';$('#patchedCount').textContent='0/8';$('#startPatchGame').style.display='none';$('#patchFeedback').textContent='Patch red servers before risk reaches 100%.';$('#patchFeedback').className='feedback';sfx('start');
  exposeRandomServer();
  patchTimer=setInterval(exposeRandomServer,650);
  patchRiskTimer=setInterval(()=>{risk=Math.min(100,risk+2);$('#breachRisk').textContent=risk;if(risk>=100)endPatch(false)},190);
});
buildServers();

// ---------- GAME 5: Privacy / consent ----------
const privacyRounds=[
  {
    text:'A flashlight app asks for your contacts, precise location, microphone and photo library even though none are required for the flashlight.',
    opts:['Collect everything because it may be useful later','Collect only data required for the feature','Hide the collection in the terms'],
    a:1,why:'Data minimisation: only collect what is genuinely needed.'
  },
  {
    text:'A fitness app wants to share health data with advertisers.',
    opts:['Explain the purpose clearly and ask for meaningful opt-in consent','Share automatically because the app is free','Use a pre-ticked box hidden at the bottom'],
    a:0,why:'Sensitive secondary use should be transparent and based on meaningful consent.'
  },
  {
    text:'A school tracking app stores precise student location forever.',
    opts:['Keep it forever just in case','Use a defined retention period and delete when no longer required','Make the database public'],
    a:1,why:'Retention should match the purpose; unnecessary long-term storage increases privacy and breach risk.'
  },
  {
    text:'A company collected data for account security and now wants to use it for unrelated behavioural advertising.',
    opts:['Use it silently','Explain the new purpose and obtain appropriate consent','Assume the original consent covers everything forever'],
    a:1,why:'A new purpose can require new transparency and consent.'
  }
];
let privacyIndex=0,trust=100;
function renderPrivacyGame(){
  const r=privacyRounds[privacyIndex];$('#privacyPrompt').textContent='Choose the most ethical design.';$('#privacyScenario').innerHTML='<b>Scenario '+(privacyIndex+1)+'</b><p>'+r.text+'</p>';
  const host=$('#privacyOptions');host.innerHTML='';
  r.opts.forEach((opt,i)=>{
    const b=document.createElement('button');b.textContent=opt;b.addEventListener('click',()=>{
      if(host.dataset.done)return;host.dataset.done='1';const ok=i===r.a;b.classList.add(ok?'correct':'wrong');
      if(ok){sfx('correct');$('#privacyFeedback').textContent='Good choice. '+r.why;$('#privacyFeedback').className='feedback good';award('privacy'+privacyIndex,8)}
      else{trust=Math.max(0,trust-20);$('#trustScore').textContent=trust;sfx('wrong');$$('button',host)[r.a].classList.add('correct');$('#privacyFeedback').textContent='That design reduces user trust. '+r.why;$('#privacyFeedback').className='feedback bad'}
      setTimeout(()=>{privacyIndex=(privacyIndex+1)%privacyRounds.length;host.dataset.done='';renderPrivacyGame()},1100);
    });host.appendChild(b);
  });
}
renderPrivacyGame();

// ---------- GAME 6: Security vs usability ----------
const loginControls=[
  {id:'passphrase',label:'Allow long passphrases + password managers',sec:20,use:5},
  {id:'mfa',label:'Require MFA for login',sec:30,use:-12},
  {id:'risk',label:'Use risk-based step-up for unusual logins',sec:25,use:8},
  {id:'captcha',label:'CAPTCHA on every single login',sec:8,use:-25},
  {id:'timeout',label:'Force logout every 2 minutes',sec:12,use:-35}
];
function renderLoginControls(){
  const host=$('#loginOptions');host.innerHTML='';
  loginControls.forEach(c=>{
    const label=document.createElement('label');label.innerHTML='<input type="checkbox" value="'+c.id+'"><span>'+c.label+'</span>';host.appendChild(label);
  });
}
$('#testLogin').addEventListener('click',()=>{
  const selected=$$('#loginOptions input:checked').map(x=>x.value);
  let sec=35,use=70;
  selected.forEach(id=>{const c=loginControls.find(x=>x.id===id);sec+=c.sec;use+=c.use});
  sec=Math.max(0,Math.min(100,sec));use=Math.max(0,Math.min(100,use));$('#securityValue').textContent=sec;$('#usabilityValue').textContent=use;
  const tilt=Math.max(-18,Math.min(18,(use-sec)/3));$('#balanceBeam').style.transform='translate(-50%,-50%) rotate('+tilt+'deg)';
  const ok=sec>=75&&use>=55;
  $('#loginFeedback').textContent=ok?'Balanced design: strong banking protection without unnecessary friction.':'Try again. Aim for security ≥75 while keeping usability ≥55. Stronger is not always better if users cannot work.';
  $('#loginFeedback').className='feedback '+(ok?'good':'bad');sfx(ok?'correct':'wrong');if(ok)award('balance',20);
});
renderLoginControls();

// ---------- GAME 7: AI fairness audit ----------
const dotHost=$('#biasDots');
for(let i=0;i<18;i++){const x=document.createElement('i');x.className=i<14?'g1':'g2';dotHost.appendChild(x)}
const biasRounds=[
  {q:'A face model is trained on 95% images from one demographic group and 5% from everyone else.',opts:['Likely fairness risk','Automatically fair','Bias impossible'],a:0,why:'Severe under-representation can produce uneven performance.'},
  {q:'A hiring model is trained on historical decisions from a company where one group was rarely hired.',opts:['Historical bias can be learned','History guarantees fairness','No need to test subgroups'],a:0,why:'Models can reproduce patterns present in historical labels.'},
  {q:'A credit system removes gender but uses a variable that strongly acts as a proxy for gender.',opts:['Still a possible bias risk','Guaranteed unbiased','Proxies never matter'],a:0,why:'Removing a sensitive field does not remove indirect discrimination.'},
  {q:'A team reports one overall accuracy number but never checks performance across groups.',opts:['Fairness is not demonstrated','Overall accuracy proves fairness','Subgroup testing is unethical'],a:0,why:'Overall averages can hide systematic subgroup errors.'}
];
let biasIndex=0,biasScore=0;
function renderBias(){
  const r=biasRounds[biasIndex];$('#biasPrompt').textContent=r.q;const host=$('#biasOptions');host.innerHTML='';
  r.opts.forEach((opt,i)=>{
    const b=document.createElement('button');b.textContent=opt;b.addEventListener('click',()=>{
      if(host.dataset.done)return;host.dataset.done='1';const ok=i===r.a;b.classList.add(ok?'correct':'wrong');
      if(ok){biasScore++;$('#auditScore').textContent=biasScore+'/4';$('#biasFeedback').textContent='Correct. '+r.why;$('#biasFeedback').className='feedback good';sfx('correct');award('bias'+biasIndex,8)}
      else{$$('button',host)[r.a].classList.add('correct');$('#biasFeedback').textContent='Not quite. '+r.why;$('#biasFeedback').className='feedback bad';sfx('wrong')}
      setTimeout(()=>{biasIndex=(biasIndex+1)%biasRounds.length;host.dataset.done='';renderBias()},1100);
    });host.appendChild(b);
  });
}
renderBias();

// ---------- GAME 8: Accountability court ----------
const courtRounds=[
  {q:'A developer reports a critical flaw, but management refuses the fix to meet a launch date. The flaw later harms customers.',detail:'Who carries the strongest responsibility?',opts:['Only the developer','Primarily the organisation, with lifecycle responsibility shared','Nobody because software can fail'],a:1,why:'Management knowingly accepted the risk, while accountability still spans the lifecycle.'},
  {q:'A team deploys an AI decision system without testing known subgroup performance differences.',detail:'What is the ethical issue?',opts:['Only a speed problem','Accountability and fairness failure','No issue if the code compiles'],a:1,why:'Teams are responsible for foreseeable harms and for validating fairness.'},
  {q:'A company legally collects location data but secretly uses it in a way users would not reasonably expect.',detail:'Can something be legal but still ethically problematic?',opts:['Yes','No, law and ethics are identical','Only if the server is hacked'],a:0,why:'Legal compliance is a floor; ethical responsibility can demand more.'},
  {q:'A serious outage is caused by a chain of coding, testing, deployment and management failures.',detail:'Who should be accountable?',opts:['One junior developer only','Shared responsibility across the contributing roles','The computer itself'],a:1,why:'Complex failures often emerge from multiple decisions across the system lifecycle.'}
];
let courtIndex=0,courtScore=0;
function renderCourt(){
  const r=courtRounds[courtIndex];$('#courtPrompt').textContent=r.q;$('#courtCard').innerHTML='<b>Ethical judgment</b><p>'+r.detail+'</p>';
  const host=$('#courtOptions');host.innerHTML='';
  r.opts.forEach((opt,i)=>{
    const b=document.createElement('button');b.textContent=opt;b.addEventListener('click',()=>{
      if(host.dataset.done)return;host.dataset.done='1';const ok=i===r.a;b.classList.add(ok?'correct':'wrong');
      if(ok){courtScore++;$('#courtScore').textContent=courtScore+'/4';$('#courtFeedback').textContent='Defensible judgment. '+r.why;$('#courtFeedback').className='feedback good';sfx('correct');award('court'+courtIndex,8)}
      else{$$('button',host)[r.a].classList.add('correct');$('#courtFeedback').textContent='Consider responsibility across design, organisational decisions and foreseeable impact. '+r.why;$('#courtFeedback').className='feedback bad';sfx('wrong')}
      setTimeout(()=>{courtIndex=(courtIndex+1)%courtRounds.length;host.dataset.done='';renderCourt()},1200);
    });host.appendChild(b);
  });
}
renderCourt();

// ---------- Final quiz ----------
const questions=[
 ['Which CIA property protects sensitive information from unauthorised disclosure?',
  ['Integrity','Availability','Confidentiality','Accountability'],2],
 ['Why use defense in depth?',
  ['So one control failure does not expose everything','To remove all monitoring','To rely on one perfect firewall','To replace physical security'],0],
 ['What is the correct threat-model order?',
  ['Threats → controls → assets → passwords','Controls → assets → threats → vulnerabilities','Vulnerabilities → controls → assets → threats','Assets → threats → vulnerabilities → controls'],3],
 ['What root issue does the lecture highlight in the Equifax case?',
  ['A stolen printer','Unpatched Apache Struts vulnerability','No Internet connection','A weak Wi-Fi password'],1],
 ['How many users does the lecture say were affected by Equifax?',
  ['1.47 million','14,700','147 million','87 million'],2],
 ['What was the central ethical issue in the Cambridge Analytica case?',
  ['A ransomware payment','A DDoS attack','An unpatched web server','Data misuse without consent'],3],
 ['Why can strong security create a usability problem?',
  ['Excessive friction can push users toward shortcuts','Security always makes systems faster','Users never value convenience','More controls always improve user experience'],0],
 ['How can biased training data affect AI?',
  ['It guarantees neutral outcomes','Training data has no influence','It can produce unfair decisions','It always improves fairness'],2],
 ['Which statement best describes accountability?',
  ['The computer is always responsible','Developers and organisations may share responsibility','Legal responsibility and ethical responsibility are always identical','Only end users are responsible'],1],
 ['What is the overall Week 12 message?',
  ['Security alone answers every ethical question','Ethics replaces technical security','Technical controls are enough without accountability','Secure design and ethical practice both matter'],3]
];

const qhost=$('#finalQuiz');let answered=0,score=0;
questions.forEach((q,i)=>{
  const card=document.createElement('article');card.className='final-q';card.innerHTML='<h3>'+(i+1)+'. '+q[0]+'</h3>';
  q[1].forEach((opt,j)=>{
    const b=document.createElement('button');b.textContent=String.fromCharCode(65+j)+'. '+opt;b.addEventListener('click',()=>{
      if(card.dataset.done)return;card.dataset.done='1';answered++;const bs=$$('button',card);bs.forEach(x=>x.disabled=true);
      if(j===q[2]){score++;b.classList.add('correct');sfx('correct')}else{b.classList.add('wrong');bs[q[2]].classList.add('correct');sfx('wrong')}
      updateFinal();
    });card.appendChild(b);
  });qhost.appendChild(card);
});
const result=document.createElement('div');result.className='final-result';result.textContent='Complete all 10 questions to reveal your result.';qhost.appendChild(result);
function updateFinal(){
  if(answered<questions.length){result.textContent=answered+'/10 complete · current score '+score+' · Lab XP '+xp;return}
  const pct=Math.round(score/questions.length*100);
  result.innerHTML='FINAL SCORE: '+score+'/10 ('+pct+'%) · LAB XP '+xp+'<br><span style="font-weight:600">'+(pct>=90?'Excellent — secure design and ethical reasoning are both strong.':pct>=70?'Good result — revisit the highlighted answers and game missions.':'Replay the missions and use the flip cards to strengthen the core ideas.')+'</span>';
  if(pct>=90)sfx('level');
}
