/**
 * ThreatLens - API Service Layer (Phase 1 Mock / Phase 2 Gateway)
 * 
 * In Phase 1: Returns simulated Promises backed by `mockData.js` with realistic network latency.
 * In Phase 2: Switch USE_MOCK to false or point API_BASE_URL to your FastAPI server (e.g. http://localhost:8000).
 */

import {
  mockDashboardStats,
  mockRecentScans,
  mockThreatCategoriesData,
  mockScanVolumeTrends,
  mockEngineStatus,
  mockNotifications
} from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const USE_MOCK = true; // Toggle to false in Phase 2 when FastAPI is running

// Simulated latency helper for Phase 1
const mockDelay = (ms = 250) => new Promise(resolve => setTimeout(resolve, ms));

export const threatLensApi = {
  /**
   * Phase 2 FastAPI endpoint: GET /api/v1/dashboard/stats
   */
  async getDashboardStats() {
    if (USE_MOCK) {
      await mockDelay(150);
      return { success: true, data: mockDashboardStats };
    }
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    return response.json();
  },

  /**
   * Phase 2 FastAPI endpoint: GET /api/v1/scans/recent
   */
  async getRecentScans(filter = 'ALL') {
    if (USE_MOCK) {
      await mockDelay(200);
      let list = [...mockRecentScans];
      if (filter === 'HIGH_RISK') {
        list = list.filter(s => s.riskLevel === 'CRITICAL' || s.riskLevel === 'HIGH');
      } else if (filter === 'SUSPICIOUS') {
        list = list.filter(s => s.riskLevel === 'MEDIUM');
      } else if (filter === 'CLEAN') {
        list = list.filter(s => s.riskLevel === 'SAFE');
      }
      return { success: true, data: list };
    }
    const response = await fetch(`${API_BASE_URL}/scans/recent?filter=${filter}`);
    return response.json();
  },

  /**
   * Phase 2 FastAPI endpoint: GET /api/v1/analytics/categories
   */
  async getThreatCategories() {
    if (USE_MOCK) {
      await mockDelay(150);
      return { success: true, data: mockThreatCategoriesData };
    }
    const response = await fetch(`${API_BASE_URL}/analytics/categories`);
    return response.json();
  },

  /**
   * Phase 2 FastAPI endpoint: GET /api/v1/analytics/trends
   */
  async getScanVolumeTrends() {
    if (USE_MOCK) {
      await mockDelay(150);
      return { success: true, data: mockScanVolumeTrends };
    }
    const response = await fetch(`${API_BASE_URL}/analytics/trends`);
    return response.json();
  },

  /**
   * Phase 2 FastAPI endpoint: GET /api/v1/system/engine-status
   */
  async getEngineStatus() {
    if (USE_MOCK) {
      await mockDelay(100);
      return { success: true, data: mockEngineStatus };
    }
    const response = await fetch(`${API_BASE_URL}/system/engine-status`);
    return response.json();
  },

  /**
   * Phase 2 FastAPI endpoint: GET /api/v1/notifications
   */
  async getNotifications() {
    if (USE_MOCK) {
      await mockDelay(100);
      return { success: true, data: mockNotifications };
    }
    const response = await fetch(`${API_BASE_URL}/notifications`);
    return response.json();
  },

  /**
   * Phase 2 FastAPI endpoint: POST /api/v1/scan/quick-url
   */
  async quickAnalyzeUrl(url) {
    if (USE_MOCK) {
      await mockDelay(600);
      const isSuspicious = url.includes('micros0ft') || url.includes('paypal') || url.includes('d0c') || url.includes('preview');
      return {
        success: true,
        data: {
          target: url,
          riskLevel: isSuspicious ? 'CRITICAL' : 'SAFE',
          riskScore: isSuspicious ? 92 : 5,
          category: isSuspicious ? 'Phishing Simulation' : 'Clean Target',
          scanId: `SCN-${Math.floor(10000 + Math.random() * 90000)}`
        }
      };
    }
    const response = await fetch(`${API_BASE_URL}/scan/quick-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return response.json();
  }
};
