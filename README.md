# ThreatLens

ThreatLens is a comprehensive web-based URL security and threat analysis platform. It actively investigates submitted URLs and produces detailed security reports to help users identify potentially malicious links, phishing attempts, and brand impersonation before they click.

## 🚀 Live Demo

**Frontend:** https://threat-lens-sepia.vercel.app

**Backend API:** https://threatlens-95ww.onrender.com

## 1. Project Overview

**The Problem:** Malicious actors continuously deploy phishing pages, typosquatted domains, and obfuscated URLs to steal credentials and distribute malware. Standard users often lack the tools to verify a link's safety beyond basic visual inspection.
**The Solution:** ThreatLens provides a unified analysis engine that inspects a URL from multiple angles—combining static heuristic analysis (e.g., suspicious keywords, unusual formats) with active network reconnaissance (DNS resolution, TLS verification, HTTP behavior, and redirect tracking).

## 2. Main Features

- **Comprehensive URL/Domain Analysis:** Breaks down URLs to analyze protocols, hostnames, and paths.
- **DNS Resolution & IP Discovery:** Actively resolves hostnames to their IPv4/IPv6 addresses.
- **HTTP/HTTPS Response Analysis:** Inspects status codes, reachability, and critical HTTP response headers.
- **Redirect-Chain Tracking:** Follows URL hops to detect hidden malicious destinations.
- **TLS/SSL Certificate Analysis:** Validates certificates, checks expiration, and extracts Subject CN and Issuer details.
- **Strict TLS Hostname Matching:** Verifies that the certificate validly covers the requested hostname using SAN/CN matching.
- **Heuristic Security Signals:** Evaluates static URL properties for signs of obfuscation or malicious intent.
- **Brand Impersonation & Typosquatting:** Calculates Levenshtein distance against known high-value targets (e.g., Google, Microsoft).
- **PostgreSQL-Based Risk Rules:** A data-driven risk engine that calculates scores based on active rules stored in a database.
- **Risk Scoring (0–100):** Aggregates triggered rules into a clear numerical score and severity level (Low, Medium, High, Critical).
- **Interactive Dashboards:** Features a main Dashboard, a dedicated Technical Analysis page, and a Full Security Report.
- **Browser Extension:** A companion extension for 1-click analysis of the current active tab.

## 3. Risk Detection Examples

ThreatLens triggers specific database-backed risk rules when suspicious signals are detected. Multiple signals can compound to elevate the final risk score. Examples include:

- **Raw IP Hostname:** Bypassing standard DNS to connect directly via IP (e.g., `http://192.168.1.10`).
- **Suspicious/Phishing Keywords:** Presence of target words like "login", "secure", "verify", or "auth" in the URL path.
- **Non-Standard Ports:** Using ports other than 80 or 443.
- **Encoded/Percent Obfuscation:** Masking URLs using excessive URL encoding to hide malicious payloads.
- **Deep Subdomains:** Using many subdomain levels to spoof trusted domains (e.g., `login.auth.secure.example.com`).
- **Typosquatting:** Domain names intentionally misspelled to mimic major brands (e.g., `g00gle.com`).

## 4. Architecture & Workflow

ThreatLens operates on a decoupled client-server architecture:

```
[User / Browser Extension] 
       ↓ (Submits URL)
[React Frontend] 
       ↓ (POST /api/analyze)
[FastAPI Backend API] 
       ↓
[Analysis Modules (DNS, HTTP, TLS, Redirects, Typosquat)]
       ↓
[PostgreSQL Risk Engine (Calculates Score based on Rules)]
       ↓
[Generated Security Report returned to Frontend]
```

The backend performs the actual heavy lifting—executing the live DNS, HTTP, redirect, and TLS network requests—preventing CORS issues and ensuring a consistent analytical environment.

## 5. Technical Stack

**Frontend:**
- React 18 & Vite
- Tailwind CSS (Styling)
- Lucide React (Icons)
- React Router (Routing)
- Recharts (Data visualization)

**Backend:**
- Python 3.10+
- FastAPI & Uvicorn (High-performance API)
- Pydantic (Data validation)
- SQLAlchemy (ORM) & Psycopg2 (Database driver)

**Database & Deployment:**
- PostgreSQL (Render)
- Frontend Hosting: Vercel
- Backend Hosting: Render

## 6. Project Structure

