const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Scoring map per question
const scoring = {
  q1: { a: 'research', b: 'strategy-voice', c: 'drift', d: 'attention', e: 'new-tab' },
  q2: { a: 'research', b: 'strategy-voice', c: 'drift', d: 'attention', e: 'new-tab' },
  q3: { a: 'research', b: 'strategy-voice', c: 'drift', d: 'attention', e: 'new-tab' },
  q4: { a: 'research', b: 'strategy-voice', c: 'drift', d: 'attention', e: 'new-tab' },
  q5: { a: 'research', b: 'strategy-voice', c: 'drift', d: 'attention', e: 'new-tab' },
};

const segments = ['research', 'strategy-voice', 'drift', 'attention', 'new-tab'];

function calculateSegment(answers) {
  const tally = {};
  segments.forEach(s => tally[s] = 0);

  ['q1', 'q2', 'q3', 'q4', 'q5'].forEach(q => {
    const ans = answers[q];
    if (ans && scoring[q][ans]) {
      tally[scoring[q][ans]]++;
    }
  });

  let maxScore = 0;
  let winners = [];
  segments.forEach(s => {
    if (tally[s] > maxScore) { maxScore = tally[s]; winners = [s]; }
    else if (tally[s] === maxScore) { winners.push(s); }
  });

  // Tie-breaker: use Q2 answer
  if (winners.length > 1) {
    const q2segment = scoring.q2[answers.q2];
    if (q2segment && winners.includes(q2segment)) {
      return q2segment;
    }
  }

  return winners[0];
}

app.post('/webhook', async (req, res) => {
  try {
    const { email, q1, q2, q3, q4, q5 } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const answers = { q1, q2, q3, q4, q5 };
    const segment = calculateSegment(answers);
    const tag = `segment-${segment}`;

    const KIT_API_KEY = process.env.KIT_API_KEY;

    // Tag subscriber in Kit.com
    await axios.post(
      'https://api.kit.com/v4/tags',
      { name: tag },
      { headers: { 'X-Kit-Api-Key': KIT_API_KEY, 'Content-Type': 'application/json' } }
    ).catch(() => {}); // tag may already exist

    // Find or create subscriber and apply tag
    const subRes = await axios.post(
      'https://api.kit.com/v4/subscribers',
      { email_address: email },
      { headers: { 'X-Kit-Api-Key': KIT_API_KEY, 'Content-Type': 'application/json' } }
    );

    const subscriberId = subRes.data?.subscriber?.id;

    if (subscriberId) {
      // Get tag id
      const tagsRes = await axios.get(
        'https://api.kit.com/v4/tags',
        { headers: { 'X-Kit-Api-Key': KIT_API_KEY } }
      );
      const tagObj = tagsRes.data?.tags?.find(t => t.name === tag);
      if (tagObj) {
        await axios.post(
          `https://api.kit.com/v4/tags/${tagObj.id}/subscribers`,
          { subscriber_id: subscriberId },
          { headers: { 'X-Kit-Api-Key': KIT_API_KEY, 'Content-Type': 'application/json' } }
        );
      }
    }

    res.json({ segment, tag });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Airvane diagnostic agent running on port ${PORT}`));
