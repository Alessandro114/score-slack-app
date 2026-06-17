const http = require('http');
const https = require('https');
const { URL } = require('url');

const SCORE_API = 'https://score.get-scala.com/api';

function formatRevenue(revenue) {
  if (!revenue) return 'N/A';
  if (revenue >= 1e9) return `€${(revenue / 1e9).toFixed(1)}B`;
  if (revenue >= 1e6) return `€${(revenue / 1e6).toFixed(1)}M`;
  if (revenue >= 1e3) return `€${(revenue / 1e3).toFixed(0)}K`;
  return `€${revenue}`;
}

function scoreBar(score) {
  if (!score) return '—';
  const filled = Math.round(score / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${score}/100`;
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function handleSlashCommand(body) {
  const query = body.text || '';
  if (!query.trim()) {
    return {
      response_type: 'ephemeral',
      text: 'Usage: `/company Ferrero` or `/company IT02727330014`'
    };
  }

  const data = await fetchJSON(`${SCORE_API}/search?q=${encodeURIComponent(query)}&limit=5`);
  const results = data.results || [];

  if (results.length === 0) {
    return { response_type: 'ephemeral', text: `No companies found for "${query}"` };
  }

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `🏢 Results for "${query}"` }
    }
  ];

  for (const co of results) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*${co.name || 'Unknown'}* (${co.country || '?'})`,
          `💰 Revenue: ${formatRevenue(co.revenue)}  |  👥 Employees: ${co.employees || 'N/A'}`,
          `📊 Score: ${scoreBar(co.score)}`,
          co.vat_number ? `🔖 VAT: \`${co.vat_number}\`` : '',
          co.city ? `📍 ${co.city}` : ''
        ].filter(Boolean).join('\n')
      }
    });
    blocks.push({ type: 'divider' });
  }

  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: `Powered by <https://score.get-scala.com|Score API> — 250M+ company records` }]
  });

  return { response_type: 'in_channel', blocks };
}

function parseFormBody(body) {
  const params = {};
  body.split('&').forEach(pair => {
    const [key, val] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(val || '').replace(/\+/g, ' ');
  });
  return params;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/slack/command') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const params = parseFormBody(body);
        const response = await handleSlashCommand(params);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text: `Error: ${err.message}` }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 3006;
server.listen(PORT, () => console.log(`Slack bot listening on port ${PORT}`));
