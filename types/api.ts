/**
 * API Response Types
 *
 * Tipos genéricos para estandarizar las respuestas del backend.
 * Facilita el manejo de errores y respuestas exitosas de forma consistente.
 */

/**
 * Respuesta exitosa genérica
 * Tu backend responde con: { data: T }
 */
export interface ApiResponse<T> {
  data: T;
}

/**
 * Respuesta con paginación
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Error de la API
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, string[]>;
}

/**
 * Errores de validación (formularios)
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Estado genérico para hooks de datos
 */
export interface QueryState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Estado para mutaciones (crear, actualizar, eliminar)
 */
export interface MutationState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
}

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Parámetros de ordenamiento
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Parámetros de búsqueda combinados
 */
export interface QueryParams extends PaginationParams, SortParams {
  search?: string;
}