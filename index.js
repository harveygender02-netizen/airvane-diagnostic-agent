// Cloudflare Worker - Native fetch API (no Express/axios/dotenv)

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

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const KIT_API_KEY = env.KIT_API_KEY || KIT_API_KEY_DEFAULT;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }

    if (url.pathname === '/webhook' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { email, q1, q2, q3, q4, q5 } = body;
        if (!email) {
          return new Response(JSON.stringify({ error: 'Email required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders() }
          });
        }
        const answers = { q1, q2, q3, q4, q5 };
        const segment = calculateSegment(answers);
        const result = resultMap[segment];
        tagSubscriberInKit(email, segment, KIT_API_KEY);
        return new Response(JSON.stringify({
          segment,
          resultHeadline: result.resultHeadline,
          resultBody: result.resultBody
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Internal error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders() });
  }
};
