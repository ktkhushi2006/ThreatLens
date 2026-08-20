# ThreatLens — Phase 1 (First Tiny Working Version)

ThreatLens is a cybersecurity phishing and malicious link risk analysis platform.

Phase 1 establishes the first minimal, end-to-end working pipeline:
```
React Frontend → POST /api/analyze → FastAPI Backend → JSON Response → React UI Render
```

---

## 1. Project Architecture

```
ThreatLens/
├── backend/
│   ├── main.py              # FastAPI application with CORS and POST /api/analyze endpoint
│   └── requirements.txt     # Backend dependencies (fastapi, uvicorn, pydantic)
├── src/
│   ├── App.jsx              # Simple, professional React UI with URL input, analyze action & response card
│   ├── main.jsx             # React entry point
│   └── index.css            # Tailwind CSS styling and dark cybersecurity theme
├── index.html               # Main HTML document
├── package.json             # Frontend dependencies (React, Vite, Lucide icons, Tailwind)
├── vite.config.js           # Vite server configuration (runs on port 3000)
├── tailwind.config.js       # Tailwind CSS configuration
└── postcss.config.js        # PostCSS configuration
```

---

## 2. API Contract

### `POST /api/analyze`

#### **Request Body (`application/json`)**:
```json
{
  "url": "https://example.com"
}
```

#### **Response Body (`application/json`)**:
```json
{
  "url": "https://example.com",
  "risk_score": 10,
  "risk_level": "LOW",
  "reasons": []
}
```

---

## 3. How to Run

### Step 1: Start the FastAPI Backend
```bash
# From project root:
uvicorn backend.main:app --reload --port 8000
```
- API Health Check: `http://localhost:8000/`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### Step 2: Start the React Frontend
```bash
# In another terminal from project root:
npm run dev
```
- Open browser at: `http://localhost:3000`

---

## 4. Verification Test

1. Enter any URL (e.g. `https://example.com` or click one of the sample buttons).
2. Click **Analyze URL**.
3. React sends `POST /api/analyze` with `{ "url": "..." }` to `http://localhost:8000/api/analyze`.
4. FastAPI processes the payload and returns `{ "url": "...", "risk_score": 10, "risk_level": "LOW", "reasons": [] }`.
5. React renders:
   - Target URL
   - Risk Level badge (`LOW`)
   - Risk Score bar (`10 / 100`)
   - Reasons list (`[]`)
   - Collapsible Raw JSON payload viewer
