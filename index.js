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
    resultBody: "You write from evidence. Your instinct is to understand before you speak — which makes your emails precise, credible, and trust-building. The gap is usually warmth. You know what to say. You're still finding how."
  },
  'strategy-voice': {
    resultHeadline: 'The Voice Strategist',
    resultBody: "You think in tone. There's something distinctive about how you write when you're in it — a register that's yours. The challenge is consistency and structure. The voice is there. The system isn't yet."
  },
  'drift': {
    resultHeadline: 'The Drifter',
    resultBody: "Your emails are honest, sometimes raw, often unexpected. People feel something reading them. The issue is follow-through — you write well when you write, but your list doesn't hear from you enough to trust the pattern."
  },
  'attention': {
    resultHeadline: 'The Attention Engineer',
    resultBody: "You understand hooks. Subject lines, openings, re-engagement — you think about what makes someone stop. What you're building toward is depth: the email that earns attention and then does something with it."
  },
  'new-tab': {
    resultHeadline: 'The Systems Thinker',
    resultBody: "You see the whole machine. You're less interested in one great email than in a sequence that runs. The challenge is over-engineering before testing. You have the map. Now you need the first campaign live."
  }
};

function calculateSegment(answers) {
  const counts = {};
  segments.forEach(s => counts[s] = 0);
  Object.keys(answers).forEach(q => {
    const val = answers[q];
    const segment = scoring[q] && scoring[q][val];
    if (segment) counts[segment]++;
  });
  return Object.keys(counts).reduce((a, b) => (counts[a] || 0) >= (counts[b] || 0) ? a : b);
}

async function tagSubscriberInKit(email, segment, apiKey) {
  try {
    await fetch('https://api.kit.com/v4/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: email,
        fields: { diagnostic_segment: segment }
      })
    });
  } catch (err) {
    console.error('Kit tag error:', err.message);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (request.method === 'POST' && url.pathname === '/webhook') {
      try {
        const body = await request.json();
        const { email, q1, q2, q3, q4, q5 } = body;

        if (!email) {
          return new Response(JSON.stringify({ error: 'Email required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const segment = calculateSegment({ q1, q2, q3, q4, q5 });
        const result = resultMap[segment];
        const apiKey = env.KIT_API_KEY || KIT_API_KEY_DEFAULT;

        await tagSubscriberInKit(email, segment, apiKey);

        return new Response(JSON.stringify({
          segment,
          resultHeadline: result.resultHeadline,
          resultBody: result.resultBody
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};
