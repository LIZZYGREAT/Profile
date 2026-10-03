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
  const recoveryCurve = [[8,.24],[8.7,.38],[9.6,.57],[9.9,.46],[10.5,.5],[11.65,.66],[12,.55],[12.45,.39],[13,.3],[14,.5],[15.1,.45],[15.55,.58],[16.6,.67],[17.2,.75],[18.05,.74],[18.2,.74],[18.65,.74],[19.4,.75],[20.3,.76],[20.5,.76],[20.67,.75],[20.83,.73],[21,.70],[21.17,.67],[21.33,.64],[21.5,.61],[21.75,.58],[22,.56],[22.5,.57],[23,.63],[23.5,.72],[23.98,.82]];

  function smoothPath(points) {
    if (points.length < 2) return '';
    let d = 'M ' + points[0][0].toFixed(1) + ' ' + points[0][1].toFixed(1);
    const tangent = (index) => {
      if (index === 0) return (points[1][1] - points[0][1]) / (points[1][0] - points[0][0]);
      if (index === points.length - 1) return (points[index][1] - points[index-1][1]) / (points[index][0] - points[index-1][0]);
      const left = (points[index][1] - points[index-1][1]) / (points[index][0] - points[index-1][0]);
      const right = (points[index+1][1] - points[index][1]) / (points[index+1][0] - points[index][0]);
      if (left === 0 || right === 0 || Math.sign(left) !== Math.sign(right)) return 0;
      const leftWidth = points[index][0] - points[index-1][0];
      const rightWidth = points[index+1][0] - points[index][0];
      const w1 = 2*rightWidth + leftWidth;
      const w2 = rightWidth + 2*leftWidth;
      return (w1+w2)/(w1/left+w2/right);
    };
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const width = p2[0] - p1[0];
      const c1x = p1[0] + width/3;
      const c1y = p1[1] + tangent(i)*width/3;
      const c2x = p2[0] - width/3;
      const c2y = p2[1] - tangent(i+1)*width/3;
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
      if (mode === 'personal-overlay' && event.label === '午饭 / 午休') bands += '<rect class="personal-event-highlight" data-personal-highlight="lunch" x="' + x.toFixed(1) + '" y="62" width="' + width.toFixed(1) + '" height="242" rx="2"></rect>';
      if (mode === 'personal-overlay' && event.label === '项目讨论') bands += '<rect class="personal-event-highlight" data-personal-highlight="meeting" x="' + x.toFixed(1) + '" y="62" width="' + width.toFixed(1) + '" height="242" rx="2"></rect>';
      bands += '<line x1="' + x.toFixed(1) + '" y1="62" x2="' + x.toFixed(1) + '" y2="304" stroke="#99b4a2" stroke-width="1" opacity=".55"></line>';
      const labelClass = mode === 'forecast' && event.label === '项目会议' ? 'band-label current-event-label' : 'band-label';
      bands += svgTag('text',{x:(x+width/2).toFixed(1),y:event.kind==='recovery'?'326':'55','text-anchor':'middle',class:labelClass},event.label);
    });
    if (mode === 'personal-overlay') {
      const x = mapX(19), width = mapX(20)-x;
      bands += '<rect class="personal-event-highlight" data-personal-highlight="late-gap" x="' + x.toFixed(1) + '" y="62" width="' + width.toFixed(1) + '" height="242" rx="2"></rect>';
    }
    if (includeBadminton) {
      const x = mapX(20.5), width = mapX(21) - x;
      bands += '<rect data-badminton-band class="band-recovery badminton-band" x="' + x.toFixed(1) + '" y="62" width="' + width.toFixed(1) + '" height="242" opacity=".82" rx="2"></rect>';
      bands += '<line x1="' + x.toFixed(1) + '" y1="62" x2="' + x.toFixed(1) + '" y2="304" stroke="#679777" stroke-width="1.5"></line>';
      bands += svgTag('text',{x:(x+width/2).toFixed(1),y:'347','text-anchor':'middle',class:'band-label'},'羽毛球 · 对话');
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
    const forecastAnchors = [[8,.24],[8.7,.38],[9.6,.57],[9.9,.46],[10.5,.5],[11.65,.66],[12,.55],[12.45,.39],[13,.3],[14,.5],[15.1,.45],[15.55,.58],[16.6,.67],[17.2,.75],[18.05,.74],[18.7,.68],[19.4,.66],[20,.69],[20.6,.73],[21.2,.77],[22,.82],[23,.87],[23.98,.89]];
    const anchors = mode === 'care' || mode === 'feedback' ? careCurve : anchorsA;
    let curve = '';
    if (mode === 'forecast') {
      const now = 17.533, nx = mapX(now), ny = mapY(interpolate(forecastAnchors, now));
      const future = pathPoints(forecastAnchors,24).filter((p) => p[0] >= nx);
      const upper = future.map((p) => p[0] + ' ' + (p[1] - 18)).join(' L ');
      const lower = future.slice().reverse().map((p) => p[0] + ' ' + (p[1] + 22)).join(' L ');
      curve += '<path class="uncertainty" d="M ' + nx + ' ' + (ny-14) + ' L ' + upper + ' L ' + lower + ' L ' + nx + ' ' + (ny+14) + ' Z"></path>';
      curve += '<line class="risk-line" x1="64" y1="' + mapY(.77) + '" x2="880" y2="' + mapY(.77) + '"></line>';
      curve += svgTag('text',{x:mapX(20),y:String(mapY(.77)-27),'text-anchor':'end',class:'secondary-annotation'},'risk threshold');
      curve += svgTag('text',{x:mapX(20),y:String(mapY(.77)-12),'text-anchor':'end',class:'axis-caption'},'高压风险参考线');
      curve += '<line class="now-line" x1="' + nx + '" y1="48" x2="' + nx + '" y2="304"></line>';
      curve += svgTag('text',{x:nx+7,y:'32',class:'annotation'},'17:32 · 晚间风险预计上升');
      curve += svgTag('text',{x:nx+7,y:'45',class:'secondary-annotation'},'elevated risk ahead');
      curve += '<path class="curve-line past-line" d="' + smoothPath(pathPoints(forecastAnchors,now)) + '"></path>';
      curve += '<path class="forecast-line" d="' + smoothPath(future) + '"></path>';
    } else {
      if (mode === 'personal-overlay') {
        curve += '<path class="curve-line" d="' + smoothPath(pathPoints(anchorsA,24)) + '"></path>';
        curve += '<path class="curve-b" d="' + smoothPath(pathPoints(anchorsB,24)) + '"></path>';
        curve += svgTag('text',{x:'875',y:'78','text-anchor':'end',class:'curve-tag'},'USER A');
        curve += svgTag('text',{x:'875',y:'100','text-anchor':'end',class:'curve-tag curve-tag-b'},'USER B');
      } else if (mode === 'personal-a' || mode === 'personal-b') {
        const personAnchors = mode === 'personal-a' ? anchorsA : anchorsB;
        const cls = mode === 'personal-a' ? 'curve-line' : 'curve-b';
        curve += '<path class="' + cls + '" d="' + smoothPath(pathPoints(personAnchors,24)) + '"></path>';
      } else {
        const feedbackClass = mode === 'feedback' ? 'curve-line prior-estimate' : 'curve-line';
        curve += '<path data-stress-path class="' + feedbackClass + '" d="' + smoothPath(pathPoints(anchors,24)) + '"></path>';
      }
      if (mode === 'personal-a' || mode === 'personal-b') {
        curve += svgTag('text',{x:'875',y:'78','text-anchor':'end',class:'curve-tag'},mode==='personal-a'?'S(t) · A':'S(t) · B');
      } else if (mode !== 'feedback' && mode !== 'personal-overlay') {
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
    return '<section class="scene scene-mental scene-model"><div class="mental-heading">' + sceneHead('02 — BUILDING / MODEL LENS','日程不会<em>直接变成压力。</em>','系统先理解发生了什么、这件事对这个人意味着什么，再判断它怎样随时间影响状态。') + '</div><div class="model-stage"><div class="model-context"><div class="chart-header"><strong>一天的真实上下文</strong><span class="chart-qualifier">CONCEPTUAL DAY</span></div>' + graphMarkup({mode:'day'}) + '<div class="model-context-note">课程、讨论与休息落在同一条时间线上</div></div><div class="model-explanation"><div class="model-explanation-head"><strong>从事件到状态</strong><span>先读懂，再建模</span></div><div class="lens-chain"><div><b>01</b><strong>发生了什么</strong><small>Context / Event</small></div><div><b>02</b><strong>实际经历了什么</strong><small>Realized Exposure</small></div><div><b>03</b><strong>这件事对个人意味着什么</strong><small>Personal Appraisal</small></div><div><b>04</b><strong>形成压力或恢复输入</strong><small>Demand / Pressure / Recovery</small></div><div><b>05</b><strong>随时间累积与回落</strong><small>Temporal Dynamics</small></div><div class="lens-result"><b>→</b><strong>当前压力状态　S(t)</strong></div></div><div class="model-route"><article class="model-route-card project-route"><b class="route-title">14:00 · 项目讨论</b><div class="route-steps"><span>发生讨论</span><i>→</i><span>实际参加</span><i>→</i><span>结合个人评价</span><i>→</i><strong>需求与压力</strong></div></article><article class="model-route-card recovery-route"><b class="route-title">12:00 · 午饭 / 午休</b><div class="route-steps"><span>安排休息</span><i>→</i><span>确实休息</span><i>→</i><span>结合个人评价</span><i>→</i><strong>恢复输入</strong></div></article></div></div></div></section>';
  }
  function profileMarkup(which) {
    const a = which === 'a';
    const values = a
      ? [['课程任务','对课程任务更有把握'],['任务评价','这次任务很重要'],['运动反馈','运动后恢复得比较明显']]
      : [['课程任务','对课程任务把握一般'],['任务评价','这次任务同样重要'],['运动反馈','运动恢复效果相对弱']];
    return '<article class="person-profile ' + (a?'person-a':'person-b') + '"><div class="person-profile-title"><h3>USER ' + (a?'A':'B') + '</h3><span>illustrative appraisal prior</span></div>' + values.map((item) => '<div><span>' + item[0] + '</span><b>' + item[1] + '</b></div>').join('') + '</article>';
  }
  function scenePeople() {
    return '<section class="scene scene-personalization"><div class="person-head"><div>' + sceneHead('02 — BUILDING / PERSONALIZATION','同一日程，<em>不同人的轨迹。</em>','日程相同，不代表感受相同。系统结合个人对事件的评价、历史反馈和已有证据，形成不同的预测。') + '</div></div><div class="person-shared-schedule"><b>同一日程</b><span>早课</span><i>→</i><span>午休</span><i>→</i><span>项目讨论</span><i>→</i><span>晚间作业</span><small>SHARED SCHEDULE</small></div><div class="person-comparison">' + profileMarkup('a') + profileMarkup('b') + '</div><div class="personal-overlay"><div class="personal-overlay-head"><strong>相同日程下的两条示意轨迹</strong><span>个人先验示意 · 非心理测量</span></div>' + graphMarkup({mode:'personal-overlay'}) + '<div class="personal-overlay-takeaway">同一日程　≠　同一压力轨迹</div></div></section>';
  }
  function sceneForecast() {
    return '<section class="scene scene-forecast"><div class="mental-heading">' + sceneHead('02 — BUILDING / FORECAST','提前看到风险，<em>再判断时机。</em>','17:32，模型预见晚间风险上升；它还会结合当前日程，判断是否适合发出提醒。') + '</div><div class="forecast-layout"><div class="forecast-card"><div class="chart-header"><strong>过去状态 → 未来预测</strong><span class="chart-qualifier">现在 · 17:32</span></div>' + graphMarkup({mode:'forecast'}) + '<div class="chart-legend"><span><i class="legend-swatch"></i>历史状态</span><span><i class="legend-swatch prediction"></i>预测与不确定区间</span></div></div><aside class="forecast-info"><span class="aside-index">时机判断</span><h3>现在适合打扰吗？</h3><div class="policy-flow"><div class="policy-row"><b>1</b><span>晚间风险预计上升</span></div><div class="policy-row"><b>2</b><span>17:32 · 用户仍在项目会议</span></div><div class="policy-row defer"><b>3</b><span>先不打扰，稍后重新判断 <small>defer</small></span></div></div></aside></div></section>';
  }
  function sceneCare() {
    return '<section class="scene scene-care"><div class="mental-heading">' + sceneHead('02 — BUILDING / CARE','18:12，<em>在合适的窗口回应。</em>','提醒发出去，并不意味着压力会因为一条消息自动下降。真正发生的休息、运动和反馈，才会成为新的证据。') + '</div><div class="care-layout"><div class="care-card"><div class="chart-header"><strong>压力状态 × 时间</strong><span class="chart-qualifier">提醒发出 · 18:12</span></div>' + graphMarkup({mode:'care'}) + '<div class="mental-caption">此时尚未发生新的恢复行为，曲线继续按原有状态演化。</div></div><aside class="care-info"><span class="aside-index">LIZZY · 18:12</span><div class="care-chat"><div class="chat-time"><span>LIZZY</span><span>18:12</span></div>今天从早课到下午讨论排得挺满，晚上那个作业还在。先别急着继续坐着硬顶，出去走走或者打会儿球都行。你前几次运动完状态都缓得挺快，回来再收尾会舒服些。</div></aside></div></section>';
  }
  function sceneFeedback() {
    return '<section class="scene scene-feedback"><div class="mental-heading">' + sceneHead('02 — BUILDING / FEEDBACK &amp; LEARNING','真实行动与反馈，<em>继续丰富理解。</em>','一次反馈不会立刻重写长期画像；它会成为新证据，帮助系统逐步理解这个人。') + '</div><div class="feedback-layout"><div class="feedback-card"><div class="chart-header"><strong>压力状态 × 时间</strong><span class="chart-qualifier">20:30–21:00 · 运动恢复</span></div>' + graphMarkup({mode:'feedback'}) + '<div class="chart-legend feedback-legend"><span><i class="legend-swatch prior"></i>反馈前估计</span><span><i class="legend-swatch updated"></i>加入反馈后的更新示意</span></div><div class="mental-caption">21:08 对话确认后，运动与平滑回落才进入示意轨迹。</div></div><aside class="feedback-info"><span class="aside-index">你 + LIZZY · 21:08</span><div class="feedback-chat"><div class="chat-bubble user"><header><span>你</span><span>21:08</span></header>刚刚和室友打了<span class="evidence-source" data-evidence-source>半小时羽毛球</span>，<span class="evidence-source" data-evidence-source>舒服多了</span>，今天真的累坏了。</div><div class="chat-bubble"><header><span>LIZZY</span><span>21:09</span></header>看来这半小时挺值得。今天从早课到下午讨论确实不轻松，先缓一缓，作业晚点再收尾也行。</div></div><div class="feedback-evidence-marker" data-feedback-evidence-marker><strong>恢复反馈</strong><small>evidence · 观测信号</small></div><div class="feedback-evidence"><span>这次反馈</span><b>→</b><strong>成为以后判断的一条新证据</strong><small>episode evidence</small></div></aside></div><div class="closure-loop"><span>理解</span><i>→</i><span>建模</span><i>→</i><span>预测</span><i>→</i><span>支持</span><i>→</i><strong>学习</strong><i>↺</i></div></section>';
  }
  function sceneResearchIntro() {
    return '<section class="scene scene-research-intro"><div class="research-intro-transition"><span>LEARN</span><i>→</i><strong>LEARN OVER TIME</strong></div><p class="scene-kicker">03 — RESEARCHING / CONTINUAL LEARNING</p><h1 class="scene-title">如果任务一直变化，<br><em>模型还能一直学下去吗？</em></h1><p class="scene-lead">MentalFlow 的学习回路让我开始追问：任务持续变化时，模型怎样学会新的，同时尽量保留旧能力？</p></section>';
  }
  function parameterCells(state, limit) {
    const updatesOnTaskB = new Set([0,3,4,6,9,11,13,16,18,19,22,24,27,29,31,32,35,37,40,42,44,47]);
    const tones = {
      initial:[1,2,1,3,2,1,2,1,3,1,2,2,1,3,1,2,2,1,2,3,1,2,1,3,2,1,3,2,1,2,2,3,1,2,3,1,2,1,2,3,1,3,2,1,3,2,1,2],
      taskA:[2,3,2,3,2,2,3,1,3,2,2,3,2,3,2,2,3,2,2,3,1,2,2,3,3,2,3,2,2,3,2,3,2,3,3,2,2,2,3,3,2,3,2,2,3,3,2,3],
      taskB:[3,2,3,1,3,2,3,2,2,3,2,3,3,1,3,2,3,2,3,2,3,1,2,3,2,3,2,3,1,3,3,2,3,2,1,3,3,2,3,1,2,3,3,2,1,3,2,3],
    }[state];
    return tones.slice(0,limit || tones.length).map((tone,index) => '<i class="field-cell field-wave-' + (1+(index%6)) + ' tone-' + tone + (state === 'initial' && updatesOnTaskB.has(index) ? ' b-update-cell' : '') + '" aria-hidden="true"></i>').join('');
  }
  function taskSamples(kind) {
    const symbols = kind === 'task-a' ? ['○','△','○','△','△','○','△','○'] : ['□','◇','□','◇','◇','□','◇','□'];
    return symbols.map((symbol,index) => '<i>' + symbol + '</i>').join('');
  }
  function sceneCLForgetting() {
    return '<section class="scene cl-scene cl-forgetting"><header class="cl-scene-head"><div><p class="scene-kicker">03 — RESEARCHING / LEARNING DYNAMICS</p><h2>同一个模型，继续学习新的任务。</h2><p>先学习 Task A，再继续学习 Task B。新任务训练会继续修改同一个模型，我们同时观察新旧任务的表现怎样变化。</p></div></header>' +
      '<div class="cl-dynamics-stage is-task-a" data-cl-dynamics><div class="cl-task-stream"><span class="board-label">任务流 · 按时间到来</span>' +
      '<article class="task-tray task-a-tray"><header><strong>TASK A DATA</strong><small>先学习</small></header><div class="sample-tray task-a-samples" aria-label="Task A 概念示意样本">' + taskSamples('task-a') + '</div><span class="sample-caption">示意数据 · conceptual samples</span></article>' +
      '<article class="task-tray task-b-tray"><header><strong>TASK B DATA</strong><small>随后到来</small></header><div class="sample-tray task-b-samples" aria-label="Task B 概念示意样本">' + taskSamples('task-b') + '</div><span class="sample-caption">示意数据 · conceptual samples</span></article></div>' +
      '<div class="cl-learning-path" aria-hidden="true"><span class="sample-batch batch-a batch-a-one">○ △ ○ △</span><span class="sample-batch batch-a batch-a-two">△ ○ △ ○</span><span class="sample-batch batch-b batch-b-one">□ ◇ □ ◇</span><span class="sample-batch batch-b batch-b-two">◇ □ ◇ □</span><i>→</i></div>' +
      '<section class="cl-model-workspace"><header class="cl-model-heading"><div><span>MODEL</span><strong>θ</strong></div><small>同一个模型，持续更新参数</small></header><div class="parameter-states"><div class="parameter-stack"><div class="parameter-field parameter-field-current" aria-label="模型参数状态示意">' + parameterCells('initial') + '</div></div><aside class="theta-a-snapshot" aria-label="Task A 学完后的模型参数快照"><strong>Task A 后</strong><span>θ_A 快照</span><div class="parameter-field snapshot-field" aria-hidden="true">' + parameterCells('taskA',24) + '</div></aside></div><div class="parameter-meta"><span class="model-state-caption">参数状态 · 概念示意</span><span class="same-model-tag">SAME MODEL</span></div></section>' +
      '<aside class="cl-performance"><span class="board-label">同一个模型在两个任务上的表现</span><small class="performance-qualifier">qualitative performance</small><div class="performance-row old-task"><b>Task A</b><div class="performance-track"><i></i></div></div><div class="performance-row new-task"><b>Task B</b><div class="performance-track"><i></i></div></div><div class="performance-key"><span>较低</span><span>较高</span></div><div class="performance-delta" aria-hidden="true"><strong>A ↓</strong><strong>B ↑</strong></div><div class="forgetting-reveal"><strong>学会新的，旧任务表现却下降了。</strong><div class="forgetting-name"><span>灾难性遗忘</span><small>Catastrophic Forgetting</small></div></div></aside></div>' +
      '<div class="cl-footline"><span>Conceptual visualization</span><span>A → same model θ → B</span></div></section>';
  }
  function sceneCLObjective() {
    const lane = (kind,title,english,oldWidth,newWidth) => '<article class="branch-lane branch-lane-' + kind + '"><header><div><strong>' + title + '</strong><small>' + english + '</small></div><span class="branch-model-tag">MODEL STATE</span></header><div class="branch-lane-content"><div class="branch-model-visual"><div class="parameter-field branch-parameter-mini" aria-hidden="true">' + parameterCells(kind === 'naive' ? 'taskB' : 'taskA',24) + '</div><span>更新后的参数状态 · 示意</span></div><div class="branch-metrics"><div class="branch-performance-row"><b>旧任务 A</b><div class="performance-track"><i style="--bar-width:' + oldWidth + '%"></i></div></div><div class="branch-performance-row"><b>新任务 B</b><div class="performance-track"><i style="--bar-width:' + newWidth + '%"></i></div></div></div></div></article>';
    return '<section class="scene cl-scene cl-objective"><header class="cl-scene-head"><div><p class="scene-kicker">03 — RESEARCHING / FREEZE &amp; BRANCH</p><h2>从同一个起点出发，<em>学习新知识，也尽量保留旧能力。</em></h2><p>为了比较两种训练方式，这里回到 Task A 学完后的同一起点；对比的是继续学习 Task B 时，旧任务和新任务表现如何变化。</p></div></header>' +
      '<div class="branch-flow" data-branch-flow><svg class="branch-links" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true"><path d="M 205 250 C 300 250 292 140 380 140 L 450 140"></path><path d="M 205 250 C 300 250 292 365 380 365 L 450 365"></path></svg>' +
      '<section class="branch-model-source"><span class="branch-source-kicker">COMPARISON RESET · 对比起点</span><div class="parameter-field branch-origin-field" aria-hidden="true">' + parameterCells('taskA') + '</div><strong class="branch-origin-state">θ_A</strong><span class="branch-source-caption">Task A 学完后的模型状态</span></section>' +
      '<div class="branch-lanes">' + lane('naive','普通继续训练','Naive fine-tuning',29,90) + lane('continual','持续学习','Continual learning',62,76) + '</div></div>' +
      '<div class="branch-task-stream"><span>A</span><i>→</i><span>B</span><i>→</i><strong class="task-c-arrives">C</strong><i class="task-tail-arrives">→</i><span class="task-tail-arrives">D　E　…</span><small class="task-tail-arrives">TIME ─────────────────────→</small></div>' +
      '<div class="cl-footline"><span>Conceptual visualization</span><span>A → same model θ → B</span></div></section>';
  }
  function sceneStrategyBridge() {
    const method = (id,principle,english,name,summary) => '<article class="method-bridge method-bridge-' + id + '" data-bridge-method="' + id + '"><div class="bridge-principle"><strong>' + principle + '</strong><small>' + english + '</small></div><span class="bridge-connector" aria-hidden="true">↓</span><div class="bridge-method"><strong>' + name + '</strong><span>' + summary + '</span></div></article>';
    return '<section class="scene cl-scene strategy-bridge-scene"><header class="cl-scene-head"><div><p class="scene-kicker">03 — RESEARCHING / STRATEGY → PAPERS</p><h2>解决同一个问题，<em>可以从不同地方入手。</em></h2><p>学习新任务时，怎样尽量保留已经学到的内容？经典方法给出了几种不同思路。</p></div></header>' +
      '<div class="strategy-bridge"><div class="strategy-bridge-context"><span class="strategy-context-label">持续学习的共同目标</span><div><strong>学新的</strong><i>＋</i><strong>尽量保留旧能力</strong></div><small>CONCEPTUAL STRATEGY MAP</small></div><div class="strategy-methods">' +
      method('ewc','限制关键参数变化','REGULARIZATION','EWC','保护对旧任务重要的参数') +
      method('lwf','保留旧模型的响应','DISTILLATION','LwF','继续参考旧模型给出的目标') +
      method('icarl','保留少量代表样本','EXEMPLARS / REPLAY','iCaRL','用代表样本帮助保留旧类别') +
      '</div><div class="strategy-bridge-caption"><span>这里只抽取每篇工作的一个代表性机制。</span><strong>Representative intuition · 非完整方法定义</strong></div></div>' +
      '<div class="cl-footline"><span>Conceptual visualization</span><span>A → same model θ → B</span></div></section>';
  }
  const paperAssets = {
    ewc:{src:'assets/ewc.png',width:1896,height:1078,alt:'EWC 持续学习可视化实验室页面，展示运行视图与数学视图'},
    lwf:{src:'assets/lwf.png',width:1885,height:852,alt:'LwF 交互式论文解释页面，展示 Teacher、Student 与联合损失'},
    icarl:{src:'assets/icarl.png',width:1915,height:1079,alt:'iCaRL 交互式论文解释页面，展示 exemplar 列表与 herding 选择'},
  };
  const paperCopy = {
    ewc:{name:'EWC',headline:'代表机制：保护重要参数',detail:'对旧任务更重要的参数，新任务训练时少改一点。'},
    lwf:{name:'LwF',headline:'代表机制：保留旧模型的响应',detail:'没有旧数据时，继续参考旧模型的输出。'},
    icarl:{name:'iCaRL',headline:'代表机制：保留少量代表样本',detail:'从旧类别中保留少量有代表性的 exemplar。'},
    overview:{name:'持续学习 · 论文理解与交互重构',headline:'为了检查自己是不是真的理解，我把论文里的训练流程、公式和关键机制重新做成交互式网页。',detail:'从 EWC、LwF、iCaRL 逐步形成理解。'},
  };
  const paperShots = {
    ewc:{
      overview:{x:0,y:0,width:1,height:1},
      shots:[
        {key:'model',label:'SHARED MODEL',region:{x:.12,y:.13,width:.80,height:.74}},
        {key:'constraint',label:'FISHER / EWC LOSS',region:{x:.20,y:.13,width:.80,height:.74}},
      ],
    },
    lwf:{
      overview:{x:0,y:0,width:1,height:1},
      shots:[{key:'mechanism',label:'TEACHER · STUDENT · JOINT LOSS',region:{x:.04,y:0,width:.92,height:1}}],
    },
    icarl:{
      overview:{x:0,y:0,width:1,height:1},
      shots:[
        {key:'exemplar',label:'EXEMPLAR LIST',region:{x:.05,y:.08,width:.90,height:.76}},
        {key:'herding',label:'HERDING SELECTION',region:{x:.05,y:.16,width:.90,height:.76}},
      ],
    },
  };
  function scenePaper() {
    const images = Object.keys(paperAssets).map((id) => {
      const asset = paperAssets[id];
      return '<figure class="paper-node paper-node-' + id + '" data-paper-node="' + id + '"><img src="' + asset.src + '" width="' + asset.width + '" height="' + asset.height + '" alt="' + asset.alt + '" loading="eager" decoding="async"></figure>';
    }).join('');
    return '<section class="scene scene-paper" data-camera="ewc"><header class="paper-heading"><div class="paper-title"><div class="paper-title-main"><span>CONTINUAL LEARNING · STUDY WORK</span><strong data-paper-method></strong></div><div class="paper-study-path" aria-label="论文学习路径"><span class="paper-study-step" data-paper-step="ewc">EWC</span><i></i><span class="paper-study-step" data-paper-step="lwf">LwF</span><i></i><span class="paper-study-step" data-paper-step="icarl">iCaRL</span></div></div>' +
      '<div class="paper-caption"><strong data-paper-caption></strong><span data-paper-subcaption></span></div></header>' +
      '<div class="paper-camera" data-paper-camera data-phase="overview"><div class="paper-world" data-paper-world>' + images + '</div><span class="paper-camera-label" data-paper-phase-label>整张页面</span></div>' +
      '<footer class="paper-process" data-paper-process hidden><div><span>阅读</span><i>→</i><span>理解</span><i>→</i><span>重构</span><i>→</i><span>交互解释</span></div><small>学习路径：EWC · LwF · iCaRL · GEM · …</small></footer></section>';
  }
  function miniTrajectory(className, anchors) {
    return '<svg class="axis-trajectory ' + className + '" viewBox="64 62 816 242" preserveAspectRatio="none" aria-hidden="true"><path d="' + smoothPath(pathPoints(anchors,24)) + '"></path></svg>';
  }
  function sceneAdaptation() {
    return '<section class="scene scene-adaptation"><div class="adaptation-axes"><span class="axis-y-label">DIFFERENT PEOPLE</span><span class="axis-x-label">CHANGING TASKS / DATA <b>→</b></span><span class="axis-person-label axis-person-a">USER A</span><span class="axis-person-label axis-person-b">USER B</span><span class="axis-person-label axis-person-c">USER C</span>' + miniTrajectory('trajectory-a',anchorsA) + miniTrajectory('trajectory-b',anchorsB) + '<div class="adapt-task-stream"><span class="adapt-task-tag task-a" style="--task-stop:4%">A</span><i class="adapt-task-link link-a" style="--task-stop:19%">→</i><span class="adapt-task-tag task-b" style="--task-stop:34%">B</span><i class="adapt-task-link link-b" style="--task-stop:49%">→</i><span class="adapt-task-tag task-c" style="--task-stop:64%">C</span><i class="adapt-task-link link-c" style="--task-stop:79%">→</i><span class="adapt-task-tag task-more" style="--task-stop:94%">…</span></div><div class="axis-core"><strong>ADAPTATION</strong><small>Adapt over time × Adapt across people</small></div></div><div class="adaptation-summary"><p class="scene-kicker">ONE QUESTION · TWO DIRECTIONS</p><h2>适应变化，<br>也适应不同的人。</h2><p>持续学习关注跨时间与任务的适应；个性化关注不同个体。两者共同指向智能系统如何在长期使用中持续调整。</p><div class="adaptation-equation"><strong>CONTINUAL LEARNING</strong> · Adapt over time<br><strong>PERSONALIZATION</strong> · Adapt across people</div></div></section>';
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
    { id:'cl-forgetting', chapter:'RESEARCHING', render:sceneCLForgetting },
    { id:'cl-objective', chapter:'RESEARCHING', render:sceneCLObjective },
    { id:'strategy-bridge', chapter:'RESEARCHING', render:sceneStrategyBridge },
    { id:'paper-ewc', chapter:'RESEARCHING', render:() => scenePaper('ewc') },
    { id:'paper-lwf', chapter:'RESEARCHING', render:() => scenePaper('lwf') },
    { id:'paper-icarl', chapter:'RESEARCHING', render:() => scenePaper('icarl') },
    { id:'paper-overview', chapter:'RESEARCHING', render:() => scenePaper('overview') },
    { id:'adaptation', chapter:'RESEARCHING', render:sceneAdaptation },
  ];
  const container = document.getElementById('scene-container');
  const indexNode = document.getElementById('scene-index');
  const totalNode = document.getElementById('scene-total');
  const bar = document.getElementById('scene-progress-bar');
  const previous = document.getElementById('previous-scene');
  const next = document.getElementById('next-scene');
  let currentIndex = 0;
  let lastWheel = 0;
  let paperCameraRun = 0;
  if (new URLSearchParams(window.location.search).get('record') === '1') document.body.classList.add('recording-mode');
  totalNode.textContent = String(scenes.length).padStart(2,'0');

  function setChapter(chapter) {
    document.querySelectorAll('.chapter-button').forEach((button) => {
      const active = button.dataset.chapter === chapter;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current','step');
      else button.removeAttribute('aria-current');
    });
  }
  function flyEvidence() {
    const sourceNodes = [...document.querySelectorAll('[data-evidence-source]')];
    const scene = document.querySelector('.scene-feedback');
    const target = scene?.querySelector('[data-feedback-evidence-marker]');
    if (!sourceNodes.length || !target || !scene) return;
    let finishCount = 0;
    function complete() {
      finishCount += 1;
      if (finishCount !== sourceNodes.length) return;
      target.classList.add('is-received');
      const svg = scene.querySelector('.stress-svg');
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
      recoveryPath.setAttribute('class','curve-line updated-estimate recovery-draw');
      recoveryPath.setAttribute('pathLength','1');
      recoveryPath.setAttribute('d',smoothPath(pathPoints(recoveryCurve,24)));
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
  function setPaperTransform(frame,world,nodeId,shotKey) {
    const frameWidth = frame.clientWidth, frameHeight = frame.clientHeight;
    if (!frameWidth || !frameHeight) return;
    const nodes = [...world.querySelectorAll('[data-paper-node]')];
    if (shotKey === 'global') {
      const bounds = nodes.reduce((box,node) => ({
        left:Math.min(box.left,node.offsetLeft), top:Math.min(box.top,node.offsetTop),
        right:Math.max(box.right,node.offsetLeft+node.offsetWidth), bottom:Math.max(box.bottom,node.offsetTop+node.offsetHeight),
      }),{left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity});
      const width = bounds.right-bounds.left, height = bounds.bottom-bounds.top;
      const scale = Math.min(frameWidth/width,frameHeight/height)*.94;
      world.style.transform = 'translate3d(' + (frameWidth/2-(bounds.left+width/2)*scale) + 'px,' + (frameHeight/2-(bounds.top+height/2)*scale) + 'px,0) scale(' + scale + ')';
      return;
    }
    const node = world.querySelector('[data-paper-node="' + nodeId + '"]');
    if (!node) return;
    const shot = shotKey === 'overview'
      ? {region:paperShots[nodeId].overview}
      : paperShots[nodeId].shots.find((candidate) => candidate.key === shotKey);
    if (!shot) return;
    const region = shot.region;
    const scale = Math.min(frameWidth/(node.offsetWidth*region.width),frameHeight/(node.offsetHeight*region.height))*.94;
    const centerX = node.offsetLeft + (region.x+region.width/2)*node.offsetWidth;
    const centerY = node.offsetTop + (region.y+region.height/2)*node.offsetHeight;
    world.style.transform = 'translate3d(' + (frameWidth/2-centerX*scale) + 'px,' + (frameHeight/2-centerY*scale) + 'px,0) scale(' + scale + ')';
  }
  function waitForPaperMotion(world) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(fallback);
        world.removeEventListener('transitionend',onEnd);
        resolve();
      };
      const onEnd = (event) => {
        if (event.target === world && event.propertyName === 'transform') finish();
      };
      const fallback = window.setTimeout(finish,1100);
      world.addEventListener('transitionend',onEnd);
    });
  }
  const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve,duration));
  function renderPaper(camera,run) {
    let workspace = container.querySelector('.scene-paper');
    const isNewWorkspace = !workspace;
    if (isNewWorkspace) {
      container.innerHTML = scenePaper();
      workspace = container.querySelector('.scene-paper');
    }
    const world = workspace.querySelector('[data-paper-world]');
    const frame = workspace.querySelector('[data-paper-camera]');
    const copy = paperCopy[camera];
    workspace.dataset.camera = camera;
    const completedPaperIndex = ['ewc','lwf','icarl'].indexOf(camera);
    workspace.querySelectorAll('[data-paper-step]').forEach((step,index) => {
      step.classList.toggle('is-complete',camera === 'overview' || (completedPaperIndex >= 0 && index <= completedPaperIndex));
      step.classList.toggle('is-current',step.dataset.paperStep === camera);
    });
    workspace.querySelector('[data-paper-method]').textContent = copy.name;
    workspace.querySelector('[data-paper-caption]').textContent = copy.headline;
    workspace.querySelector('[data-paper-subcaption]').textContent = copy.detail;
    workspace.querySelector('[data-paper-process]').hidden = camera !== 'overview';
    world.classList.toggle('is-initial',isNewWorkspace);
    world.querySelectorAll('[data-paper-node]').forEach((node) => node.classList.remove('is-selected'));
    if (camera === 'overview') {
      frame.dataset.phase = 'global';
      workspace.querySelector('[data-paper-phase-label]').textContent = '三张页面 · 全局概览';
      frame.dataset.shot = 'global';
      setPaperTransform(frame,world,'','global');
      return;
    }
    frame.dataset.phase = 'overview';
    frame.dataset.shot = 'overview';
    workspace.querySelector('[data-paper-phase-label]').textContent = '整张页面 · OVERVIEW';
    setPaperTransform(frame,world,camera,'overview');
    if (isNewWorkspace) requestAnimationFrame(() => world.classList.remove('is-initial'));
    const targetScene = 'paper-' + camera;
    const isCurrent = () => paperCameraRun === run && scenes[currentIndex]?.id === targetScene && workspace.isConnected;
    const showShots = async () => {
      if (!isNewWorkspace) await waitForPaperMotion(world);
      if (!isCurrent()) return;
      await wait(500);
      if (!isCurrent()) return;
      for (let index=0;index<paperShots[camera].shots.length;index+=1) {
        const shot = paperShots[camera].shots[index];
        frame.dataset.phase = 'focus';
        frame.dataset.shot = shot.key;
        workspace.querySelector('[data-paper-phase-label]').textContent = shot.label;
        world.querySelectorAll('[data-paper-node]').forEach((node) => node.classList.toggle('is-selected',node.dataset.paperNode === camera));
        setPaperTransform(frame,world,camera,shot.key);
        await waitForPaperMotion(world);
        if (!isCurrent()) return;
        if (index < paperShots[camera].shots.length-1) await wait(350);
      }
    };
    showShots();
  }
  function render(index) {
    const run = ++paperCameraRun;
    currentIndex = Math.max(0,Math.min(scenes.length-1,index));
    const scene = scenes[currentIndex];
    if (scene.id.startsWith('paper-')) renderPaper(scene.id === 'paper-overview' ? 'overview' : scene.id.slice('paper-'.length),run);
    else container.innerHTML = scene.render();
    indexNode.textContent = String(currentIndex+1).padStart(2,'0');
    bar.style.width = ((currentIndex+1)/scenes.length*100) + '%';
    previous.disabled = currentIndex === 0;
    next.disabled = currentIndex === scenes.length-1;
    setChapter(scene.chapter);
    if (scene.id === 'mental-feedback') requestAnimationFrame(flyEvidence);
    if (scene.id === 'cl-forgetting') {
      const dynamics = container.querySelector('[data-cl-dynamics]');
      const schedule = (delay,className) => window.setTimeout(() => {
        if (dynamics && dynamics.isConnected) dynamics.classList.add(className);
      },delay);
      schedule(1800,'is-task-a-learned');
      schedule(2400,'is-snapshot');
      schedule(3000,'is-task-b');
      schedule(3400,'is-same-model');
      schedule(5600,'is-conflict');
      schedule(6350,'is-explained');
      schedule(6900,'is-defined');
      window.setTimeout(() => {
        if (dynamics && dynamics.isConnected) dynamics.classList.remove('is-conflict');
      },6320);
    }
    if (scene.id === 'cl-objective') {
      const branch = container.querySelector('[data-branch-flow]');
      const branchScene = container.querySelector('.cl-objective');
      window.setTimeout(() => {
        if (!branch || !branch.isConnected) return;
        branch.classList.add('is-connected');
      }, 500);
      window.setTimeout(() => {
        if (branch && branch.isConnected) branch.classList.add('is-branched');
      }, 1450);
      window.setTimeout(() => {
        if (branch && branch.isConnected) branch.classList.add('is-continuing');
        if (branchScene && branchScene.isConnected) branchScene.classList.add('is-continuing');
      }, 5700);
    }
    if (scene.id === 'strategy-bridge') {
      const strategyBridge = container.querySelector('.strategy-bridge');
      const methods = [...container.querySelectorAll('[data-bridge-method]')];
      ['ewc','lwf','icarl'].forEach((id,index) => window.setTimeout(() => {
        if (!strategyBridge || !strategyBridge.isConnected) return;
        methods.forEach((methodNode,methodIndex) => {
          methodNode.classList.toggle('is-current',methodIndex === index);
          methodNode.classList.toggle('is-previous',methodIndex < index);
          methodNode.classList.toggle('is-upcoming',methodIndex > index);
        });
      },500+index*900));
      window.setTimeout(() => {
        if (strategyBridge && strategyBridge.isConnected) strategyBridge.classList.add('is-complete');
      },3200);
    }
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
    if (event.key.toLowerCase() === 'h') {
      document.body.classList.toggle('recording-mode');
    } else if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
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
