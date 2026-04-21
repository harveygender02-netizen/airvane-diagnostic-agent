const KIT_API_KEY_DEFAULT = 'h-rN1A2tqzq2zgTOD7J7HQ';

const scoring = {
  q1: { 0: 'research', 1: 'strategy-voice', 2: 'drift', 3: 'attention', 4: 'new-tab' },
  q2: { 0: 'research', 1: 'strategy-voice', 2: 'drift', 3: 'attention', 4: 'new-tab' },
  q3: { 0: 'research', 1: 'strategy-voice', 2: 'drift', 3: 'attention', 4: 'new-tab' },
  q4: { 0: 'research', 1: 'strategy-voice', 2: 'drift', 3: 'attention', 4: 'new-tab' },
  q5: { 0: 'research', 1: 'strategy-voice', 2: 'drift', 3: 'attention', 4: 'new-tab' }
};

const segments = ['research', 'strategy-voice', 'drift', 'attention', 'new-tab'];

const resultMap = {
  'research': {
    resultHeadline: 'The Researcher',
    resultBody: 'You write from evidence. Your instinct is to understand before you speak — which makes your emails precise, credible, and trust-building. The gap is usually warmth. You know what to say. You\'re still finding how.'
  },
  'strategy-voice': {
    resultHeadline: 'The Voice Strategist',
    resultBody: 'You think in tone. There\'s something distinctive about how you write when you\'re in it — a register that\'s yours. The challenge is consistency and structure. The voice is there. The system isn\'t yet.'
  },
  'drift': {
    resultHeadline: 'The Drifter',
    resultBody: 'Your emails are honest, sometimes raw, often unexpected. People feel something reading them. The issue is follow-through — you write well when you write, but your list doesn\'t hear from you enough to trust the pattern.'
  },
  'attention': {
    resultHeadline: 'The Attention Engineer',
    resultBody: 'You understand hooks. Subject lines, openings, re-engagement — you think about what makes someone stop. What you\'re building toward is depth: the email that earns attention and then does something with it.'
  },
  'new-tab': {
    resultHeadline: 'The Systems Thinker',
    resultBody: 'You see the whole machine. You\'re less interested in one great email than in a sequence that runs. The risk is over-engineering before testing. You have the map. Now you need the first campaign live.'
  }
};

const corsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

function calculateSegment(answers) {
  const tally = {};
  segments.forEach(s => tally[s] = 0);
  ['q1', 'q2', 'q3', 'q4', 'q5'].forEach(q => {
    const idx = answers[q];
    if (idx !== undefined && scoring[q][idx]) {
      tally[scoring[q][idx]]++;
    }
  });
  return Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
}

