import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueryState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
}

interface UseQueryOptions {
  /**
   * Si `false`, le fetch ne s'exécute pas automatiquement.
   * Utile pour attendre qu'un paramètre soit défini.
   * @default true
   */
  enabled?: boolean;
}

interface UseQueryResult<T> extends QueryState<T> {
  /** Relance manuellement la requête */
  refetch: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetch des données depuis l'API avec gestion automatique du loading/error/data.
 *
 * @param queryKey  Tableau de valeurs qui identifient la requête.
 *                  Quand l'une d'elles change, la requête est relancée automatiquement.
 * @param fetcher   Fonction async qui retourne la donnée (ex: () => api.get<User[]>('/users')).
 * @param options   { enabled } — désactive l'auto-fetch si false.
 *
 * @example
 * // Fetch simple
 * const { data, isLoading, error } = useQuery(['users'], () => api.get<User[]>('/users'));
 *
 * @example
 * // Fetch conditionnel (attend que userId soit défini)
 * const { data } = useQuery(
 *   ['user', userId],
 *   () => api.get<User>(`/users/${userId}`),
 *   { enabled: !!userId },
 * );
 *
 * @example
 * // Refetch manuel
 * const { data, refetch } = useQuery(['profile'], () => authService.getMe());
 * <Button onPress={refetch} title="Actualiser" />
 */
export function useQuery<T>(
  queryKey: unknown[],
  fetcher: () => Promise<T>,
  options: UseQueryOptions = {},
): UseQueryResult<T> {
  const { enabled = true } = options;

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    isLoading: enabled,
    error: null,
  });

  // Toujours référencer la dernière version du fetcher sans le mettre en dep
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof ApiError ? err : new ApiError(0, 'Erreur inconnue'),
      }));
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (enabled) execute();
  }, [enabled, execute, ...queryKey]);

  return { ...state, refetch: execute };
}