```text
ThreatLens/
├── backend/                  # Python FastAPI Backend
│   ├── main.py               # API endpoints & caching logic
│   ├── analyzer.py           # Core analysis pipeline orchestrator
│   ├── dns_analyzer.py       # Socket-based DNS resolution
│   ├── http_analyzer.py      # HTTP request and header inspection
│   ├── tls_analyzer.py       # SSL/TLS handshake & cert validation
│   ├── redirect_analyzer.py  # Redirect chain tracking
│   ├── risk_engine.py        # Rule evaluation & scoring
│   ├── schema.py             # DB Schema (analyses, history)
│   ├── risk_rules_schema.py  # DB Schema (dynamic risk rules)
│   └── requirements.txt      # Python dependencies
├── src/                      # React Frontend
│   ├── App.jsx               # Application shell & routes
│   ├── context/              # Global state (AnalysisContext)
│   ├── pages/                # UI Views (ReportPage, TechnicalPage, etc.)
│   └── index.css             # Tailwind configuration
├── extension/                # Chrome/Edge Browser Extension
│   ├── manifest.json         # Manifest V3 configuration
│   └── popup.js              # Extension logic & API integration
├── vercel.json               # Vercel deployment configuration
└── package.json              # Node dependencies & Vite scripts
```

## 7. Deployment Configuration

The current production environment is configured as follows:
- **Frontend:** Deployed to Vercel. SPA routing is handled via `vercel.json` rewrites.
- **Backend:** Deployed to Render.
- **Database:** Render PostgreSQL.
- **CORS/Environment:** The frontend communicates with the backend via a configurable `VITE_API_URL`, supporting seamless transitions between localhost and production.

## 8. Testing & Verification

The deployed pipeline has been thoroughly verified for accuracy across edge cases:
- **DNS Resolution:** Successfully resolves and deduplicates IPv4/IPv6 addresses.
- **HTTP Verification:** Correctly detects HTTP 200 reachable states, response headers, and Server signatures.
- **TLS Details:** Accurately extracts Subject CN, Issuer, and validity dates directly from the raw SSL socket.
- **TLS Hostname Matching:** Correctly handles wildcard matches (e.g., `*.example.com` matching `sub.example.com`).
- **Risk Scoring:** PostgreSQL-backed risk rules are evaluated and accumulated into the final risk score.
- **Deep Linking:** Full reports load correctly when shared or opened in a new browser tab via `?id=` query parameters.

## 9. Example Tests

You can safely test the analysis engine with the following URLs:

1. `https://www.google.com` → **Expected:** Clean/Low Risk. Verifies that DNS resolves, HTTP 200 is captured, and TLS certificates match perfectly without triggering false positives.
2. `https://example.com` → **Expected:** Clean/Low Risk. Validates standard domain handling and redirect tracking.
3. `http://192.168.1.10/login` → **Expected:** Medium Risk. Demonstrates the detection of a raw-IP hostname combined with a suspicious keyword ("login") in an unencrypted (HTTP) context. *(Note: This private IP is not expected to be reachable from the deployed server; it is specifically used to verify that the static heuristic risk engine correctly flags suspicious patterns before network failure.)*

## 10. Setup and Usage

### Prerequisites
- Node.js & npm
- Python 3.10+
- PostgreSQL (Optional for local, required for full DB functionality)

### Running the Backend Locally
```bash
# Navigate to project root
cd ThreatLens

# Install Python dependencies
pip install -r backend/requirements.txt

# Start the FastAPI server
uvicorn backend.main:app --reload --port 8000
```
The backend API will be available at `http://localhost:8000`.

### Running the Frontend Locally
```bash
# Open a new terminal in the project root
npm install

# Start the Vite development server
npm run dev
```
The frontend UI will be available at `http://localhost:3000`.

### Building for Production
```bash
npm run build
```

## 11. Browser Extension

ThreatLens includes a Manifest V3 browser extension (`/extension`) that integrates directly with the production API.
- **Workflow:** Clicking the extension in your browser captures the current active tab's URL and submits a `POST` request to the backend.
- **Handoff:** Upon receiving an `analysis_id`, the extension securely opens a new tab directed to the ThreatLens web application (`/report?id=...`), seamlessly handing off the user to the full, interactive security report.

## 12. Why It's Technically Interesting

ThreatLens features several advanced implementation details that ensure stability and performance:

- **State Hydration via Caching:** When the browser extension opens the web application in a new tab, the React SPA must load the report by its ID. Because the PostgreSQL history table stores only a lightweight summary, the FastAPI backend implements an **in-memory rich cache**. This allows the newly opened tab to fetch the full, high-fidelity analysis (including raw HTTP headers and TLS certificates) instantly, while older historical scans gracefully degrade to a skeletal database-backed view.
- **Modern TLS Hostname Verification:** The backend performs active TLS handshakes and implements its own hostname-matching logic using certificate SAN/CN values and wildcard matching, providing reliable hostname verification across modern Python runtimes.