async function tagSubscriberInKit(email, segment, apiKey) {
  try {
    const tagName = `airvane-diagnostic-${segment}`;
    const tagsRes = await fetch(`https://api.convertkit.com/v3/tags?api_key=${apiKey}`);
    const tagsData = await tagsRes.json();
    let tag = tagsData.tags.find(t => t.name === tagName);
    if (!tag) {
      const createRes = await fetch('https://api.convertkit.com/v3/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, tag: { name: tagName } })
      });
      const createData = await createRes.json();
      tag = createData.tag;
    }
    await fetch(`https://api.convertkit.com/v3/tags/${tag.id}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, email })
    });
  } catch (err) {
    console.error('Kit tagging error:', err.message);
  }
}

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stop Restarting — The Diagnostic | Airvane Sys</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-bg: #f2f0ea;
      --color-surface: #f7f5f0;
      --color-surface-2: #faf9f6;
      --color-border: #ddd9d2;
      --color-divider: #e5e2db;
      --color-text: #1e1c17;
      --color-text-muted: #6b6960;
      --color-text-faint: #a8a69f;
      --color-accent: #3d6b5e;
      --color-accent-hover: #2d5045;
      --color-accent-highlight: #d4e4e0;
      --font-display: 'Playfair Display', Georgia, serif;
      --font-body: 'DM Sans', 'Helvetica Neue', sans-serif;
      --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
      --text-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
      --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
      --text-lg: clamp(1.125rem, 1rem + 0.75vw, 1.5rem);
      --text-xl: clamp(1.5rem, 1.2rem + 1.25vw, 2.25rem);
      --text-2xl: clamp(2rem, 1.2rem + 2.5vw, 3.25rem);
      --space-2: 0.5rem;
      --space-3: 0.75rem;
      --space-4: 1rem;
      --space-5: 1.25rem;
      --space-6: 1.5rem;
      --space-8: 2rem;
      --radius-md: 0.5rem;
      --radius-lg: 0.75rem;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-body); background: var(--color-bg); color: var(--color-text); line-height: 1.6; min-height: 100vh; display: flex; flex-direction: column; }
    nav { padding: 1.5rem; border-bottom: 1px solid var(--color-divider); text-align: center; }
    .nav-brand { font-family: var(--font-display); font-size: 1.1rem; text-decoration: none; color: inherit; }
    .progress-bar-wrap { background: var(--color-divider); height: 2px; }
    .progress-bar { height: 2px; background: var(--color-accent); width: 0%; transition: width 0.4s; }
    main { max-width: 600px; margin: 0 auto; padding: 3rem 1.5rem; flex: 1; width: 100%; }
    .screen { display: none; }
    .screen.active { display: block; }
    .intro-headline { font-family: var(--font-display); font-size: 2.2rem; line-height: 1.2; margin-bottom: 1.5rem; }
    .email-input { width: 100%; padding: 0.8rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: 1rem; font-size: 1rem; }
    .btn-primary { width: 100%; padding: 1rem; background: var(--color-accent); color: white; border-radius: var(--radius-md); cursor: pointer; border: none; font-weight: 500; font-size: 1rem; }
    .options-list { list-style: none; padding: 0; margin: 2rem 0; display: flex; flex-direction: column; gap: 0.75rem; }
    .option-btn { width: 100%; text-align: left; padding: 1.2rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); cursor: pointer; transition: 0.2s; font-size: 0.95rem; }
    .option-btn.selected { background: var(--color-accent-highlight); border-color: var(--color-accent); }
    .nav-btns { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; }
    .btn-back { cursor: pointer; text-decoration: underline; color: var(--color-text-faint); font-size: 0.9rem; border: none; background: none; }
  </style>
</head>
<body>
  <nav><a href="/" class="nav-brand">Airvane Sys</a></nav>
  <div class="progress-bar-wrap"><div id="progressBar" class="progress-bar"></div></div>
  <main>
    <div id="screen-intro" class="screen active">
      <h1 class="intro-headline">The Stop Restarting Diagnostic</h1>
      <div id="optInContainer">
        <p style="margin-bottom:1rem">Enter your email to begin the diagnostic.</p>
        <input type="email" id="emailInput" class="email-input" placeholder="you@gmail.com">
      </div>
      <button class="btn-primary" onclick="startDiagnostic()">Begin the Diagnostic →</button>
    </div>
    <div id="screen-questions" class="screen">
      <div id="questionCounter" style="font-size:0.8rem; color:var(--color-text-faint); margin-bottom:1rem; text-transform:uppercase; letter-spacing:0.05em"></div>
      <div id="questionText" class="intro-headline" style="font-size:1.5rem"></div>
      <ul id="optionsList" class="options-list"></ul>
      <div class="nav-btns">
        <button id="backBtn" class="btn-back" onclick="goBack()">← Back</button>
        <button id="nextBtn" class="btn-primary" style="width:auto; padding: 0.8rem 2rem" onclick="goNext()">Continue →</button>
      </div>
    </div>
    <div id="screen-loading" class="screen" style="text-align:center; padding: 4rem 0">
      <p style="font-family:var(--font-display); font-size:1.5rem; font-style:italic">Reading the pattern...</p>
    </div>
    <div id="screen-result" class="screen">
      <h2 id="resultHeadline" class="intro-headline"></h2>
      <p id="resultBody" style="font-size:1.2rem; font-style:italic; color:var(--color-text-muted); font-family:var(--font-display)"></p>
      <div style="margin-top:3rem; padding-top:2rem; border-top: 1px solid var(--color-divider); font-size:0.9rem; color:var(--color-text-faint)">
        <p>The first email in your sequence is on its way. It will name the exact moment the disguise fires.</p>
      </div>
    </div>
  </main>
  <script>
    const AGENT_ENDPOINT = "/webhook";
    const questions = [
      { text: "Before you fully registered that the energy had changed, something was already happening. What was it?", options: ["More information needed researching before the next step made sense.", "One external thing had to be in place first.", "The direction felt right — but not certain enough yet.", "Nothing I could name. I was just suddenly less present."] },
      { text: "As you were working on it, you already noticed something shift. Which sentence arrived first?", options: ["Someone else has already done this better.", "One more thing needs to be right before this is ready.", "The direction isn't wrong — it just needs adjusting.", "I didn't hear a sentence. It was quieter than that."] },
      { text: "When it ended, it didn't announce itself. Which of these is closest to what you felt?", options: ["Clarity. Something that had been slightly off finally had a name.", "Relief. A quiet pressure lifted without me fully noticing.", "Nothing at first. The realisation came later.", "I didn't feel it end. I just noticed I was somewhere else."] },
      { text: "In the hours just before it went quiet, where was most of your attention?", options: ["On the edges. Naming, formatting, adjusting things that weren't the core.", "On other people's work. Reading, watching, researching.", "On the same piece of work, repeatedly. Making it better before showing no one.", "On something new. A different idea had opened a tab."] },
      { text: "You already know what you're about to do next. Which part of that is true?", options: ["I'm going to try again. And by day three, I already know what happens.", "I'm going to try again. And this time I want to see the moment it fires.", "I'm going to try again. And I need something that works in that window.", "I'm going to try again. I don't know if I believe it will be different."] }
    ];
    let currentQ = 0, answers = [], subscriberEmail = "";
    (function init() {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email");
      if (emailParam) {
        subscriberEmail = emailParam;
        document.getElementById("optInContainer").style.display = "none";
      }
    })();
    function setProgress(pct) { document.getElementById("progressBar").style.width = pct + "%"; }
    function showScreen(id) { document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id)); }
    function startDiagnostic() {
      if (!subscriberEmail) {
        const email = document.getElementById("emailInput").value.trim();
        if (!email.includes("@")) return alert("Valid email required");
        subscriberEmail = email;
      }
      currentQ = 0; answers = []; renderQuestion(); showScreen("screen-questions"); setProgress(10);
    }
    function renderQuestion() {
      const q = questions[currentQ];
      document.getElementById("questionCounter").textContent = "Question " + (currentQ + 1) + " of " + questions.length;
      document.getElementById("questionText").textContent = q.text;
      const list = document.getElementById("optionsList");
      list.innerHTML = "";
      q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "option-btn" + (answers[currentQ] === i ? " selected" : "");
        btn.textContent = opt;
        btn.onclick = () => {
          answers[currentQ] = i;
          document.querySelectorAll(".option-btn").forEach((b, idx) => b.classList.toggle("selected", idx === i));
          document.getElementById("nextBtn").disabled = false;
        };
        const li = document.createElement("li"); li.appendChild(btn); list.appendChild(li);
      });
      document.getElementById("nextBtn").disabled = answers[currentQ] === undefined;
      document.getElementById("backBtn").style.visibility = currentQ === 0 ? "hidden" : "visible";
    }
    function goNext() {
      if (currentQ < questions.length - 1) {
        currentQ++; renderQuestion(); setProgress(10 + (currentQ / questions.length) * 80);
      } else { submitDiagnostic(); }
    }
    function goBack() {
      if (currentQ > 0) {
        currentQ--; renderQuestion(); setProgress(10 + (currentQ / questions.length) * 80);
      }
    }
    async function submitDiagnostic() {
      showScreen("screen-loading"); setProgress(95);
      try {
        const res = await fetch(AGENT_ENDPOINT, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: subscriberEmail, q1: answers[0], q2: answers[1], q3: answers[2], q4: answers[3], q5: answers[4] })
        });
        const data = await res.json();
        document.getElementById("resultHeadline").textContent = data.resultHeadline;
        document.getElementById("resultBody").textContent = data.resultBody;
        showScreen("screen-result");
      } catch (err) {
        document.getElementById("resultHeadline").textContent = "Your loop has a shape.";
        document.getElementById("resultBody").textContent = "The email sequence will name it precisely.";
        showScreen("screen-result");
      }
      setProgress(100);
    }
  </script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const KIT_API_KEY = env.KIT_API_KEY || KIT_API_KEY_DEFAULT;

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });

    if (url.pathname === '/web' || url.pathname === '/') {
      return new Response(HTML_CONTENT, { headers: { 'Content-Type': 'text/html' } });
    }

    if (url.pathname === '/health') return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });

    if (url.pathname === '/webhook' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { email, q1, q2, q3, q4, q5 } = body;
        if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400, headers: corsHeaders() });
        const segment = calculateSegment({ q1, q2, q3, q4, q5 });
        const result = resultMap[segment];
        await tagSubscriberInKit(email, segment, KIT_API_KEY);
        return new Response(JSON.stringify({ segment, resultHeadline: result.resultHeadline, resultBody: result.resultBody }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders() });
      }
    }
    return new Response('Not found', { status: 404, headers: corsHeaders() });
  }
};
