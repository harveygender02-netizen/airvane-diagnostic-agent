import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Enable CORS for all origins since this is a diagnostic tool
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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
    resultBody: 'You see the whole machine. You\'re less interested in one great email than in a sequence that runs. The challenge is over-engineering before testing. You have the map. Now you need the first campaign live.'
  }
};

function calculateSegment(answers) {
  const counts = {};
  segments.forEach(s => counts[s] = 0);
  Object.keys(answers).forEach(q => {
    const val = answers[q];
    const segment = scoring[q][val];
    if (segment) counts[segment]++;
  });
  return Object.keys(counts).reduce((a, b) => (counts[a] || 0) >= (counts[b] || 0) ? a : b);
}

async function tagSubscriberInKit(email, segment, apiKey) {
  try {
    // Note: This matches the Cloudflare Worker logic for tagging
    await axios.post('https://api.kit.com/v4/subscribers', {
      email_address: email,
      fields: { diagnostic_segment: segment }
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('Error tagging subscriber:', err.response?.data || err.message);
  }
}

app.get(['/', '/web'], (req, res) => {
  const htmlPath = path.join(__dirname, 'diagnostic.html');
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.status(404).send('Diagnostic page (diagnostic.html) not found in repository root.');
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'airvane-diagnostic' });
});

app.post('/webhook', async (req, res) => {
  const { email, q1, q2, q3, q4, q5 } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const segment = calculateSegment({ q1, q2, q3, q4, q5 });
    const result = resultMap[segment];
    const apiKey = process.env.KIT_API_KEY || KIT_API_KEY_DEFAULT;

    await tagSubscriberInKit(email, segment, apiKey);

    res.json({
      segment,
      resultHeadline: result.resultHeadline,
      resultBody: result.resultBody
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Airvane Diagnostic Agent running on port ${PORT}`);
});
