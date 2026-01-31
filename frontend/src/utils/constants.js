/**
 * API Configuration Constants
 */

// Base URL for all API calls
export const API_BASE_URL = 'https://gestionale-alice.onrender.com/api';

// API Endpoints
export const API_ENDPOINTS = {
  CARS: '/cars',
  SESSIONS: '/sessions',
  SESSION_START: '/sessions/start',
  SESSION_STOP: '/sessions/stop',
  SESSION_ACTIVE: (carId) => `/sessions/active/${carId}`,
  SESSION_BY_CAR: (carId) => `/sessions/car/${carId}`,
  CAR_BY_ID: (carId) => `/cars/${carId}`,
};
