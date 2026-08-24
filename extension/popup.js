const API_URL = 'https://threatlens-95ww.onrender.com/api/analyze';
const WEB_APP_URL = 'http://localhost:3000/report';

let currentTabUrl = '';
let currentTabTitle = '';

let currentAnalysisId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const urlDisplay = document.getElementById('url-display');
  const analyzeBtn = document.getElementById('analyze-btn');
  const viewReportBtn = document.getElementById('view-report-btn');
  const retryBtn = document.getElementById('retry-btn');
  
  // Get current tab
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      currentTabUrl = tabs[0].url || '';
      currentTabTitle = tabs[0].title || '';
      
      if (!currentTabUrl || currentTabUrl.startsWith('chrome://') || currentTabUrl.startsWith('edge://')) {
        urlDisplay.textContent = 'Unsupported or browser internal page.';
        analyzeBtn.disabled = true;
        analyzeBtn.style.opacity = 0.5;
        analyzeBtn.style.cursor = 'not-allowed';
      } else {
        urlDisplay.textContent = currentTabUrl;
      }
    }
  } catch (err) {
    urlDisplay.textContent = 'Could not retrieve tab URL.';
    analyzeBtn.disabled = true;
  }

  analyzeBtn.addEventListener('click', analyzeUrl);
  retryBtn.addEventListener('click', () => {
    document.getElementById('error-section').classList.add('hidden');
    document.getElementById('action-section').classList.remove('hidden');
  });
  
  viewReportBtn.addEventListener('click', () => {
    // Open ThreatLens dashboard report page with the specific analysis ID
    const urlToOpen = currentAnalysisId ? `${WEB_APP_URL}?id=${currentAnalysisId}` : WEB_APP_URL;
    chrome.tabs.create({ url: urlToOpen });
  });
});

async function analyzeUrl() {
  if (!currentTabUrl) return;

  // UI state
  document.getElementById('action-section').classList.add('hidden');
  document.getElementById('loading').classList.remove('hidden');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: currentTabUrl, source: 'EXTENSION' })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Server error: ${response.status}`);
    }

    const data = await response.json();
    // Capture the analysis_id so View Full Report can link to the specific analysis
    if (data.analysis_id) {
      currentAnalysisId = data.analysis_id;
    }
    displayResults(data);
  } catch (error) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error-section').classList.remove('hidden');
    
    let errorMsg = error.message;
    if (errorMsg.includes('Failed to fetch')) {
      errorMsg = 'Cannot connect to ThreatLens backend. Is it running?';
    }
    document.getElementById('error-msg').textContent = errorMsg;
  }
}

function displayResults(data) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('result-section').classList.remove('hidden');

  // Update Score
  const scoreEl = document.getElementById('risk-score');
  const badgeEl = document.getElementById('risk-badge');
  
  scoreEl.textContent = data.risk.score;
  scoreEl.className = `score risk-${data.risk.level}`;
  
  badgeEl.textContent = `${data.risk.level} RISK`;
  badgeEl.className = `risk-badge risk-${data.risk.level}`;

  // Update Banners
  if (['HIGH', 'CRITICAL'].includes(data.risk.level)) {
    document.getElementById('warning-banner').classList.remove('hidden');
  } else if (data.risk.level === 'LOW') {
    document.getElementById('safe-banner').classList.remove('hidden');
  }

  // Update Findings
  const findingsList = document.getElementById('findings-list');
  findingsList.innerHTML = '';
  
  let keyFindings = [];
  
  // Collect reasons from triggered rules
  if (data.risk.triggered_rules && data.risk.triggered_rules.length > 0) {
    keyFindings = data.risk.triggered_rules.map(r => r.rule_name.replace(/_/g, ' '));
  } else {
    keyFindings = data.reasons || [];
  }

  if (keyFindings.length === 0) {
    keyFindings = ['No major security threats found.'];
  }

  // Display top 3 findings
  keyFindings.slice(0, 3).forEach(finding => {
    const li = document.createElement('li');
    li.textContent = `• ${finding}`;
    findingsList.appendChild(li);
  });
}
