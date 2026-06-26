import { API_ENDPOINTS } from '../utils/constants';
import { createApiHook } from './createApiHook';

export const useGetCarSessions = createApiHook(null, {
  buildUrl: (carId) => API_ENDPOINTS.SESSION_BY_CAR(carId),
});

export const useGetAllActiveSessions = createApiHook(API_ENDPOINTS.SESSION_ALL_ACTIVE);

export const useGetActiveSessions = createApiHook(null, {
  buildUrl: (carId) => API_ENDPOINTS.SESSION_ACTIVE(carId),
});

export const useStartSession = createApiHook(API_ENDPOINTS.SESSION_START, {
  method: 'POST',
  successMessage: 'Lavoro avviato',
  buildBody: (carId, operatorName) => ({ carId, operatorName }),
});

export const useStopSession = createApiHook(API_ENDPOINTS.SESSION_STOP, {
  method: 'POST',
  successMessage: 'Lavoro fermato',
  buildBody: (carId, operatorName) => ({ carId, operatorName }),
});
