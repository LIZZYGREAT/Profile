/* Scholarship introduction demo. All curves and model probes are conceptual, not measured results. */
(() => {
  document.documentElement.classList.add('js-ready');
  const mentalTitles = {
    day: ['一天的压力建模工作台', '日程提供上下文，曲线呈现随时间变化的状态。日历之外的生活，还需要更多证据。'],
    evidence: ['对话补全日程之外的生活', '日历原本没有记录羽毛球；自然对话提供新的上下文证据，事件才进入当天的时间线上。'],
    model: ['事件不会直接变成压力', '从发生了什么，到一个人如何理解，再到需求、压力与恢复，最后进入时间动态。'],
    people: ['相同日程，不同压力轨迹', '个体的 appraisal 与动态参数不同；同一事件不必然带来相同反应。'],
    forecast: ['预测风险，也判断现在是否合适', '17:32 预见晚间风险，但当前处于项目会议，于是先 defer，等待更合适的支持窗口。'],
    care: ['支持之后，真实反馈继续形成理解', '关怀本身不会让曲线下降；只有真实发生的恢复活动和用户反馈，才成为后续证据。'],
  };

  const schedule = [
    { id: 'math', label: '高等数学', start: 8, end: 9.67, type: 'course', lane: 0 },
    { id: 'os', label: '操作系统', start: 10, end: 11.67, type: 'course', lane: 0 },
    { id: 'lunch', label: '午饭 / 午休', start: 12, end: 13, type: 'recovery', lane: 1 },
    { id: 'discussion', label: '项目讨论', start: 14, end: 15.17, type: 'meeting', lane: 0 },
    { id: 'assignment', label: '作业处理', start: 15.5, end: 17, type: 'task', lane: 1 },
    { id: 'meeting', label: '项目会议', start: 17, end: 18, type: 'meeting', lane: 0 },
    { id: 'dinner', label: '晚饭', start: 18, end: 18.67, type: 'recovery', lane: 1 },
  ];
  const curves = {
    a: [[8,.25],[8.7,.39],[9.6,.57],[9.9,.46],[10.5,.49],[11.65,.66],[12,.53],[12.45,.40],[13,.30],[14,.50],[15.1,.45],[15.55,.58],[16.6,.67],[17.2,.75],[18.05,.74],[18.65,.61],[19.4,.65],[20.45,.70],[20.8,.66],[21.1,.48],[22,.45],[22.6,.53],[23.5,.68],[23.98,.77]],
    b: [[8,.42],[8.7,.53],[9.6,.72],[9.9,.62],[10.5,.66],[11.65,.81],[12,.73],[12.45,.66],[13,.56],[14,.69],[15.1,.64],[15.55,.74],[16.6,.80],[17.2,.86],[18.05,.84],[18.65,.77],[19.4,.78],[20.45,.81],[20.8,.79],[21.1,.69],[22,.66],[22.6,.71],[23.5,.80],[23.98,.85]],
  };
  // Care is sent at 18:12; keep the illustrative state steady until exercise actually begins.
  const careCurve = [[8,.25],[8.7,.39],[9.6,.57],[9.9,.46],[10.5,.49],[11.65,.66],[12,.53],[12.45,.40],[13,.30],[14,.50],[15.1,.45],[15.55,.58],[16.6,.67],[17.2,.75],[18.05,.74],[18.2,.74],[18.65,.74],[19.4,.75],[20.45,.76],[20.75,.66],[21.1,.48],[22,.45],[22.6,.53],[23.5,.68],[23.98,.77]];

  const chartHost = document.getElementById('chart-wrap');
  const workspace = document.getElementById('mental-workspace');
  const contextPanel = document.getElementById('context-panel');
  const chartNS = 'http://www.w3.org/2000/svg';
  const mapX = (t) => 64 + ((t - 8) / 16) * 816;
  const mapY = (v) => 277 - v * 218;

  function node(name, attrs = {}, content = '') {
    const el = document.createElementNS(chartNS, name);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
    if (content) el.textContent = content;
    return el;
  }

  function smoothPath(points) {
    if (points.length < 2) return '';
    let path = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      path += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return path;
  }

  function valueAt(anchors, time) {
    for (let i = 0; i < anchors.length - 1; i++) {
      const [t1, v1] = anchors[i];
      const [t2, v2] = anchors[i + 1];
      if (time >= t1 && time <= t2) {
        const f = (time - t1) / (t2 - t1);
        return v1 + (v2 - v1) * f;
      }
    }
    return anchors[anchors.length - 1][1];
  }

  function curvePoints(anchors, maxTime = 24) {
    const result = anchors.filter(([t]) => t <= maxTime).map(([t, value]) => [mapX(t), mapY(value)]);
    if (maxTime < 24 && maxTime > anchors[0][0]) {
      result.push([mapX(maxTime), mapY(valueAt(anchors, maxTime))]);
    }
    return result;
  }

  function createChart(frame) {
    const svg = node('svg', { viewBox: '0 0 920 340', role: 'img', 'aria-labelledby': 'chart-svg-title chart-svg-desc' });
    svg.append(node('title', { id: 'chart-svg-title' }, '日程上下文上的概念性压力变化曲线'));
    svg.append(node('desc', { id: 'chart-svg-desc' }, '08:00 到 24:00 的一天，课程、任务、会议和休息时段显示为背景带。曲线为概念示意，不是实测结果。'));

    const bandLayer = node('g', { class: 'schedule-layer' });
    schedule.forEach((item) => {
      const x = mapX(item.start);
      const width = Math.max(2, mapX(item.end) - x);
      const colors = { course: ['#dce8f2','#88a6c0'], task: ['#f0dfd9','#ca9080'], meeting: ['#e7e1ef','#aa98bd'], recovery: ['#dcebe0','#83ad91'] };
      bandLayer.append(node('rect', { x, y: 69, width, height: 214, fill: colors[item.type][0], opacity: .52, rx: 2 }));
      bandLayer.append(node('line', { x1: x, y1: 69, x2: x, y2: 283, stroke: colors[item.type][1], 'stroke-width': 1, opacity: .55 }));
      const label = node('text', { x: x + width / 2, y: item.lane ? 302 : 62, 'text-anchor': 'middle', class: 'event-label', fill: colors[item.type][1] }, item.label);
      bandLayer.append(label);
    });
    const badmintonVisible = ['evidence','model','people','forecast','care'].includes(frame);
    if (badmintonVisible) {
      const x = mapX(20.5), width = mapX(21) - x;
      bandLayer.append(node('rect', { x, y: 69, width, height: 214, fill: '#dcebe0', opacity: .8, rx: 2 }));
      bandLayer.append(node('line', { x1: x, y1: 69, x2: x, y2: 283, stroke: '#83ad91', 'stroke-width': 1.2 }));
      bandLayer.append(node('text', { x: x + width / 2, y: 318, 'text-anchor': 'middle', class: 'event-label' }, '羽毛球 · 对话'));
    }
    svg.append(bandLayer);

    const grid = node('g');
    [92, 151, 210, 277].forEach((y) => grid.append(node('line', { x1: 64, y1: y, x2: 880, y2: y, class: 'grid-line' })));
    grid.append(node('text', { x: 6, y: 98, class: 'axis-note' }, '较高'));
    grid.append(node('text', { x: 6, y: 275, class: 'axis-note' }, '较低'));
    grid.append(node('line', { x1: 64, y1: 283, x2: 880, y2: 283, class: 'axis-line' }));
    [8,10,12,14,16,18,20,22,24].forEach((t) => {
      const x = mapX(t);
      grid.append(node('line', { x1: x, y1: 283, x2: x, y2: 288, class: 'axis-line' }));
      grid.append(node('text', { x, y: 332, 'text-anchor': 'middle', class: 'time-label' }, `${String(t).padStart(2,'0')}:00`));
    });
    svg.append(grid);

    const visibleCurve = frame === 'care' ? careCurve : curves.a;
    if (frame === 'forecast') {
      const start = 17.53;
      const startX = mapX(start);
      const startY = mapY(valueAt(curves.a, start));
      const future = curvePoints(curves.a, 24).filter((p) => p[0] >= startX);
      const polygon = [[startX,startY - 13], ...future.map(([x,y]) => [x,y - 17]), ...future.slice().reverse().map(([x,y]) => [x,y + 21]), [startX,startY + 13]];
      svg.append(node('path', { d: `${polygon.map(([x,y],i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ')} Z`, class: 'forecast-band' }));
      svg.append(node('line', { x1: 64, y1: mapY(.77), x2: 880, y2: mapY(.77), class: 'risk-line' }));
      svg.append(node('text', { x: 876, y: mapY(.77) - 5, 'text-anchor': 'end', class: 'axis-note' }, 'risk threshold'));
      svg.append(node('line', { x1: startX, y1: 55, x2: startX, y2: 283, class: 'now-line' }));
      svg.append(node('text', { x: startX + 5, y: 49, class: 'marker-label' }, '17:32 · RISK AHEAD'));
      svg.append(node('path', { d: smoothPath(curvePoints(curves.a, start)), class: 'curve-main' }));
      svg.append(node('path', { d: smoothPath(future), class: 'curve-forecast' }));
    } else {
      if (frame === 'people') {
        svg.append(node('path', { d: smoothPath(curvePoints(curves.b)), class: 'curve-user-b' }));
        svg.append(node('text', { x: 770, y: mapY(.81) - 8, class: 'curve-label', fill: '#8985a3' }, 'USER B'));
      }
      svg.append(node('path', { d: smoothPath(curvePoints(visibleCurve)), class: 'curve-main' }));
      svg.append(node('text', { x: 806, y: mapY(.75) - 8, class: 'curve-label', fill: '#33766d' }, frame === 'people' ? 'USER A' : 'S(t) · ILLUSTRATIVE'));
    }

    const ddlX = mapX(23.983);
    svg.append(node('line', { x1: ddlX, y1: 62, x2: ddlX, y2: 283, class: 'ddl-line' }));
    svg.append(node('text', { x: ddlX - 4, y: 56, 'text-anchor': 'end', class: 'ddl-label' }, '23:59 DDL'));
    if (frame === 'care') {
      const t = 18.2, x = mapX(t);
      svg.append(node('line', { x1: x, y1: 67, x2: x, y2: 283, class: 'now-line' }));
      svg.append(node('text', { x: x + 5, y: 47, class: 'marker-label' }, '18:12 · CARE SENT'));
    }
    return svg;
  }

  function renderContext(frame) {
    const templates = {
      day: `<p class="context-kicker">01 / CALENDAR CONTEXT</p><h4>日程是线索，<br>不是完整生活。</h4><p>课程、作业与会议构成已知上下文。压力状态仍然是随时间连续变化的潜在状态，而非单个事件的分数。</p><div class="context-rule"></div><p>晚间尚未记录运动；系统此时并不知道这项恢复活动。</p><span class="context-foot">CONTEXT ≠ STRESS</span>`,
      evidence: `<p class="context-kicker">02 / CONVERSATION AS EVIDENCE</p><div class="chat-message user-message"><div class="chat-meta"><span>YOU</span><span>21:08</span></div>刚刚和室友打了半小时羽毛球，舒服多了，今天真的累坏了</div><div class="evidence-chips"><span>20:30–21:00 · 运动 / 恢复</span><span>积极恢复证据</span><span>高负荷日背景</span></div><div class="chat-message"><div class="chat-meta"><span>LIZZY</span><span>21:09</span></div>这半小时球算是打值了。你今天从上午的课一路排到下午讨论，确实够折腾的。现在缓过来一点就行，剩下那个作业慢慢收，别刚舒服点又把自己塞满了。</div>`,
      model: `<p class="context-kicker">03 / MODEL LENS</p><h4>情境经过多层理解，<br>才进入压力动态。</h4><div class="model-chain"><span>日程 / 对话上下文</span><span>Event · Exposure</span><span>Personal Appraisal</span><span>Demand · Pressure · Recovery</span><span>Temporal Dynamics</span></div><div class="model-equation"><span>A(t)</span><i>+</i><span>B(t)</span><i>→</i><b>S(t)</b></div><span class="context-foot">CONTEXT ≠ EXPOSURE ≠ APPRAISAL ≠ STRESS</span>`,
      people: `<p class="context-kicker">04 / PERSONALIZATION</p><h4>相同日程，<br>不同的个人反应。</h4><div class="profile-compare"><div class="profile-mini"><strong>USER A</strong><span>课程胜任感 <b>高</b></span><span>任务重要性 <b>高</b></span><span>运动恢复契合 <b>高</b></span><div class="dynamic-params"><small>PERSONAL DYNAMICS</small><div><span>S₀ <b class="personalized">●</b></span><span>gA <b class="personalized">●</b></span><span>gB <b class="learning">◐</b></span><span>κ↓ <b class="learning">◐</b></span></div></div></div><div class="profile-mini"><strong>USER B</strong><span>课程胜任感 <b>中</b></span><span>任务重要性 <b>高</b></span><span>运动恢复契合 <b>低</b></span><div class="dynamic-params"><small>PERSONAL DYNAMICS</small><div><span>S₀ <b class="personalized">●</b></span><span>gA <b class="learning">◐</b></span><span>gB <b class="pooled">○</b></span><span>κ↓ <b class="pooled">○</b></span></div></div></div></div><p class="profile-state-legend">● personalized　 ◐ learning　 ○ pooled</p><span class="context-foot">STABLE APPRAISAL + PERSONAL DYNAMICS</span>`,
      forecast: `<p class="context-kicker">05 / FORECAST & POLICY</p><h4>预见风险，<br>也尊重当下情境。</h4><div class="policy-steps"><div class="policy-step"><b>1</b><span><strong>17:32</strong> · Elevated risk ahead</span></div><div class="policy-step"><b>2</b><span>当前上下文 · 17:00–18:00 项目会议</span></div><div class="policy-step defer"><b>3</b><span>Care opportunity → <strong>Defer</strong></span></div></div><div class="context-rule"></div><p>预测不是立刻打扰的理由。等待会议结束，再判断是否出现合适窗口。</p>`,
      care: `<p class="context-kicker">06 / CARE → ACTION → LEARNING</p><div class="chat-message"><div class="chat-meta"><span>LIZZY</span><span>18:12</span></div>今天这一天排得够满的，晚上那个作业又还挂着。先别急着接着坐回去写，出去走走或者打会儿球都行——你前几次运动完状态都缓得挺快。回来再收那个作业，应该会比现在硬顶舒服点。</div><div class="evidence-chips"><span>18:12 发送关怀</span><span>20:30 真实运动发生</span></div><div class="chat-message user-message"><div class="chat-meta"><span>YOU</span><span>21:08</span></div>刚刚和室友打了半小时羽毛球，舒服多了，今天真的累坏了</div><div class="evidence-flow"><span>Episode Evidence</span><b>→</b><span>Long-term understanding +</span></div>`,
    };
    contextPanel.innerHTML = templates[frame];
  }

  function setMentalFrame(frame, focus = true) {
    if (!mentalTitles[frame]) return;
    workspace.dataset.frame = frame;
    document.getElementById('mental-title').textContent = mentalTitles[frame][0];
    document.getElementById('mental-summary').textContent = mentalTitles[frame][1];
    document.getElementById('chart-mode').textContent = frame === 'forecast' ? 'PAST + FORECAST' : frame === 'people' ? 'SAME CONTEXT · TWO USERS' : 'ILLUSTRATIVE TRAJECTORY';
    contextPanel.innerHTML = '';
    chartHost.replaceChildren(createChart(frame));
    renderContext(frame);
    document.querySelectorAll('.mental-step').forEach((button) => {
      const active = button.dataset.frame === frame;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    if (focus) document.getElementById('mental-workspace').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  document.querySelectorAll('.mental-step').forEach((button) => {
    button.addEventListener('click', () => setMentalFrame(button.dataset.frame, false));
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const buttons = [...document.querySelectorAll('.mental-step')];
      const index = buttons.indexOf(button);
      const next = buttons[(index + (event.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length];
      next.focus();
      setMentalFrame(next.dataset.frame, false);
    });
  });
  setMentalFrame('day', false);

  const paperInfo = {
    ewc: ['EWC', '参数重要性', '01 / 03'],
    lwf: ['LwF', '知识蒸馏', '02 / 03'],
    icarl: ['iCaRL', 'Exemplar Memory', '03 / 03'],
  };
  function setPaper(id) {
    document.querySelectorAll('.paper-tab').forEach((button) => {
      const active = button.dataset.paper === id;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('[data-paper-image]').forEach((image) => image.classList.toggle('is-current', image.dataset.paperImage === id));
    const [name, subtitle, index] = paperInfo[id];
    document.getElementById('paper-current').innerHTML = `<span>INTERACTIVE LEARNING WORK</span><strong>${name} <i>/</i> ${subtitle}</strong>`;
    document.getElementById('paper-index').textContent = index;
  }
  document.querySelectorAll('.paper-tab').forEach((button) => button.addEventListener('click', () => setPaper(button.dataset.paper)));

  const thetaPatterns = {
    'task-a': [1,0,2,1,3,0,1,2,0, 0,1,2,3,1,2,0,1,3, 2,1,0,2,3,1,0,2,1, 3,2,1,0,1,3,2,0, 1,0,2,3,2,1,0,3, 2,1,3,0,2,1,0,1],
    forgetting: [3,1,0,2,1,3,0,2,1, 2,3,1,0,2,1,3,0,1, 1,2,3,0,1,2,3,0,2, 0,3,1,2,3,0,1,2, 2,0,3,1,2,3,0,1, 3,2,0,1,3,2,1,0],
    branch: [1,0,2,1,3,0,1,2,0, 0,1,2,3,1,2,0,1,3, 2,1,0,2,3,1,0,2,1, 3,2,1,0,1,3,2,0, 1,0,2,3,2,1,0,3, 2,1,3,0,2,1,0,1],
    methods: [2,1,3,0,1,2,0,3,1, 3,2,0,1,3,0,2,1,0, 1,3,2,0,1,3,2,1,0, 0,2,3,1,0,2,3,1, 2,0,1,3,2,1,0,3, 1,2,0,3,1,2,3,0],
    stream: [1,3,2,0,1,2,3,1,0, 2,0,3,1,2,1,0,3,2, 3,1,0,2,3,1,2,0,1, 2,3,1,0,2,3,0,1, 0,2,1,3,0,2,1,3, 1,3,0,2,1,0,2,3],
  };
  const clCaptions = {
    'task-a': 'Task A 的样本进入模型，参数状态逐步变化，Task A 的定性探针逐渐提升。',
    forgetting: 'Task B 继续更新同一个模型：Task B 逐渐学会，Task A 的能力同时出现退化。',
    branch: '从相同的 θA 出发，比较朴素微调与持续学习希望保留旧任务能力的不同目标。',
    methods: 'Continual Learning 包含多种策略方向；它们不是一条必经流程，也不等同于 EWC。',
    stream: '任务 C、D、E 继续到来。持续学习讨论的是长期任务流中的适应。',
  };
  function fillProbes(row, values) {
    const dots = row.querySelectorAll('i');
    dots.forEach((dot, index) => {
      dot.className = '';
      const value = values[index] || 0;
      if (value === 1) { dot.textContent = '◐'; dot.classList.add('is-partial'); }
      else if (value === 2) { dot.textContent = '●'; dot.classList.add('is-full'); }
      else if (value === 3) { dot.textContent = '◐'; dot.classList.add('is-warning'); }
      else dot.textContent = '○';
    });
  }
  function setCLStep(step) {
    const cl = document.getElementById('cl-workspace');
    cl.dataset.step = step;
    document.getElementById('cl-caption').textContent = clCaptions[step];
    document.getElementById('theta-state').textContent = ({ 'task-a':'θ learns Task A', forgetting:'same θ updates with Task B', branch:'same starting point · θA', methods:'multiple strategy families', stream:'Task C learning…' })[step];
    document.querySelectorAll('.cl-step').forEach((button) => {
      const active = button.dataset.clStep === step;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.parameter-cell').forEach((cell, index) => {
      const pattern = thetaPatterns[step];
      cell.dataset.tone = pattern[index % pattern.length];
      cell.classList.toggle('is-ghost', step === 'forgetting' && index % 7 === 2);
    });
    document.querySelectorAll('.task-tray').forEach((tray) => {
      tray.classList.toggle('is-selected', step === 'task-a' ? tray.dataset.tray === 'a' : step === 'forgetting' ? tray.dataset.tray === 'b' : step === 'stream' ? tray.dataset.tray === 'c' : false);
    });
    const rows = document.querySelectorAll('.probe-row[data-probe]');
    const states = {
      'task-a': { a:[2,2,1,1], b:[0,0,0,0], c:[0,0,0,0] },
      forgetting: { a:[3,0,3,0], b:[2,2,1,2], c:[0,0,0,0] },
      branch: { a:[0,0,0,0], b:[0,0,0,0], c:[0,0,0,0] },
      methods: { a:[3,0,3,0], b:[2,2,1,2], c:[0,0,0,0] },
      stream: { a:[2,2,2,1], b:[2,2,1,2], c:[2,1,0,0] },
    };
    rows.forEach((row) => fillProbes(row, states[step][row.dataset.probe]));

    const evaluation = document.querySelector('.evaluation-panel');
    let comparison = cl.querySelector('.branch-comparison');
    if (step === 'branch') {
      if (!comparison) {
        comparison = document.createElement('div');
        comparison.className = 'branch-comparison';
        comparison.innerHTML = `<div><p class="same-start">SAME STARTING MODEL · θ<sub>A</sub></p><div class="branch-lane"><strong>NAIVE FINE-TUNING</strong><div class="probe-row"><strong>OLD TASK</strong><span class="probe-dots"><i class="is-partial">◐</i><i>○</i><i>○</i></span></div><div class="probe-row"><strong>NEW TASK</strong><span class="probe-dots"><i class="is-full">●</i><i class="is-full">●</i><i class="is-full">●</i></span></div></div></div><div class="branch-lane is-cl"><strong>CONTINUAL LEARNING</strong><div class="probe-row"><strong>OLD TASK</strong><span class="probe-dots"><i class="is-full">●</i><i class="is-full">●</i><i class="is-partial">◐</i></span></div><div class="probe-row"><strong>NEW TASK</strong><span class="probe-dots"><i class="is-full">●</i><i class="is-full">●</i><i class="is-full">●</i></span></div></div>`;
      }
      evaluation.after(comparison);
    } else if (comparison) comparison.remove();

    let methods = cl.querySelector('.methods-inline');
    if (step === 'methods') {
      if (!methods) {
        methods = document.createElement('div');
        methods.className = 'methods-inline';
        methods.innerHTML = '<span>Regularization</span><span>Knowledge Distillation</span><span>Replay / Exemplars</span><span>Constraint-based</span>';
      }
      evaluation.append(methods);
    } else if (methods) methods.remove();

    let stream = cl.querySelector('.stream-label');
    if (step === 'stream') {
      if (!stream) {
        stream = document.createElement('div');
        stream.className = 'stream-label';
        stream.textContent = 'TASK C → MODEL θ · TASK D → TASK E → … · TIME ─────────────────────→';
      }
      cl.querySelector('.task-stream').append(stream);
    } else if (stream) stream.remove();
  }

  const parameterField = document.getElementById('parameter-field');
  for (let i = 0; i < 54; i++) {
    const cell = document.createElement('i');
    cell.className = 'parameter-cell';
    cell.dataset.tone = thetaPatterns['task-a'][i];
    parameterField.append(cell);
  }
  document.querySelectorAll('.cl-step').forEach((button) => button.addEventListener('click', () => setCLStep(button.dataset.clStep)));
  setCLStep('task-a');

  document.querySelectorAll('.rail-link').forEach((link) => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.rail-link').forEach((item) => item.classList.toggle('is-active', item === link));
      const chapter = link.dataset.rail;
      document.querySelectorAll('.hero-word').forEach((word) => word.classList.toggle('is-current', word.getAttribute('href') === `#${chapter}`));
    });
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .1 });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
  document.querySelectorAll('.hero .reveal').forEach((element) => element.classList.add('is-visible'));

  const chapterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      document.querySelectorAll('.rail-link').forEach((link) => link.classList.toggle('is-active', link.dataset.rail === id));
      document.querySelectorAll('.hero-word').forEach((word) => word.classList.toggle('is-current', word.getAttribute('href') === `#${id}`));
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  ['learning','building','researching'].forEach((id) => chapterObserver.observe(document.getElementById(id)));

  const pageProgress = document.getElementById('page-progress');
  const updateProgress = () => {
    const range = document.documentElement.scrollHeight - window.innerHeight;
    pageProgress.style.width = `${range > 0 ? (window.scrollY / range) * 100 : 0}%`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
})();
