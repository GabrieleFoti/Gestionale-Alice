import { useState, useCallback } from 'react';
import { fetchWithAuth } from '../utils/api';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import toast from 'react-hot-toast';

/**
 * Hook to fetch all cars with optional filtering
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Callback on error
 * @param {Function} options.filter - Optional filter function to apply to results
 */
export const useGetCars = ({ onSuccess, onError, filter } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}${API_ENDPOINTS.CARS}`);
      if (!response.ok) throw new Error('Errore nel caricamento delle macchine');
      
      let result = await response.json();
      
      // Apply filter if provided
      if (filter && typeof filter === 'function') {
        result = result.filter(filter);
      }
      
      setData(result);
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
  }, [onSuccess, onError, filter]);

  return { execute, loading, error, data };
};

/**
 * Hook to create a new car
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback on successful creation
 * @param {Function} options.onError - Callback on error
 */
export const useCreateCar = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (carData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}${API_ENDPOINTS.CARS}`, {
        method: 'POST',
        body: JSON.stringify(carData)
      });

      if (!response.ok) throw new Error('Errore durante la creazione');
      
      const result = await response.json();
      toast.success('Macchina creata');
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
 * Hook to update a car
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback on successful update
 * @param {Function} options.onError - Callback on error
 */
export const useUpdateCar = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (carId, updates) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}${API_ENDPOINTS.CAR_BY_ID(carId)}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Errore durante il salvataggio');
      
      const result = await response.json();
      toast.success('Modifiche salvate');
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
 * Hook to delete a car
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback on successful deletion
 * @param {Function} options.onError - Callback on error
 */
export const useDeleteCar = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (carId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa macchina?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}${API_ENDPOINTS.CAR_BY_ID(carId)}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Errore durante l\'eliminazione');
      
      toast.success('Macchina eliminata');
      if (onSuccess) onSuccess();
      return true;
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
 * Hook to mark a car as completed
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback on successful completion
 * @param {Function} options.onError - Callback on error
 */
export const useCompleteCar = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (carId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}${API_ENDPOINTS.CAR_BY_ID(carId)}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' })
      });

      if (!response.ok) throw new Error('Errore durante il completamento');
      
      const result = await response.json();
      toast.success('Macchina completata');
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
 * Hook to restore a car to in_progress status
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback on successful restore
 * @param {Function} options.onError - Callback on error
 */
export const useRestoreCar = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (carId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}${API_ENDPOINTS.CAR_BY_ID(carId)}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'in_progress' })
      });

      if (!response.ok) throw new Error('Errore durante il ripristino');
      
      const result = await response.json();
      toast.success('Macchina riportata in lavorazione');
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
