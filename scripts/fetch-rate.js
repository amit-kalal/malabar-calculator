const https = require('https');
const fs = require('fs');
const path = require('path');

const URL = 'https://www.goodreturns.in/gold-rates/bangalore.html';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function cleanPrice(str) {
  if (!str) return 0;
  // Strip Rupee entities and symbols
  let s = str
    .replace(/&#x20b9;/gi, '')
    .replace(/&#8377;/gi, '')
    .replace(/&[a-z0-9#]+;/gi, '')
    .replace(/₹/g, '')
    .trim();

  // Match 4 to 5 digit Indian price like 11,420 or 7,450
  const match = s.match(/(\d{1,2},\d{3})/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  const digits = s.replace(/[^\d]/g, '');
  const val = parseInt(digits, 10);
  return isNaN(val) ? 0 : val;
}

async function updateRates() {
  try {
    console.log('Fetching Bangalore gold rates from Goodreturns...');
    const html = await fetchPage(URL);

    // Extract 22K price (e.g. id="22K-price">&#x20b9;11,420</span> or ₹11,420)
    let rate22k = 0;
    const match22 = html.match(/id=["']22K-price["'][^>]*>([^<]+)<\/span>/i);
    if (match22 && match22[1]) {
      rate22k = cleanPrice(match22[1]);
    }

    // Extract 24K price
    let rate24k = 0;
    const match24 = html.match(/id=["']24K-price["'][^>]*>([^<]+)<\/span>/i);
    if (match24 && match24[1]) {
      rate24k = cleanPrice(match24[1]);
    }

    // Fallback regex from intro paragraph if id attributes change
    if (!rate22k || rate22k > 50000 || rate22k < 3000) {
      const fallback22 = html.match(/22\s*karat[^<]*?(\d{1,2},\d{3})/i) || html.match(/22\s*carat[^<]*?(\d{1,2},\d{3})/i);
      if (fallback22 && fallback22[1]) {
        rate22k = cleanPrice(fallback22[1]);
      }
    }

    if (!rate24k || rate24k > 50000 || rate24k < 3000) {
      const fallback24 = html.match(/24\s*karat[^<]*?(\d{1,2},\d{3})/i) || html.match(/24\s*carat[^<]*?(\d{1,2},\d{3})/i);
      if (fallback24 && fallback24[1]) {
        rate24k = cleanPrice(fallback24[1]);
      }
    }

    if (!rate22k) {
      throw new Error('Could not parse 22k rate from page HTML');
    }

    if (!rate24k) {
      rate24k = Math.round(rate22k * (24 / 22));
    }

    const rate18k = Math.round(rate22k * (18 / 22));

    const todayDate = new Date().toISOString().split('T')[0];

    const ratesData = {
      city: 'Bangalore, Karnataka',
      rate22k: rate22k,
      rate24k: rate24k,
      rate18k: rate18k,
      date: todayDate,
      source: 'Bangalore Retail Jewellers Market (IBJA Benchmark)',
      lastUpdated: new Date().toISOString()
    };

    const outPath = path.join(__dirname, '..', 'rates.json');
    fs.writeFileSync(outPath, JSON.stringify(ratesData, null, 2), 'utf-8');
    console.log('Successfully updated rates.json:', ratesData);
  } catch (err) {
    console.error('Error fetching rates:', err);
    process.exit(1);
  }
}

updateRates();
