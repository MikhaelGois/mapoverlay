const https = require('https');
const fs = require('fs');
const path = require('path');

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function toTitle(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

(async () => {
  const mgXml = await get('https://mapgenie.io/sitemap.xml');
  const locs = [...mgXml.matchAll(/<loc>(https:\/\/mapgenie\.io\/[^<]+)<\/loc>/g)].map((m) => m[1]);

  const excluded = new Set(['membership', 'account', 'faqs', 'dsar', 'maps']);
  const gameSet = new Map();

  for (const url of locs) {
    const match = url.match(/^https:\/\/mapgenie\.io\/([^\/\?#]+)$/);
    if (!match) continue;
    const slug = match[1];
    if (excluded.has(slug)) continue;

    if (!gameSet.has(slug)) {
      gameSet.set(slug, {
        provider: 'mapgenie',
        slug,
        name: toTitle(slug),
        url: `https://mapgenie.io/${slug}`,
      });
    }
  }

  const tcHtml = await get('https://maps.tcno.co/');
  const tcMatches = [...tcHtml.matchAll(/href="(https:\/\/maps\.tcno\.co\/[a-z0-9-]+)"[^>]*>([^<]{2,})</gi)];
  const tcMap = new Map();

  for (const m of tcMatches) {
    const url = m[1];
    const rawName = m[2].trim().replace(/\s+/g, ' ');
    const slug = url.replace('https://maps.tcno.co/', '').trim();
    if (!slug || ['login', 'signup'].includes(slug)) continue;

    if (!tcMap.has(slug)) {
      tcMap.set(slug, {
        provider: 'tcno',
        slug,
        name: rawName,
        url,
      });
    }
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    mapgenie: [...gameSet.values()].sort((a, b) => a.name.localeCompare(b.name)),
    tcno: [...tcMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };

  const out = path.join(__dirname, '..', 'src', 'shared', 'gameCatalog.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(catalog, null, 2), 'utf8');

  console.log('Generated:', out);
  console.log('MapGenie games:', catalog.mapgenie.length);
  console.log('TCNO games:', catalog.tcno.length);
})();