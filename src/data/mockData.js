/**
 * ThreatLens - Mock Data Store (Phase 1)
 * 
 * NOTE FOR PHASE 2 INTEGRATION:
 * In Phase 2, this static dataset will be replaced by API calls to the FastAPI backend.
 * The data structures below are intentionally designed to match the Pydantic schemas
 * that FastAPI endpoints (/api/v1/dashboard/stats, /api/v1/scans/recent, etc.) will return.
 */

export const mockDashboardStats = {
  totalScans: 14892,
  scansDelta: "+12.4%",
  highRisk: 1842,
  highRiskDelta: "+5.1%",
  suspicious: 3120,
  suspiciousDelta: "-2.8%",
  clean: 9930,
  cleanDelta: "+18.2%",
  avgDetectionTime: "184ms",
  accuracyRate: "99.4%",
  activeThreatFeeds: 18,
  signaturesCount: "2.4M"
};

export const mockQuickScanPresets = [
  {
    label: "Phishing Sample (O365 Fake Auth)",
    url: "https://micros0ft-verify-account.security-auth-portal.com/login",
    expectedRisk: "CRITICAL"
  },
  {
    label: "Credential Harvest (PayPal Clone)",
    url: "https://paypal-invoice-verification.live/billing-update",
    expectedRisk: "HIGH"
  },
  {
    label: "Typosquat / Lookalike",
    url: "https://g00gle-drive-docshare.xyz/download/invoice.pdf",
    expectedRisk: "HIGH"
  },
  {
    label: "Legitimate Clean Domain",
    url: "https://github.com/security",
    expectedRisk: "SAFE"
  }
];

export const mockRecentScans = [
  {
    id: "SCN-98421",
    target: "https://micros0ft-verify-account.security-auth-portal.com/login",
    type: "URL",
    riskLevel: "CRITICAL",
    riskScore: 94,
    category: "Phishing Portal",
    detectedThreats: ["Homograph Impersonation", "Stolen SSL Mismatch", "Credential Harvesting Form"],
    timestamp: "2 mins ago",
    status: "Completed",
    ipAddress: "185.220.101.44",
    location: "RU / Moscow",
    asn: "AS48911"
  },
  {
    id: "SCN-98420",
    target: "QR-PAY-INVOICE_69420.png (decoded: https://qr-pay-quick.cc/gateway)",
    type: "QR",
    riskLevel: "HIGH",
    riskScore: 82,
    category: "Malicious QR Redirect",
    detectedThreats: ["Open Redirect Cloaking", "Dynamic Payload Switcher"],
    timestamp: "8 mins ago",
    status: "Completed",
    ipAddress: "194.26.29.112",
    location: "NL / Amsterdam",
    asn: "AS202425"
  },
  {
    id: "SCN-98419",
    target: "URGENT: Your Payroll direct deposit failed - update now",
    type: "Email",
    riskLevel: "CRITICAL",
    riskScore: 91,
    category: "CEO Fraud / BEC",
    detectedThreats: ["SPF/DKIM Fail", "Display Name Spoofing", "Malicious Embedded Link"],
    timestamp: "15 mins ago",
    status: "Completed",
    ipAddress: "103.145.12.8",
    location: "VN / Hanoi",
    asn: "AS135905"
  },
  {
    id: "SCN-98418",
    target: "https://cloudflare-cdn-check.internal-auth.net/proxy",
    type: "URL",
    riskLevel: "MEDIUM",
    riskScore: 58,
    category: "Suspicious Proxy",
    detectedThreats: ["Self-Signed SSL", "Newly Registered Domain (2 days old)"],
    timestamp: "24 mins ago",
    status: "Completed",
    ipAddress: "45.154.255.80",
    location: "SC / Victoria",
    asn: "AS51852"
  },
  {
    id: "SCN-98417",
    target: "https://stripe.com/docs/security",
    type: "URL",
    riskLevel: "SAFE",
    riskScore: 4,
    category: "Legitimate Entity",
    detectedThreats: [],
    timestamp: "38 mins ago",
    status: "Completed",
    ipAddress: "199.60.103.28",
    location: "US / San Francisco",
    asn: "AS396982"
  },
  {
    id: "SCN-98416",
    target: "https://d0c-sign-contract.sharepoint-preview.info/d/882194",
    type: "URL",
    riskLevel: "HIGH",
    riskScore: 87,
    category: "Fake DocuSign Lure",
    detectedThreats: ["Microsoft Graph Token Phishing", "Obfuscated Javascript Payload"],
    timestamp: "45 mins ago",
    status: "Completed",
    ipAddress: "91.240.118.18",
    location: "RO / Bucharest",
    asn: "AS44034"
  },
  {
    id: "SCN-98415",
    target: "https://amazon.com/gp/help/customer/display.html",
    type: "URL",
    riskLevel: "SAFE",
    riskScore: 2,
    category: "Legitimate Entity",
    detectedThreats: [],
    timestamp: "1 hour ago",
    status: "Completed",
    ipAddress: "205.251.242.103",
    location: "US / Seattle",
    asn: "AS16509"
  }
];

export const mockThreatCategoriesData = [
  { name: "Phishing Portals", value: 42, color: "#EF4444" },
  { name: "Credential Harvest", value: 28, color: "#F97316" },
  { name: "Malware Droppers", value: 14, color: "#F59E0B" },
  { name: "Typosquats / Lookalikes", value: 10, color: "#06B6D4" },
  { name: "Suspicious Proxies", value: 6, color: "#8B5CF6" }
];

export const mockScanVolumeTrends = [
  { day: "Mon", total: 1850, malicious: 230, suspicious: 410, clean: 1210 },
  { day: "Tue", total: 2100, malicious: 310, suspicious: 490, clean: 1300 },
  { day: "Wed", total: 1980, malicious: 280, suspicious: 390, clean: 1310 },
  { day: "Thu", total: 2450, malicious: 420, suspicious: 560, clean: 1470 },
  { day: "Fri", total: 2890, malicious: 510, suspicious: 620, clean: 1760 },
  { day: "Sat", total: 1620, malicious: 190, suspicious: 280, clean: 1150 },
  { day: "Sun", total: 2002, malicious: 240, suspicious: 370, clean: 1392 }
];

export const mockEngineStatus = [
  {
    name: "ML Phishing Classifier",
    version: "v3.8-RoBERTa",
    status: "Operational",
    latency: "24ms",
    accuracy: "99.4%"
  },
  {
    name: "Live Threat Feed Sync",
    version: "18 Active Feeds",
    status: "Operational",
    latency: "12ms",
    accuracy: "100%"
  },
  {
    name: "DNS Sandbox Resolver",
    version: "DoH / Quad9 / CF",
    status: "Operational",
    latency: "45ms",
    accuracy: "99.9%"
  },
  {
    name: "Heuristic Link Engine",
    version: "Rulepack v2026.08",
    status: "Operational",
    latency: "18ms",
    accuracy: "98.7%"
  }
];

export const mockNotifications = [
  {
    id: "notif-1",
    title: "Critical Phishing Wave Detected",
    description: "New homograph campaign targeting Microsoft 365 tenants (14 matches in past hour)",
    time: "5m ago",
    type: "critical"
  },
  {
    id: "notif-2",
    title: "Threat Intel Feed Updated",
    description: "Added 4,820 newly cataloged malicious domains to blacklist cache",
    time: "25m ago",
    type: "info"
  },
  {
    id: "notif-3",
    title: "High Risk QR Code Analyzed",
    description: "Decoded payload leads to dynamic payload switcher located in Netherlands",
    time: "1h ago",
    type: "warning"
  }
];
