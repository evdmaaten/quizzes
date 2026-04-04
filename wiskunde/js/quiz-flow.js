<script>
window.createQuizApp = function(config){
  const STORAGE_KEY = config.storageKey;
  const BANK = config.bank;
  const ROUND_SIZE = Math.min(config.roundSize || 8, BANK.length);
  const NEXT_QUIZ = config.nextQuiz || null;
  const PREV_QUIZ = config.prevQuiz || null;
  const HOME_PAGE = config.homePage || "wiskunde/index.html";
  const SUBJECT_KEY = config.subjectKey || "algemeen";
  const SUBJECT_TOTAL = config.subjectTotal || 1;
  const QUIZ_NUMBER = config.quizNumber || 1;

  let activeQuestions = [];
  let currentQuestion = 0;
  let examMode = false;
  let checkedAnswers = [];
  let selectedAnswers = [];
  let roundLocked = false;

  const vraagNummer = document.getElementById('vraagNummer');
  const questionText = document.getElementById('questionText');
  const theoryText = document.getElementById('theoryText');
  const answersWrap = document.getElementById('answersWrap');
  const feedback = document.getElementById('feedback');
  const counter = document.getElementById('counter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const checkBtn = document.getElementById('checkBtn');
  const toggleTheoryBtn = document.getElementById('toggleTheoryBtn');
  const toggleExamBtn = document.getElementById('toggleExamBtn');
  const newQuizBtn = document.getElementById('newQuizBtn');
  const bestScoreEl = document.getElementById('bestScore');
  const lastScoreEl = document.getElementById('lastScore');
  const graphWrap = document.getElementById('graphWrap');
  const graphCanvas = document.getElementById('graphCanvas');
  const progressText = document.getElementById('subjectProgressText');

  function shuffle(arr){
    const a = arr.slice();
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function loadStats(){
    bestScoreEl.textContent = localStorage.getItem(STORAGE_KEY + '_best') || '0';
    lastScoreEl.textContent = localStorage.getItem(STORAGE_KEY + '_last') || '—';
    updateSubjectProgressText();
  }

  function markQuizCompleted(){
    const done = JSON.parse(localStorage.getItem('subject_' + SUBJECT_KEY + '_done') || '[]');
    if(!done.includes(QUIZ_NUMBER)){
      done.push(QUIZ_NUMBER);
      done.sort((a,b) => a-b);
      localStorage.setItem('subject_' + SUBJECT_KEY + '_done', JSON.stringify(done));
    }
  }

  function getSubjectProgress(){
    const done = JSON.parse(localStorage.getItem('subject_' + SUBJECT_KEY + '_done') || '[]');
    return done.length;
  }

  function updateSubjectProgressText(){
    if(progressText){
      progressText.textContent = `Voortgang onderwerp: ${getSubjectProgress()} / ${SUBJECT_TOTAL}`;
    }
  }

  function startRound(){
    activeQuestions = shuffle(BANK).slice(0, ROUND_SIZE);
    currentQuestion = 0;
    roundLocked = false;
    selectedAnswers = new Array(activeQuestions.length).fill(null);
    checkedAnswers = new Array(activeQuestions.length).fill(false);
    feedback.textContent = '';
    feedback.className = 'feedback';
    renderQuestion();
  }

  function renderQuestion(){
    const q = activeQuestions[currentQuestion];
    vraagNummer.textContent = `Vraag ${currentQuestion + 1}`;
    questionText.innerHTML = q.prompt;
    theoryText.innerHTML = q.theory;
    theoryText.classList.remove('open');
    counter.textContent = `${currentQuestion + 1} / ${activeQuestions.length}`;
    answersWrap.innerHTML = '';

    q.options.forEach((opt, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer';
      btn.innerHTML = opt;

      if(selectedAnswers[currentQuestion] === index){
        btn.classList.add('selected');
      }

      if(checkedAnswers[currentQuestion]){
        if(index === q.answer) btn.classList.add('correct');
        if(index === selectedAnswers[currentQuestion] && index !== q.answer) btn.classList.add('wrong');
      }

      btn.addEventListener('click', () => {
        if(roundLocked) return;
        if(checkedAnswers[currentQuestion]) return;
        selectedAnswers[currentQuestion] = index;
        renderQuestion();
      });

      answersWrap.appendChild(btn);
    });

    if(q.graph){
      graphWrap.classList.add('show');
      drawGraph(graphCanvas, q.graph);
    } else {
      graphWrap.classList.remove('show');
      const ctx = graphCanvas.getContext('2d');
      ctx.clearRect(0,0,graphCanvas.width,graphCanvas.height);
    }

    if(checkedAnswers[currentQuestion]){
      if(selectedAnswers[currentQuestion] === q.answer){
        feedback.innerHTML = `Goed gedaan!<div class="explanation">${q.explanation}</div>`;
        feedback.className = 'feedback ok';
      } else {
        feedback.innerHTML = `Niet goed. Het juiste antwoord is: ${q.options[q.answer]}<div class="explanation">${q.explanation}</div>`;
        feedback.className = 'feedback bad';
      }
    } else {
      feedback.textContent = '';
      feedback.className = 'feedback';
    }

    prevBtn.disabled = currentQuestion === 0 && !PREV_QUIZ;
    nextBtn.style.opacity = '1';
    prevBtn.style.opacity = prevBtn.disabled ? '0.35' : '1';
  }

  function checkCurrentAnswer(){
    if(roundLocked) return;
    const q = activeQuestions[currentQuestion];
    const selected = selectedAnswers[currentQuestion];

    if(selected === null){
      feedback.textContent = 'Kies eerst een antwoord.';
      feedback.className = 'feedback bad';
      return;
    }

    checkedAnswers[currentQuestion] = true;
    renderQuestion();

    if(examMode && checkedAnswers.every(Boolean)){
      finishRound();
    }
  }

  function finishRound(){
    const score = activeQuestions.reduce((sum, q, i) => sum + (selectedAnswers[i] === q.answer ? 1 : 0), 0);
    roundLocked = true;
    localStorage.setItem(STORAGE_KEY + '_last', `${score} / ${activeQuestions.length}`);
    const best = Number(localStorage.getItem(STORAGE_KEY + '_best') || '0');
    if(score > best){
      localStorage.setItem(STORAGE_KEY + '_best', String(score));
    }
    markQuizCompleted();
    loadStats();
  }

  function allAnswered(){
    return checkedAnswers.every(Boolean);
  }

  function goNext(){
    if(currentQuestion < activeQuestions.length - 1){
      currentQuestion++;
      renderQuestion();
      return;
    }

    if(!allAnswered()){
      feedback.textContent = 'Beantwoord eerst alle vragen.';
      feedback.className = 'feedback bad';
      return;
    }

    finishRound();

    if(NEXT_QUIZ){
      window.location.href = NEXT_QUIZ;
    } else {
      window.location.href = HOME_PAGE;
    }
  }

  function goPrev(){
    if(currentQuestion > 0){
      currentQuestion--;
      renderQuestion();
      return;
    }
    if(PREV_QUIZ){
      window.location.href = PREV_QUIZ;
    }
  }

  function toggleExamMode(){
    examMode = !examMode;
    toggleExamBtn.textContent = examMode ? 'Toetsmodus: aan' : 'Toetsmodus: uit';
  }

  function drawGraph(canvas, cfg){
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const xmin = cfg.xmin, xmax = cfg.xmax, ymin = cfg.ymin, ymax = cfg.ymax;

    const X = x => (x - xmin) / (xmax - xmin) * w;
    const Y = y => h - (y - ymin) / (ymax - ymin) * h;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#e5edf7';
    ctx.lineWidth = 1;
    for(let i = Math.ceil(xmin); i <= Math.floor(xmax); i++){
      ctx.beginPath(); ctx.moveTo(X(i), 0); ctx.lineTo(X(i), h); ctx.stroke();
    }
    for(let j = Math.ceil(ymin); j <= Math.floor(ymax); j++){
      ctx.beginPath(); ctx.moveTo(0, Y(j)); ctx.lineTo(w, Y(j)); ctx.stroke();
    }

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.6;
    if(xmin < 0 && xmax > 0){ ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), h); ctx.stroke(); }
    if(ymin < 0 && ymax > 0){ ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.stroke(); }

    function f(x){
      switch(cfg.type){
        case 'line': return cfg.m * x + cfg.b;
        case 'parabola': return cfg.a * x * x + cfg.b * x + cfg.c;
        case 'trig': {
          const u = cfg.B * x + cfg.C;
          return cfg.kind === 'cos' ? cfg.A * Math.cos(u) + cfg.D : cfg.A * Math.sin(u) + cfg.D;
        }
        case 'exp': return cfg.A * Math.exp(cfg.B * x) + cfg.C;
        case 'reciprocal':
          if(Math.abs(x - cfg.h) < 1e-4) return null;
          return cfg.a / (x - cfg.h) + cfg.k;
        case 'poly': return cfg.coeffs.reduce((acc, c) => acc * x + c, 0);
        default: return null;
      }
    }

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.4;
    let first = true;
    for(let px = 0; px <= w; px++){
      const x = xmin + (px / w) * (xmax - xmin);
      const y = f(x);
      if(y === null || !Number.isFinite(y) || y < ymin - 10 || y > ymax + 10){
        if(!first) ctx.stroke();
        first = true;
        continue;
      }
      const py = Y(y);
      if(first){
        ctx.beginPath();
        ctx.moveTo(px, py);
        first = false;
      } else {
        ctx.lineTo(px, py);
      }
    }
    if(!first) ctx.stroke();
  }

  function initSwipe(){
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    document.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      startX = t.clientX;
      startY = t.clientY;
    }, {passive:true});

    document.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      endX = t.clientX;
      endY = t.clientY;

      const dx = endX - startX;
      const dy = endY - startY;

      if(Math.abs(dx) < 50) return;
      if(Math.abs(dx) < Math.abs(dy)) return;

      if(dx < 0){
        goNext();
      } else {
        goPrev();
      }
    }, {passive:true});
  }

  toggleTheoryBtn.addEventListener('click', () => theoryText.classList.toggle('open'));
  checkBtn.addEventListener('click', checkCurrentAnswer);
  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);
  toggleExamBtn.addEventListener('click', toggleExamMode);
  newQuizBtn.addEventListener('click', startRound);

  loadStats();
  startRound();
  initSwipe();
};
</script>
