import { useState, useCallback } from 'react';
import { fetchWithAuth } from '../utils/api';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import toast from 'react-hot-toast';

/**
 * Hook to get all sessions for a specific car
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Callback on error
 */
export const useGetCarSessions = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  const execute = useCallback(async (carId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}${API_ENDPOINTS.SESSION_BY_CAR(carId)}`);
      
      if (!response.ok) throw new Error('Errore nel caricamento delle sessioni');
      
      const result = await response.json();
      setData(result);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      setError(err.message);
      if (onError) {
        onError(err);
      } else {
        console.error("Error fetching sessions:", err);
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  return { execute, loading, error, data };
};

/**
 * Hook to get active sessions for a specific car
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Callback on error
 */
export const useGetActiveSessions = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  const execute = useCallback(async (carId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}${API_ENDPOINTS.SESSION_ACTIVE(carId)}`);
      
      if (!response.ok) throw new Error('Errore nel caricamento delle sessioni attive');
      
      const result = await response.json();
      setData(result);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      setError(err.message);
      if (onError) {
        onError(err);
      } else {
        console.error("Error checking active session:", err);
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  return { execute, loading, error, data };
};

/**
 * Hook to start a work session
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback on successful start
 * @param {Function} options.onError - Callback on error
 */
export const useStartSession = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (carId, operatorName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}${API_ENDPOINTS.SESSION_START}`, {
        method: 'POST',
        body: JSON.stringify({ carId, operatorName })
      });

      if (!response.ok) throw new Error('Errore nella comunicazione col server');
      
      const result = await response.json();
      toast.success('Lavoro avviato');
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      setError(err.message);
      if (onError) {
        onError(err);
      } else {
        toast.error(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  return { execute, loading, error };
};

/**
 * Hook to stop a work session
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback on successful stop
 * @param {Function} options.onError - Callback on error
 */
export const useStopSession = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (carId, operatorName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}${API_ENDPOINTS.SESSION_STOP}`, {
        method: 'POST',
        body: JSON.stringify({ carId, operatorName })
      });

      if (!response.ok) throw new Error('Errore nella comunicazione col server');
      
      const result = await response.json();
      toast.success('Lavoro fermato');
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      setError(err.message);
      if (onError) {
        onError(err);
      } else {
        toast.error(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  return { execute, loading, error };
};
