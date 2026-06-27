import { useState, useCallback, useRef } from 'react';
import { fetchWithAuth } from '../utils/api';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import toast from 'react-hot-toast';
import { createApiHook } from './createApiHook';

/**
 * Hook to fetch all cars
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback on successful fetch (receives full unfiltered result)
 * @param {Function} options.onError - Callback on error
 */
export const useGetCars = ({ onSuccess, onError } = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}${API_ENDPOINTS.CARS}`);
      if (!response.ok) throw new Error('Errore nel caricamento delle macchine');
      const result = await response.json();
      setData(result);
      if (onSuccessRef.current) onSuccessRef.current(result);
      return result;
    } catch (err) {
      setError(err.message);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      } else {
        toast.error(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // stabile — nessuna dipendenza esterna

  return { execute, loading, error, data };
};

export const useCreateCar = createApiHook(API_ENDPOINTS.CARS, {
  method: 'POST',
  successMessage: 'Macchina creata',
  buildBody: (carData) => carData,
});

export const useUpdateCar = createApiHook(null, {
  method: 'PUT',
  successMessage: 'Modifiche salvate',
  buildUrl: (carId) => API_ENDPOINTS.CAR_BY_ID(carId),
  buildBody: (carId, updates) => updates,
});

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

export const useCompleteCar = createApiHook(null, {
  method: 'PUT',
  successMessage: 'Macchina completata',
  buildUrl: (carId) => API_ENDPOINTS.CAR_BY_ID(carId),
  buildBody: () => ({ status: 'completed' }),
});

export const useRestoreCar = createApiHook(null, {
  method: 'PUT',
  successMessage: 'Macchina riportata in lavorazione',
  buildUrl: (carId) => API_ENDPOINTS.CAR_BY_ID(carId),
  buildBody: () => ({ status: 'waiting' }),
});
