const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const KIT_API_KEY = process.env.KIT_API_KEY || 'h-rN1A2tqzq2zgTOD7J7HQ';

// Scoring map: answer index (0=a, 1=b, 2=c, 3=d, 4=e) -> segment
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

async function tagSubscriberInKit(email, segment) {
  try {
    // Add/update subscriber in Kit with segment tag
    const tagName = `airvane-diagnostic-${segment}`;
    // First find or create the tag
    const tagsRes = await axios.get('https://api.convertkit.com/v3/tags', {
      params: { api_key: KIT_API_KEY }
    });
    let tag = tagsRes.data.tags.find(t => t.name === tagName);
    if (!tag) {
      const createTag = await axios.post('https://api.convertkit.com/v3/tags', {
        api_key: KIT_API_KEY,
        tag: { name: tagName }
      });
      tag = createTag.data.tag;
    }
    // Tag the subscriber
    await axios.post(`https://api.convertkit.com/v3/tags/${tag.id}/subscribe`, {
      api_key: KIT_API_KEY,
      email: email
    });
    console.log(`Tagged ${email} as ${tagName}`);
  } catch (err) {
    console.error('Kit tagging error:', err.message);
  }
}

app.post('/webhook', async (req, res) => {
  try {
    const { email, q1, q2, q3, q4, q5 } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const answers = { q1, q2, q3, q4, q5 };
    const segment = calculateSegment(answers);
    const result = resultMap[segment];

    // Tag in Kit asynchronously (don't block response)
    tagSubscriberInKit(email, segment);

    res.json({
      segment,
      resultHeadline: result.resultHeadline,
      resultBody: result.resultBody
    });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Airvane agent running on port ${PORT}`));
