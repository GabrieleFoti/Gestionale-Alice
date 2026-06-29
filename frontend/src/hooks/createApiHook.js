import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';
import { API_BASE_URL } from '../utils/constants';
import toast from 'react-hot-toast';

/**
 * Factory per hook di chiamate API con AbortController integrato.
 * @param {string|null} url - URL relativo (es. '/cars'), oppure null se si usa buildUrl
 * @param {object} [options]
 * @param {string} [options.method='GET']
 * @param {string} [options.successMessage] - Toast mostrato on success
 * @param {string} [options.errorMessage] - Toast mostrato on error
 * @param {Function} [options.buildUrl] - (...args) => string, sovrascrive url se fornita
 * @param {Function} [options.buildBody] - (...args) => object, corpo della richiesta
 */
export function createApiHook(url, options = {}) {
  const { method = 'GET', successMessage, errorMessage, buildUrl, buildBody } = options;

  return function useApiHook({ onSuccess, onError } = {}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const abortRef = useRef(null);
    const onSuccessRef = useRef(onSuccess);
    onSuccessRef.current = onSuccess;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    useEffect(() => {
      return () => { abortRef.current?.abort(); };
    }, []);

    const execute = useCallback(async (...args) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      const resolvedUrl = buildUrl ? buildUrl(...args) : url;
      const body = buildBody ? buildBody(...args) : undefined;

      try {
        const response = await fetchWithAuth(`${API_BASE_URL}${resolvedUrl}`, {
          method,
          signal: controller.signal,
          ...(body ? { body: JSON.stringify(body) } : {}),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || errorMessage || 'Errore nella comunicazione col server');
        }

        const result = await response.json();
        setData(result);
        if (successMessage) toast.success(successMessage);
        if (onSuccessRef.current) onSuccessRef.current(result);
        return result;
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message);
        if (onErrorRef.current) onErrorRef.current(err);
        else toast.error(err.message);
        throw err;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, []); // stabile — onSuccess/onError accessibili via ref

    return { execute, loading, error, data };
  };
}
