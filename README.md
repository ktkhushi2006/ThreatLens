## ThreatLens

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

```text
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

The backend performs the actual analysis—executing the live DNS, HTTP, redirect, and TLS network requests—providing a consistent analytical environment.

## 5. Technical Stack

**Frontend:**
- React 18 & Vite
- Tailwind CSS
- Lucide React
- React Router
- Recharts

**Backend:**
- Python 3.10+
- FastAPI & Uvicorn
- Pydantic
- SQLAlchemy
- Psycopg2

**Database & Deployment:**
- PostgreSQL (Render)
- Frontend Hosting: Vercel
- Backend Hosting: Render

## 6. Project Structure

```text
ThreatLens/
├── backend/                  # Python FastAPI Backend
│   ├── main.py              # API endpoints & caching logic
│   ├── analyzer.py          # Core analysis pipeline orchestrator
│   ├── dns_analyzer.py      # DNS resolution
│   ├── http_analyzer.py     # HTTP request and header inspection
│   ├── tls_analyzer.py      # SSL/TLS handshake & certificate validation
│   ├── redirect_analyzer.py # Redirect chain tracking
│   ├── risk_engine.py       # Rule evaluation & scoring
│   ├── schema.py            # Database schema
│   ├── risk_rules_schema.py # Dynamic risk rules schema
│   └── requirements.txt     # Python dependencies
├── src/                     # React Frontend
│   ├── App.jsx              # Application shell & routes
│   ├── context/             # Global state
│   ├── pages/               # UI views
│   └── index.css            # Global styling
├── extension/               # Chrome/Edge Browser Extension
│   ├── manifest.json        # Manifest V3 configuration
│   └── popup.js             # Extension logic & API integration
├── vercel.json              # Vercel deployment configuration
└── package.json             # Node dependencies & Vite scripts
```

## 7. Deployment Configuration

The current production environment is configured as follows:

- **Frontend:** Deployed to Vercel. SPA routing is handled via `vercel.json` rewrites.
- **Backend:** Deployed to Render.
- **Database:** Render PostgreSQL.
- **CORS/Environment:** The frontend communicates with the backend via a configurable `VITE_API_URL`, supporting seamless transitions between localhost and production.

## 8. Testing & Verification

The deployed pipeline has been verified across multiple scenarios:

- **DNS Resolution:** Successfully resolves and displays IPv4/IPv6 addresses.
- **HTTP Verification:** Correctly detects reachable HTTP responses, status codes, response headers, and Server signatures.
- **TLS Details:** Extracts Subject CN, Issuer, and certificate validity dates.
- **TLS Hostname Matching:** Correctly handles certificate SAN/CN matching and wildcard certificates.
- **Risk Scoring:** PostgreSQL-backed risk rules are evaluated and accumulated into the final risk score.
- **Deep Linking:** Full reports load correctly when opened in a new browser tab using `?id=` query parameters.
- **Browser Extension:** Successfully sends the active URL to the production backend and opens the corresponding report.

## 9. Example Tests

You can safely test the analysis engine with the following URLs:

1. `https://www.google.com` → **Expected:** Clean/Low Risk. Verifies DNS resolution, HTTP analysis, and TLS certificate matching.
2. `https://example.com` → **Expected:** Clean/Low Risk. Validates standard domain handling and redirect tracking.
3. `http://192.168.1.10/login` → **Expected:** Medium Risk. Demonstrates detection of a raw-IP hostname combined with a suspicious keyword (`login`). The private IP is not expected to be reachable from the deployed server; it is used to verify the risk-detection logic.

## 10. Setup and Usage

### Prerequisites

- Node.js & npm
- Python 3.10+
- PostgreSQL 16+ (required for full local functionality)

### Running PostgreSQL Locally

Start PostgreSQL using:

```powershell
C:\Users\DELL\pgsql\bin\postgres.exe -D C:\Users\DELL\pgsql\data
```

Keep this terminal running while using the local application. PostgreSQL listens on port `5432`.

### Running the Backend Locally

Open a **second terminal** in the project root:

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`.

### Running the Frontend Locally

Open a **third terminal** in the project root:

```bash
npm install
npm run dev
```

The frontend UI will be available at `http://localhost:3000`.

### Local Development

ThreatLens therefore uses three terminals during full local development:

```text
Terminal 1 → PostgreSQL :5432
Terminal 2 → FastAPI Backend :8000
Terminal 3 → React/Vite Frontend
```

### Building for Production

```bash
npm run build
```

## 11. Browser Extension

ThreatLens includes a Manifest V3 browser extension located in `/extension`.

**Workflow:**

1. The user clicks the extension while viewing a webpage.
2. The extension captures the current active tab URL.
3. The URL is submitted to the production FastAPI backend.
4. The backend performs the analysis and returns an `analysis_id`.
5. The extension opens the ThreatLens Vercel report using `/report?id=<analysis_id>`.
6. The report loads the detailed analysis for that ID.

This allows users to analyze the current webpage without manually copying and pasting its URL.

## 12. Why It's Technically Interesting

ThreatLens features several technical implementation details that make the system more robust:

- **State Hydration via Caching:** When the browser extension opens the web application in a new tab, the React SPA must load the report by its ID. Because the PostgreSQL history table stores a lightweight summary, the FastAPI backend maintains an in-memory rich analysis cache for recently generated reports. This allows the new tab to retrieve detailed analysis data such as HTTP headers and TLS information.

- **Modern TLS Hostname Verification:** The backend performs active TLS handshakes and implements hostname-matching logic using certificate SAN/CN values and wildcard matching, providing reliable hostname verification across modern Python runtimes.

- **Database-Driven Risk Engine:** Risk rules are stored and evaluated through PostgreSQL, allowing multiple detected signals to contribute to the final risk score.

- **Production SPA Routing:** Vercel rewrite configuration allows direct navigation to routes such as `/report`, `/technical`, `/history`, and `/analytics` without returning Vercel 404 errors.
