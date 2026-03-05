import { useCallback, useState } from 'react';
import { ApiError } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MutationState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
}

interface UseMutationResult<TData, TVariables> extends MutationState<TData> {
  /** Exécute la mutation et retourne la donnée (ou null en cas d'erreur) */
  mutate: (variables: TVariables) => Promise<TData | null>;
  /** Remet l'état à zéro (data, error) */
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Exécute une mutation API (POST, PUT, PATCH, DELETE) avec gestion du loading/error.
 *
 * @param mutationFn  Fonction async qui effectue la mutation
 *                    (ex: (payload) => api.post<User>('/users', payload))
 *
 * @example
 * // POST simple
 * const { mutate: createUser, isLoading } = useMutation(
 *   (payload: CreateUserPayload) => api.post<User>('/users', payload),
 * );
 * const user = await createUser({ email: '...', password: '...' });
 *
 * @example
 * // Avec service dédié
 * const { mutate: login, isLoading, error } = useMutation(authService.login);
 *
 * @example
 * // Sans variable (ex: logout)
 * const { mutate: logout } = useMutation(() => api.post('/auth/logout', {}));
 * <Button onPress={() => logout(undefined)} title="Déconnexion" />
 *
 * @example
 * // Upload fichier
 * const { mutate: uploadAvatar, isLoading } = useMutation((formData: FormData) =>
 *   api.upload<{ url: string }>('POST', '/users/avatar', formData),
 * );
 */
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
): UseMutationResult<TData, TVariables> {
  const [state, setState] = useState<MutationState<TData>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      setState({ data: null, isLoading: true, error: null });
      try {
        const data = await mutationFn(variables);
        setState({ data, isLoading: false, error: null });
        return data;
      } catch (err) {
        const error =
          err instanceof ApiError ? err : new ApiError(0, 'Erreur inconnue');
        setState({ data: null, isLoading: false, error });
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, mutate, reset };
}
