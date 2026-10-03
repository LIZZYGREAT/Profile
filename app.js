/* Native presentation controller. All MentalFlow curves and CL probes are conceptual. */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const mapX = (hour) => 64 + ((hour - 8) / 16) * 816;
  const mapY = (value) => 300 - value * 226;
  const schedule = [
    { label: '高等数学', start: 8, end: 9.67, kind: 'course' },
    { label: '操作系统', start: 10, end: 11.67, kind: 'course' },
    { label: '午饭 / 午休', start: 12, end: 13, kind: 'recovery' },
    { label: '项目讨论', start: 14, end: 15.17, kind: 'meeting' },
    { label: '作业处理', start: 15.5, end: 17, kind: 'task' },
    { label: '项目会议', start: 17, end: 18, kind: 'meeting' },
    { label: '晚饭', start: 18, end: 18.67, kind: 'recovery' },
  ];
  const anchorsA = [[8,.24],[8.7,.38],[9.6,.57],[9.9,.46],[10.5,.5],[11.65,.66],[12,.55],[12.45,.39],[13,.3],[14,.5],[15.1,.45],[15.55,.58],[16.6,.67],[17.2,.75],[18.05,.74],[18.65,.72],[19.4,.73],[20.45,.74],[20.8,.76],[21.3,.72],[22,.69],[22.6,.73],[23.5,.81],[23.98,.86]];
  const anchorsB = [[8,.42],[8.7,.53],[9.6,.72],[9.9,.62],[10.5,.66],[11.65,.81],[12,.73],[12.45,.66],[13,.56],[14,.69],[15.1,.64],[15.55,.74],[16.6,.8],[17.2,.86],[18.05,.84],[18.65,.82],[19.4,.83],[20.45,.84],[20.8,.85],[21.3,.82],[22,.79],[22.6,.82],[23.5,.87],[23.98,.91]];
  const careCurve = [[8,.24],[8.7,.38],[9.6,.57],[9.9,.46],[10.5,.5],[11.65,.66],[12,.55],[12.45,.39],[13,.3],[14,.5],[15.1,.45],[15.55,.58],[16.6,.67],[17.2,.75],[18.05,.74],[18.2,.74],[18.65,.74],[19.4,.75],[20.45,.77],[20.8,.8],[21.3,.78],[22,.76],[22.6,.79],[23.5,.84],[23.98,.88]];
  const recoveryCurve = [[8,.24],[8.7,.38],[9.6,.57],[9.9,.46],[10.5,.5],[11.65,.66],[12,.55],[12.45,.39],[13,.3],[14,.5],[15.1,.45],[15.55,.58],[16.6,.67],[17.2,.75],[18.05,.74],[18.2,.74],[18.65,.74],[19.4,.75],[20.45,.77],[20.72,.68],[21.05,.5],[21.4,.46],[22,.46],[22.6,.54],[23.5,.72],[23.98,.82]];

  function smoothPath(points) {
    if (points.length < 2) return '';
    let d = 'M ' + points[0][0].toFixed(1) + ' ' + points[0][1].toFixed(1);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ', ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ', ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }
  function interpolate(anchors, hour) {
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i], b = anchors[i + 1];
      if (hour >= a[0] && hour <= b[0]) {
        const ratio = (hour - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * ratio;
      }
    }
    return anchors[anchors.length - 1][1];
  }
  function pathPoints(anchors, through) {
    const points = anchors.filter((item) => item[0] <= through).map((item) => [mapX(item[0]), mapY(item[1])]);
    if (through < 24 && through > 8 && anchors[anchors.length - 1][0] >= through) points.push([mapX(through), mapY(interpolate(anchors, through))]);
    return points;
  }
  function svgTag(name, attrs, text) {
    let result = '<' + name;
    Object.keys(attrs || {}).forEach((key) => { result += ' ' + key + '="' + attrs[key] + '"'; });
    result += '>';
    if (text) result += text;
    result += '</' + name + '>';
    return result;
  }
  function graphMarkup(options) {
    const opts = options || {};
    const mode = opts.mode || 'day';
    const includeBadminton = Boolean(opts.includeBadminton);
    const viewBox = mode === 'forecast' ? '350 28 570 330' : '0 0 920 365';
    const bandTypes = { course:'band-course', task:'band-task', meeting:'band-meeting', recovery:'band-recovery' };
    let bands = '';
    schedule.forEach((event) => {
      const x = mapX(event.start), width = mapX(event.end) - x;
      bands += '<rect class="' + bandTypes[event.kind] + '" x="' + x.toFixed(1) + '" y="62" width="' + width.toFixed(1) + '" height="242" opacity=".54" rx="2"></rect>';
      bands += '<line x1="' + x.toFixed(1) + '" y1="62" x2="' + x.toFixed(1) + '" y2="304" stroke="#99b4a2" stroke-width="1" opacity=".55"></line>';
      bands += svgTag('text',{x:(x+width/2).toFixed(1),y:event.kind==='recovery'?'326':'55','text-anchor':'middle',class:'band-label'},event.label);
    });
    if (includeBadminton) {
      const x = mapX(20.5), width = mapX(21) - x;
      bands += '<rect data-badminton-band class="band-recovery badminton-band" x="' + x.toFixed(1) + '" y="62" width="' + width.toFixed(1) + '" height="242" opacity=".82" rx="2"></rect>';
      bands += '<line x1="' + x.toFixed(1) + '" y1="62" x2="' + x.toFixed(1) + '" y2="304" stroke="#679777" stroke-width="1.5"></line>';
      bands += svgTag('text',{x:(x+width/2).toFixed(1),y:'347','text-anchor':'middle',class:'band-label'},'羽毛球 · 对话');
    }
    if (mode === 'feedback' && !includeBadminton) {
      const x = mapX(20.5);
      bands += '<rect data-badminton-target x="' + (x-2).toFixed(1) + '" y="62" width="' + (mapX(21)-x+4).toFixed(1) + '" height="242" fill="transparent" opacity="0"></rect>';
    }
    let grid = '';
    [91,151,211,274,304].forEach((y) => { grid += '<line class="gridline" x1="64" y1="' + y + '" x2="880" y2="' + y + '"></line>'; });
    grid += '<line class="baseline" x1="64" y1="304" x2="880" y2="304"></line>';
    const tickValues = mode === 'forecast' ? [14,16,18,20,22,24] : [8,10,12,14,16,18,20,22,24];
    tickValues.forEach((hour) => {
      const x = mapX(hour);
      grid += '<line class="baseline" x1="' + x + '" y1="304" x2="' + x + '" y2="310"></line>';
      grid += svgTag('text',{x:x,y:'358','text-anchor':'middle',class:'time-tick'},String(hour).padStart(2,'0') + ':00');
    });
    grid += svgTag('text',{x:'8',y:'98',class:'axis-caption'},'较高');
    grid += svgTag('text',{x:'8',y:'298',class:'axis-caption'},'较低');
    const anchors = mode === 'care' || mode === 'feedback' ? careCurve : anchorsA;
    let curve = '';
    if (mode === 'forecast') {
      const now = 17.533, nx = mapX(now), ny = mapY(interpolate(anchorsA, now));
      const future = pathPoints(anchorsA,24).filter((p) => p[0] >= nx);
      const upper = future.map((p) => p[0] + ' ' + (p[1] - 18)).join(' L ');
      const lower = future.slice().reverse().map((p) => p[0] + ' ' + (p[1] + 22)).join(' L ');
      curve += '<path class="uncertainty" d="M ' + nx + ' ' + (ny-14) + ' L ' + upper + ' L ' + lower + ' L ' + nx + ' ' + (ny+14) + ' Z"></path>';
      curve += '<line class="risk-line" x1="64" y1="' + mapY(.77) + '" x2="880" y2="' + mapY(.77) + '"></line>';
      curve += svgTag('text',{x:mapX(20),y:String(mapY(.77)-12),'text-anchor':'end',class:'axis-caption'},'Risk threshold');
      curve += '<line class="now-line" x1="' + nx + '" y1="48" x2="' + nx + '" y2="304"></line>';
      curve += svgTag('text',{x:nx+7,y:'43',class:'annotation'},'17:32 · Elevated risk ahead');
      curve += '<path class="curve-line past-line" d="' + smoothPath(pathPoints(anchorsA,now)) + '"></path>';
      curve += '<path class="forecast-line" d="' + smoothPath(future) + '"></path>';
    } else {
      if (mode === 'personal-a' || mode === 'personal-b') {
        const personAnchors = mode === 'personal-a' ? anchorsA : anchorsB;
        const cls = mode === 'personal-a' ? 'curve-line' : 'curve-b';
        curve += '<path class="' + cls + '" d="' + smoothPath(pathPoints(personAnchors,24)) + '"></path>';
      } else {
        curve += '<path data-stress-path class="curve-line" d="' + smoothPath(pathPoints(anchors,24)) + '"></path>';
      }
      if (mode === 'personal-a' || mode === 'personal-b') {
        curve += svgTag('text',{x:'875',y:'78','text-anchor':'end',class:'curve-tag'},mode==='personal-a'?'S(t) · A':'S(t) · B');
      } else if (mode !== 'feedback') {
        curve += svgTag('text',{x:'875',y:'78','text-anchor':'end',class:'curve-tag'},'S(t) · illustrative');
      }
    }
    let markers = '<line class="band-ddl" x1="' + mapX(23.983) + '" y1="53" x2="' + mapX(23.983) + '" y2="304"></line>' +
      svgTag('text',{x:mapX(23.983)-7,y:'47','text-anchor':'end',class:'annotation'},'23:59 · DDL');
    if (mode === 'care') {
      const x = mapX(18.2);
      markers += '<line class="now-line" x1="' + x + '" y1="48" x2="' + x + '" y2="304"></line>' + svgTag('text',{x:x+6,y:'43',class:'annotation'},'18:12 · Care sent');
    }
    if (mode === 'feedback' && includeBadminton) {
      const x = mapX(20.5), w = mapX(21)-x;
      markers += '<line class="now-line" x1="' + mapX(21.133) + '" y1="48" x2="' + mapX(21.133) + '" y2="304"></line>' + svgTag('text',{x:mapX(21.133)-8,y:'43','text-anchor':'end',class:'annotation'},'21:08 · feedback');
    }
    const accessible = '<title>Stress × Time：一天中的日程上下文与概念性压力轨迹</title><desc>连续平滑曲线仅为概念示意，不代表测量结果或正式算法输出。</desc>';
    return '<svg class="stress-svg" data-mode="' + mode + '" viewBox="' + viewBox + '" role="img">' + accessible +
      '<g class="schedule-layer" data-schedule-layer>' + bands + '</g><g class="chart-grid">' + grid + '</g>' +
      '<g class="chart-forecast">' + curve + '</g><g class="chart-markers">' + markers + '</g></svg>';
  }

  function metric(label, value, caption, primary) {
    return '<article class="metric' + (primary?' primary-metric':'') + '"><strong class="metric-value">' + value + '</strong><span class="metric-label">' + label + '</span><span class="metric-caption">' + caption + '</span></article>';
  }
  function sceneHead(chapter, title, lead) {
    return '<p class="scene-kicker">' + chapter + '</p><h1 class="scene-title">' + title + '</h1>' + (lead?'<p class="scene-lead">' + lead + '</p>':'');
  }
  function sceneHero() {
    return '<section class="scene scene-hero"><div><span class="hero-name-en">GAN WENJIE</span><h1 class="hero-name">甘文杰</h1><p class="hero-major">Computer Science</p><div class="hero-keywords"><span class="hero-keyword active">LEARNING</span><span class="hero-keyword">BUILDING</span><span class="hero-keyword">RESEARCHING</span></div></div></section>';
  }
  function sceneAcademic() {
    return '<section class="scene scene-academic">' +
      '<div class="academic-head"><div><p class="scene-kicker">01 — ACADEMIC FOUNDATION</p><h1 class="scene-title">以扎实基础，<em>向前探索。</em></h1></div><p class="academic-context">计算机专业<br>2024 级 · 大三</p></div>' +
      '<div class="metrics-row">' +
      metric('GPA','3.76<small>/ 4.00</small>','CUMULATIVE GPA',true) +
      metric('核心课程','6+<small>门</small>','已列出的代表课程',false) +
      metric('竞赛获奖','2<small>项</small>','2025 · 赛区奖项',false) +
      '</div><div class="academic-note"><span>成绩是阶段结果，背后是逐步形成的计算机知识结构。</span><strong>LEARNING → KNOWLEDGE STRUCTURE</strong></div></section>';
  }
  function sceneKnowledge() {
    return '<section class="scene scene-knowledge"><div class="knowledge-heading"><div><p class="scene-kicker">LEARNING / KNOWLEDGE STRUCTURE</p><h1 class="scene-title">知识从基础，<em>长成结构。</em></h1></div><p class="scene-note">从数学与编程基础出发，课程知识逐渐连接到算法、系统、信息与智能方向。</p></div>' +
      '<div class="knowledge-diagram"><div class="foundation-node"><small>FOUNDATION</small><strong>数学 <span>+</span> 编程</strong><small>分析问题 · 表达方法</small></div><div class="knowledge-trunk"></div><div class="cs-node"><small>COMPUTER SCIENCE</small><strong>计算机学科基础</strong></div><div class="branch-lines"><span></span><span></span><span></span></div><div class="domain-row">' +
      '<article class="domain"><h3>算法</h3><p>ALGORITHMIC THINKING</p><div class="domain-courses"><span>算法导论</span></div></article>' +
      '<article class="domain"><h3>系统</h3><p>SYSTEMS & ARCHITECTURE</p><div class="domain-courses"><span>计算机系统基础</span><span>计算机组成原理</span><span>并行计算</span></div></article>' +
      '<article class="domain"><h3>信息与智能</h3><p>INFORMATION & INTELLIGENCE</p><div class="domain-courses"><span>信息检索系统</span><span>人工智能实践课</span></div></article>' +
      '</div></div></section>';
  }
  function sceneAwards() {
    return '<section class="scene scene-awards"><div class="awards-heading"><p class="scene-kicker">LEARNING IN PRACTICE</p><h1 class="scene-title">在问题中，<br><em>检验所学。</em></h1><p class="scene-note">通过数学学科竞赛与人工智能技术实践，拓展知识的使用场景。</p></div><div class="award-timeline">' +
      '<article class="award-item"><div><span class="award-year">2025</span><span class="award-place">天津赛区</span></div><div><div class="award-title">全国大学生数学竞赛</div><div class="award-subtitle">数学学科竞赛</div></div><div class="award-result">一等奖<small>天津赛区</small></div></article>' +
      '<article class="award-item"><div><span class="award-year">2025</span><span class="award-place">华北赛区</span></div><div><div class="award-title">动感地带 AI+ 高校智创计划</div><div class="award-subtitle">AI 技术赛道</div></div><div class="award-result">三等奖<small>华北赛区</small></div></article>' +
      '</div></section>';
  }
  function sceneBridge() {
    return '<section class="scene scene-transition"><p class="transition-title">LEARNING BECOMES A FOUNDATION</p><div class="transition-flow"><span>LEARNING</span><i>→</i><span>BUILDING</span></div><p class="transition-caption">从理解学科知识，到在真实问题中构建系统。</p><p class="transition-foundation">GPA · COURSES · PROBLEM SOLVING</p></section>';
  }
  function sceneMentalDay() {
    return '<section class="scene scene-mental"><div class="mental-heading">' + sceneHead('02 — BUILDING / MENTALFLOW','一天的压力，<em>随时间建模。</em>','课程、任务、讨论、休息都落在同一条时间线上。曲线是概念示意，不是单个事件的压力打分。') + '</div><div class="mental-workspace"><div class="mental-chart-panel"><div class="chart-header"><strong>Stress × Time</strong><span class="chart-qualifier">ONE CONTINUOUS DAY</span></div>' + graphMarkup({mode:'day'}) + '<div class="chart-legend"><span><i class="legend-swatch"></i>压力状态 S(t)</span><span><i class="legend-swatch context"></i>日程上下文</span></div><div class="mental-caption">Conceptual visualization · 非实测轨迹</div></div><aside class="mental-aside"><span class="aside-index">F1 / DAY CONTEXT</span><h3>真实的一天，<br>不止日历上的事件。</h3><p>从早课到项目会议，日程为理解提供上下文。尚未被记录的生活细节，需要新的证据才能进入模型。</p><div class="aside-rule"></div><p class="aside-foot">初始日程不包含羽毛球。</p></aside></div></section>';
  }
  function sceneModel() {
    return '<section class="scene scene-mental scene-model"><div class="mental-heading">' + sceneHead('02 — BUILDING / MODEL LENS','日程不会<em>直接变成压力。</em>','Context、Exposure、Appraisal 与 Stress 是不同层次。') + '</div><div class="model-stage"><div class="lens-backdrop">' + graphMarkup({mode:'day'}) + '</div><div class="model-lens"><div class="lens-title">MODEL LENS<small>from context to latent state</small></div><div class="lens-chain"><span>Schedule / Context</span><span>Event &amp; Realized Exposure</span><span>Personal Appraisal</span><span>Demand · Pressure · Recovery</span><span>Temporal Dynamics</span><span>A(t) + B(t)</span><span>S(t)</span></div></div><div class="lens-examples"><span><b>14:00</b> 项目讨论 → Event / Exposure → Demand · Pressure</span><span><b>12:00</b> 午饭与午休 → Recovery exposure → Temporal dynamics</span></div></div></section>';
  }
  function profileMarkup(which) {
    const a = which === 'a';
    const values = a ? ['高','高','高'] : ['中','高','低'];
    const states = a ? ['●','●','◐','◐'] : ['●','◐','○','○'];
    const stateClass = a ? ['personalized','personalized','learning','learning'] : ['personalized','learning','pooled','pooled'];
    return '<div class="profile-strip"><div class="profile-col"><strong>Stable appraisal</strong><span>课程胜任感 <b>' + values[0] + '</b></span><span>任务重要性 <b>' + values[1] + '</b></span><span>运动恢复契合 <b>' + values[2] + '</b></span></div><div class="profile-col"><strong>Personal dynamics</strong><div class="parameter-status"><i>S₀ <b class="' + stateClass[0] + '">' + states[0] + '</b></i><i>gA <b class="' + stateClass[1] + '">' + states[1] + '</b></i><i>gB <b class="' + stateClass[2] + '">' + states[2] + '</b></i><i>κ↓ <b class="' + stateClass[3] + '">' + states[3] + '</b></i></div><span class="state-key">● personalized　◐ learning　○ pooled</span></div></div>';
  }
  function personPanel(which) {
    const a = which === 'a';
    return '<article class="person-panel"><header class="person-panel-head"><h3>USER ' + (a?'A':'B') + '</h3><small>Same schedule · 08:00–24:00</small></header>' + graphMarkup({mode:a?'personal-a':'personal-b'}) + profileMarkup(which) + '</article>';
  }
  function scenePeople() {
    return '<section class="scene scene-personalization"><div class="person-head"><div>' + sceneHead('02 — BUILDING / PERSONALIZATION','同一日程，<em>不同人的轨迹。</em>','Stable appraisal 与个人动态不同，因而相同事件会形成不同的压力反应与恢复节奏。') + '</div><span class="same-schedule">SAME SCHEDULE</span></div><div class="person-comparison">' + personPanel('a') + personPanel('b') + '</div></section>';
  }
  function sceneForecast() {
    return '<section class="scene scene-forecast"><div class="mental-heading">' + sceneHead('02 — BUILDING / FORECAST','提前看到风险，<em>再判断时机。</em>','镜头聚焦 14:00–24:00。17:32，模型预测晚间风险升高；此时尚无 21:08 对话中的运动证据。') + '</div><div class="forecast-layout"><div class="forecast-card"><div class="chart-header"><strong>Past → Forecast</strong><span class="chart-qualifier">NOW · 17:32</span></div>' + graphMarkup({mode:'forecast'}) + '<div class="chart-legend"><span><i class="legend-swatch"></i>历史状态</span><span><i class="legend-swatch prediction"></i>预测与不确定区间</span></div></div><aside class="forecast-info"><span class="aside-index">CARE OPPORTUNITY</span><h3>当前情境：<br>项目会议。</h3><div class="policy-flow"><div class="policy-row"><b>1</b><span>Elevated risk ahead</span></div><div class="policy-row"><b>2</b><span>17:00–18:00 · Meeting</span></div><div class="policy-row defer"><b>3</b><span>合适时机未到 → <strong>Defer</strong></span></div></div><div class="aside-rule"></div><p>预测不是立刻打扰的理由。系统先等待更合适的支持窗口。</p></aside></div></section>';
  }
  function sceneCare() {
    return '<section class="scene scene-care"><div class="mental-heading">' + sceneHead('02 — BUILDING / CARE','18:12，<em>在合适的窗口回应。</em>','关怀是一种支持机会，不是直接修改压力曲线的控制指令。') + '</div><div class="care-layout"><div class="care-card"><div class="chart-header"><strong>Stress × Time</strong><span class="chart-qualifier">CARE SENT · 18:12</span></div>' + graphMarkup({mode:'care'}) + '<div class="mental-caption">消息发出后，状态按原有动态继续演化；恢复行为尚未发生。</div></div><aside class="care-info"><span class="aside-index">LIZZY · 18:12</span><div class="care-chat"><div class="chat-time"><span>LIZZY</span><span>18:12</span></div>今天这一天排得够满的，晚上那个作业又还挂着。先别急着接着坐回去写，出去走走或者打会儿球都行——你前几次运动完状态都缓得挺快。回来再收那个作业，应该会比现在硬顶舒服点。</div></aside></div></section>';
  }
  function sceneFeedback() {
    return '<section class="scene scene-feedback"><div class="mental-heading">' + sceneHead('02 — BUILDING / FEEDBACK &amp; LEARNING','真实行动与反馈，<em>继续丰富理解。</em>','21:08 的对话出现后，日历之外的羽毛球才进入当天的事件证据。') + '</div><div class="feedback-layout"><div class="feedback-card"><div class="chart-header"><strong>Stress × Time</strong><span class="chart-qualifier">20:30–21:00 · RECOVERY</span></div>' + graphMarkup({mode:'feedback'}) + '<div class="mental-caption">21:08 对话确认后，恢复事件与平滑回落才进入示意轨迹。</div></div><aside class="feedback-info"><span class="aside-index">YOU + LIZZY · 21:08</span><div class="feedback-chat"><div class="chat-bubble user"><header><span>YOU</span><span>21:08</span></header>刚刚和室友打了<span class="evidence-source" data-evidence-source>半小时羽毛球</span>，<span class="evidence-source" data-evidence-source>舒服多了</span>，今天真的累坏了</div><div class="chat-bubble"><header><span>LIZZY</span><span>21:09</span></header>这半小时球算是打值了。你今天从上午的课一路排到下午讨论，确实够折腾的。现在缓过来一点就行，剩下那个作业慢慢收，别刚舒服点又把自己塞满了。</div></div><div class="feedback-evidence"><span>Episode Evidence</span><b>→</b><strong>Long-term understanding +</strong></div></aside></div><div class="closure-loop"><span>UNDERSTAND</span><i>→</i><span>MODEL</span><i>→</i><span>FORECAST</span><i>→</i><span>SUPPORT</span><i>→</i><strong>LEARN</strong><i>↺</i></div></section>';
  }
  function sceneResearchIntro() {
    return '<section class="scene scene-research-intro"><div class="adaptation-line"><span>LEARN OVER TIME</span><i></i><strong>ADAPTATION</strong><i></i><span>DIFFERENT PEOPLE</span></div><p class="scene-kicker">03 — RESEARCHING</p><h1 class="scene-title">模型如何在变化中<br><em>继续学习？</em></h1><p class="scene-lead">从 MentalFlow 对长期适应的关注，延伸到一个更一般的问题：任务不断变化时，模型如何学习新知识并保留旧能力？</p></section>';
  }
  function probe(name, key) {
    return '<div class="probe" data-probe="' + key + '"><strong>' + name + '</strong><span class="probe-dots"><i>○</i><i>○</i><i>○</i><i>○</i></span></div>';
  }
  function clBoardMarkup(step) {
    let className = 'cl-board';
    if (step === 'task-b') className += ' task-b-state';
    if (step === 'branch') className += ' branch-state';
    if (step === 'strategies') className += ' strategy-state';
    if (step === 'stream') className += ' stream-state';
    const taskActive = step === 'task-a' ? 'a' : step === 'task-b' ? 'b' : step === 'stream' ? 'c' : '';
    const cells = new Array(54).fill(0).map((_, i) => '<i class="parameter-cell tone-0" data-cell="' + i + '"></i>').join('');
    return '<div class="' + className + '" id="cl-board" data-step="' + step + '">' +
      '<div class="task-stream"><span class="board-label">TASK STREAM</span>' +
      '<article class="task-tray ' + (taskActive==='a'?'is-active':'') + '" data-tray="a"><h3>Task A</h3><div class="samples"><span>○</span><span>△</span><span>○</span><span>△</span><span>△</span><span>○</span><span>△</span><span>○</span></div><small>conceptual samples</small></article>' +
      '<article class="task-tray ' + (taskActive==='b'?'is-active':'') + '" data-tray="b"><h3>Task B</h3><div class="samples task-b"><span>□</span><span>◇</span><span>□</span><span>◇</span><span>◇</span><span>□</span><span>◇</span><span>□</span></div><small>new task</small></article>' +
      '<article class="task-tray ' + (taskActive==='c'?'is-active':'') + '" data-tray="c"><h3>Task C</h3><div class="samples task-c"><span>☆</span><span>＋</span><span>☆</span><span>＋</span><span>＋</span><span>☆</span><span>＋</span><span>☆</span></div><small>next in stream</small></article></div>' +
      '<div class="parameter-board"><div class="theta-head"><span class="board-label">ONE SHARED MODEL</span><strong>θ</strong></div><div class="parameter-field">' + cells + '</div><div class="parameter-meta"><span>parameter state · conceptual</span><span data-theta-caption>θ learns Task A</span></div><span class="previous-theta">previous θ<sub>A</sub></span></div>' +
      '<div class="evaluation"><span class="board-label">QUALITATIVE PROBES</span>' + probe('Task A','a') + probe('Task B','b') + probe('Task C','c') + '<span class="qualitative-note">○ low　 ◐ partial　 ● retained</span><div class="forgetting-callout"><strong>CATASTROPHIC FORGETTING</strong><p>新任务变好，旧任务能力可能退化。</p></div></div>' +
      '<div class="branch-workspace"><div class="branch-label">SAME STARTING MODEL · θ<sub>A</sub></div><div class="branch-compare"><article class="branch-lane"><h3>NAIVE FINE-TUNING</h3><div class="branch-row">OLD TASK <b class="decline">↓</b></div><div class="branch-row">NEW TASK <b>↑</b></div></article><article class="branch-lane cl-lane"><h3>CONTINUAL LEARNING</h3><div class="branch-row">OLD TASK <b>retain</b></div><div class="branch-row">NEW TASK <b>↑</b></div></article></div></div>' +
      '<div class="strategy-space"><span>Regularization</span><span>Knowledge Distillation</span><span>Replay / Exemplars</span><span>Constraint-based</span></div>' +
      '<div class="stream-sequence">Task A · retained　　Task B · retained　　Task C · learning…<br>Task D → Task E → …　　TIME ───────────────────→</div>' +
      '</div>';
  }
  function sceneCL(id) {
    const definitions = {
      'cl-task-a': ['Task A：同一个模型，开始学习。','Task batch 进入参数工作区，Task A 的定性探针随训练逐步提升。','task-a'],
      'cl-task-b': ['Task B：学习新任务，旧能力可能退化。','仍然更新同一个 θ。新任务探针上升时，Task A 探针逐步回落。','task-b'],
      'cl-branch': ['从相同 θA 出发，分成两条路径。','比较目标而非胜负：朴素微调可能遗忘旧任务；持续学习尝试兼顾新旧能力。','branch'],
      'cl-strategies': ['持续学习，有多种策略空间。','这些是方法方向，不是固定 pipeline；Continual Learning 也不等同于某一种方法。','strategies'],
      'cl-stream': ['任务继续到来，问题也继续。','从 Task C 到后续任务，模型在长期任务流中不断适应。','stream'],
    };
    const info = definitions[id];
    return '<section class="scene cl-scene" data-cl-scene="' + info[2] + '"><header class="cl-scene-head"><h2>' + info[0] + '</h2><p>' + info[1] + '</p></header>' + clBoardMarkup(info[2]) + '<div class="cl-footline"><span>CONCEPTUAL TASK STREAM · NOT EXPERIMENTAL DATA</span><span data-training-caption>同一个 θ · 定性状态</span></div></section>';
  }
  function scenePaper(camera) {
    const info = {
      ewc:['EWC','Parameter importance'],
      lwf:['LwF','Knowledge distillation'],
      icarl:['iCaRL','Exemplar memory'],
      overview:['阅读 → 重构 → 交互解释','Continual Learning · interactive learning work'],
    }[camera];
    return '<section class="scene scene-paper" data-camera="overview" data-target-camera="' + camera + '">' +
      '<div class="paper-title"><span>RESEARCH WORKSPACE</span><strong>' + info[0] + '</strong></div>' +
      (camera==='ewc'?'<div class="morph-overlay"><span><b>TASK A / B</b>Task stream</span><span><b>MODEL θ</b>shared parameter state</span><span><b>STATE</b>memory &amp; math</span></div>':'') +
      '<div class="paper-caption"><strong>' + info[0] + '</strong><span>' + info[1] + '</span></div>' +
      '<div class="paper-camera"><div class="paper-world">' +
      '<img class="paper-canvas paper-ewc" src="assets/ewc.png" alt="EWC 持续学习可视化实验室原始页面截图">' +
      '<img class="paper-canvas paper-lwf" src="assets/lwf.png" alt="LwF 交互式论文解释原始页面截图">' +
      '<img class="paper-canvas paper-icarl" src="assets/icarl.png" alt="iCaRL 交互式论文解释原始页面截图">' +
      '</div></div>' +
      (camera==='overview'?'<div class="paper-process"><span>阅读</span><i>→</i><span>重构</span><i>→</i><span>交互解释</span></div>':'') +
      '</section>';
  }
  function scenePath() {
    return '<section class="scene scene-path"><p class="scene-kicker">CONTINUAL LEARNING · LEARNING PATH</p><h1 class="path-title">持续深入，<em>仍在继续。</em></h1><div class="learning-path"><span>LwF</span><i></i><span>EWC</span><i></i><span>iCaRL</span><i></i><span>GEM</span><i></i><span class="ongoing">…</span></div><p class="path-subtitle">个人学习路径，不代表论文发表时间线或已完成研究。</p></section>';
  }
  function sceneAdaptation() {
    return '<section class="scene scene-adaptation"><div class="adaptation-axes"><span class="axis-y-label">DIFFERENT PEOPLE</span><span class="axis-x-label">CHANGING TASKS / DATA <b>→</b></span><span class="axis-person-label axis-person-a">USER A</span><span class="axis-person-label axis-person-b">USER B</span><span class="axis-person-label axis-person-c">USER C</span><span class="axis-stream axis-stream-a"></span><span class="axis-stream axis-stream-b"></span><div class="axis-core"><strong>ADAPTATION</strong><small>Adapt over time × Adapt across people</small></div></div><div class="adaptation-summary"><p class="scene-kicker">ONE QUESTION · TWO DIRECTIONS</p><h2>适应变化，<br>也适应不同的人。</h2><p>持续学习关注跨时间与任务的适应；个性化关注不同个体。两者共同指向智能系统如何在长期使用中持续调整。</p><div class="adaptation-equation"><strong>CONTINUAL LEARNING</strong> · Adapt over time<br><strong>PERSONALIZATION</strong> · Adapt across people</div></div></section>';
  }

  const scenes = [
    { id:'hero', chapter:'LEARNING', render:sceneHero },
    { id:'academic', chapter:'LEARNING', render:sceneAcademic },
    { id:'knowledge', chapter:'LEARNING', render:sceneKnowledge },
    { id:'competitions', chapter:'LEARNING', render:sceneAwards },
    { id:'bridge', chapter:'BUILDING', render:sceneBridge },
    { id:'mental-day', chapter:'BUILDING', render:sceneMentalDay },
    { id:'mental-model', chapter:'BUILDING', render:sceneModel },
    { id:'mental-people', chapter:'BUILDING', render:scenePeople },
    { id:'mental-forecast', chapter:'BUILDING', render:sceneForecast },
    { id:'mental-care', chapter:'BUILDING', render:sceneCare },
    { id:'mental-feedback', chapter:'BUILDING', render:sceneFeedback },
    { id:'research-intro', chapter:'RESEARCHING', render:sceneResearchIntro },
    { id:'cl-task-a', chapter:'RESEARCHING', render:() => sceneCL('cl-task-a') },
    { id:'cl-task-b', chapter:'RESEARCHING', render:() => sceneCL('cl-task-b') },
    { id:'cl-branch', chapter:'RESEARCHING', render:() => sceneCL('cl-branch') },
    { id:'cl-strategies', chapter:'RESEARCHING', render:() => sceneCL('cl-strategies') },
    { id:'cl-stream', chapter:'RESEARCHING', render:() => sceneCL('cl-stream') },
    { id:'paper-ewc', chapter:'RESEARCHING', render:() => scenePaper('ewc') },
    { id:'paper-lwf', chapter:'RESEARCHING', render:() => scenePaper('lwf') },
    { id:'paper-icarl', chapter:'RESEARCHING', render:() => scenePaper('icarl') },
    { id:'paper-overview', chapter:'RESEARCHING', render:() => scenePaper('overview') },
    { id:'learning-path', chapter:'RESEARCHING', render:scenePath },
    { id:'adaptation', chapter:'RESEARCHING', render:sceneAdaptation },
  ];
  const container = document.getElementById('scene-container');
  const indexNode = document.getElementById('scene-index');
  const totalNode = document.getElementById('scene-total');
  const bar = document.getElementById('scene-progress-bar');
  const previous = document.getElementById('previous-scene');
  const next = document.getElementById('next-scene');
  let currentIndex = 0;
  let animationFrame = 0;
  let lastWheel = 0;
  totalNode.textContent = String(scenes.length).padStart(2,'0');

  function setChapter(chapter) {
    document.querySelectorAll('.chapter-button').forEach((button) => {
      const active = button.dataset.chapter === chapter;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current','step');
      else button.removeAttribute('aria-current');
    });
  }
  function stopAnimation() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
  function setDots(row, count, warningCount) {
    if (!row) return;
    const stateKey = count + '-' + warningCount;
    if (row.dataset.state === stateKey) return;
    row.dataset.state = stateKey;
    row.querySelectorAll('.probe-dots i').forEach((dot,index) => {
      dot.className = '';
      if (index < warningCount) { dot.textContent = '◐'; dot.classList.add('fading'); }
      else if (index < count) { dot.textContent = '●'; dot.classList.add('full'); }
      else if (index === count && count < 4) { dot.textContent = '◐'; dot.classList.add('partial'); }
      else dot.textContent = '○';
    });
  }
  function setParameterProgress(board, progress, previousState) {
    const cells = board.querySelectorAll('.parameter-cell');
    cells.forEach((cell,index) => {
      const threshold = index / cells.length;
      const baseTone = previousState ? ((index * 2 + 1) % 4) : 0;
      const updateTone = (index * 3 + (previousState ? 2 : 1)) % 4;
      const changed = progress > threshold;
      const nextState = changed ? 'updated-' + updateTone : 'base-' + baseTone;
      if (cell.dataset.state === nextState) return;
      cell.dataset.state = nextState;
      cell.className = 'parameter-cell tone-' + (changed ? updateTone : baseTone) + (changed ? ' is-updating' : '');
    });
  }
  function animateCL(id) {
    const board = document.getElementById('cl-board');
    if (!board || (id !== 'cl-task-a' && id !== 'cl-task-b')) return;
    const isTaskB = id === 'cl-task-b';
    const startTime = performance.now();
    const duration = isTaskB ? 3100 : 2500;
    const rowA = board.querySelector('[data-probe="a"]');
    const rowB = board.querySelector('[data-probe="b"]');
    const rowC = board.querySelector('[data-probe="c"]');
    const caption = document.querySelector('[data-training-caption]');
    const thetaCaption = board.querySelector('[data-theta-caption]');
    function tick(now) {
      const progress = Math.min(1,(now-startTime)/duration);
      setParameterProgress(board,progress,isTaskB);
      if (isTaskB) {
        const newLearned = Math.min(4,Math.floor(progress*4.2));
        const oldRemaining = Math.max(0,4-Math.floor(progress*4.1));
        const oldWarning = progress < .2 ? 0 : progress < .45 ? 1 : progress < .68 ? 2 : 3;
        setDots(rowA,oldRemaining,oldWarning);
        setDots(rowB,newLearned,0);
        if (caption) caption.textContent = progress < .8 ? 'Task B updates θ · Task B rises as Task A fades' : '先看到新旧任务变化，再出现遗忘概念';
        if (thetaCaption) thetaCaption.textContent = progress < .5 ? 'Task B batch → same θ' : 'shared parameters continue to update';
        if (progress > .86) board.classList.add('forgetting-done');
      } else {
        const learned = Math.min(4,Math.floor(progress*4.3));
        setDots(rowA,learned,0);
        setDots(rowB,0,0);
        if (caption) caption.textContent = progress < .52 ? 'Batch 1 · 参数局部更新' : 'Batch 2 · Task A probe continues to improve';
        if (thetaCaption) thetaCaption.textContent = progress < .5 ? 'Task A batch 1 → θ' : 'Task A batch 2 → θ';
      }
      setDots(rowC,0,0);
      if (progress < 1) animationFrame = requestAnimationFrame(tick);
      else animationFrame = 0;
    }
    animationFrame = requestAnimationFrame(tick);
  }
  function animateBranch() {
    const board = document.getElementById('cl-board');
    if (!board) return;
    const cells = [...board.querySelectorAll('.parameter-cell')];
    cells.forEach((cell,index) => {
      cell.className = 'parameter-cell tone-' + ((index*3+2)%4);
      cell.dataset.branchState = 'current';
    });
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min(1,(now-startTime)/620);
      cells.forEach((cell,index) => {
        if (progress >= index/cells.length && cell.dataset.branchState !== 'theta-a') {
          cell.dataset.branchState = 'theta-a';
          cell.className = 'parameter-cell tone-' + ((index*2+1)%4) + ' is-updating';
        }
      });
      if (progress < 1) animationFrame = requestAnimationFrame(tick);
      else animationFrame = 0;
    }
    animationFrame = requestAnimationFrame(tick);
  }
  function flyEvidence() {
    const sourceNodes = [...document.querySelectorAll('[data-evidence-source]')];
    const target = document.querySelector('[data-badminton-target]');
    const scene = document.querySelector('.scene-feedback');
    if (!sourceNodes.length || !target || !scene) return;
    let finishCount = 0;
    function complete() {
      finishCount += 1;
      if (finishCount !== sourceNodes.length) return;
      const svg = target.ownerSVGElement;
      const bandGroup = svg.querySelector('[data-schedule-layer]');
      const x = mapX(20.5), width = mapX(21)-x;
      const band = document.createElementNS(NS,'rect');
      band.setAttribute('class','band-recovery badminton-band');
      band.setAttribute('x',x); band.setAttribute('y','62'); band.setAttribute('width',width);
      band.setAttribute('height','242'); band.setAttribute('rx','2');
      bandGroup.appendChild(band);
      const boundary = document.createElementNS(NS,'line');
      boundary.setAttribute('x1',x); boundary.setAttribute('y1','62'); boundary.setAttribute('x2',x); boundary.setAttribute('y2','304');
      boundary.setAttribute('stroke','#679777'); boundary.setAttribute('stroke-width','1.5');
      bandGroup.appendChild(boundary);
      const label = document.createElementNS(NS,'text');
      label.setAttribute('x',x+width/2); label.setAttribute('y','347'); label.setAttribute('text-anchor','middle'); label.setAttribute('class','band-label');
      label.textContent = '羽毛球 · 对话';
      bandGroup.appendChild(label);
      const markers = svg.querySelector('.chart-markers');
      const feedbackX = mapX(21.133);
      const feedbackLine = document.createElementNS(NS,'line');
      feedbackLine.setAttribute('class','now-line');
      feedbackLine.setAttribute('x1',feedbackX); feedbackLine.setAttribute('y1','48'); feedbackLine.setAttribute('x2',feedbackX); feedbackLine.setAttribute('y2','304');
      markers.appendChild(feedbackLine);
      const feedbackLabel = document.createElementNS(NS,'text');
      feedbackLabel.setAttribute('x',feedbackX-8); feedbackLabel.setAttribute('y','43'); feedbackLabel.setAttribute('text-anchor','end'); feedbackLabel.setAttribute('class','annotation');
      feedbackLabel.textContent = '21:08 · feedback';
      markers.appendChild(feedbackLabel);
      const basePath = svg.querySelector('[data-stress-path]');
      const recoveryPath = document.createElementNS(NS,'path');
      recoveryPath.setAttribute('class','curve-line recovery-draw');
      recoveryPath.setAttribute('pathLength','1');
      recoveryPath.setAttribute('d',smoothPath(pathPoints(recoveryCurve,24)));
      basePath.style.opacity = '.2';
      basePath.parentNode.appendChild(recoveryPath);
      recoveryPath.animate([{strokeDashoffset:1},{strokeDashoffset:0}],{duration:1250,easing:'ease-out',fill:'forwards'});
      const note = document.querySelector('.mental-caption');
      if (note) note.textContent = '对话证据补全 20:30–21:00 羽毛球后，恢复趋势才进入示意轨迹。';
      scene.classList.add('evidence-learned');
    }
    sourceNodes.forEach((source,index) => {
      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const clone = document.createElement('span');
      clone.className = 'flight-token';
      clone.textContent = source.textContent;
      clone.style.left = sourceRect.left + 'px';
      clone.style.top = sourceRect.top + 'px';
      clone.style.width = sourceRect.width + 'px';
      document.body.appendChild(clone);
      const dx = targetRect.left + targetRect.width/2 - (sourceRect.left + sourceRect.width/2);
      const dy = targetRect.top + targetRect.height/2 - (sourceRect.top + sourceRect.height/2);
      const animation = clone.animate([
        {transform:'translate(0,0) scale(1)',opacity:1},
        {transform:'translate(' + (dx*.53) + 'px,' + (dy*.65-28) + 'px) scale(.85)',opacity:1,offset:.72},
        {transform:'translate(' + dx + 'px,' + dy + 'px) scale(.42)',opacity:0}
      ],{duration:1150,delay:index*170,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'});
      animation.onfinish = () => { clone.remove(); complete(); };
    });
  }
  function render(index) {
    stopAnimation();
    currentIndex = Math.max(0,Math.min(scenes.length-1,index));
    const scene = scenes[currentIndex];
    container.innerHTML = scene.render();
    const paperScene = container.querySelector('.scene-paper');
    if (paperScene && paperScene.dataset.targetCamera !== 'overview') {
      const targetCamera = paperScene.dataset.targetCamera;
      requestAnimationFrame(() => {
        if (paperScene.isConnected) paperScene.dataset.camera = targetCamera;
      });
    }
    indexNode.textContent = String(currentIndex+1).padStart(2,'0');
    bar.style.width = ((currentIndex+1)/scenes.length*100) + '%';
    previous.disabled = currentIndex === 0;
    next.disabled = currentIndex === scenes.length-1;
    setChapter(scene.chapter);
    if (scene.id === 'cl-task-a' || scene.id === 'cl-task-b') animateCL(scene.id);
    if (scene.id === 'cl-branch') animateBranch();
    if (scene.id === 'mental-feedback') requestAnimationFrame(flyEvidence);
  }
  function advance(direction) {
    const target = currentIndex + direction;
    if (target >= 0 && target < scenes.length) render(target);
  }
  previous.addEventListener('click',() => advance(-1));
  next.addEventListener('click',() => advance(1));
  document.querySelectorAll('.chapter-button').forEach((button) => {
    button.addEventListener('click',() => {
      const first = scenes.findIndex((scene) => scene.chapter === button.dataset.chapter);
      if (first >= 0) render(first);
    });
  });
  window.addEventListener('keydown',(event) => {
    if (event.repeat) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault(); advance(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault(); advance(-1);
    } else if (event.key === 'Home') {
      event.preventDefault(); render(0);
    } else if (event.key === 'End') {
      event.preventDefault(); render(scenes.length-1);
    }
  });
  document.getElementById('presentation').addEventListener('wheel',(event) => {
    if (Math.abs(event.deltaY) < 22) return;
    event.preventDefault();
    const now = Date.now();
    if (now-lastWheel < 500) return;
    lastWheel = now;
    advance(event.deltaY > 0 ? 1 : -1);
  },{passive:false});
  render(0);
})();
