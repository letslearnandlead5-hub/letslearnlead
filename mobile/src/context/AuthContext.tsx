import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authService } from '../services/authService';
import { Storage } from '../utils/storage';
import { User, LoginPayload, RegisterPayload, UpdateProfilePayload } from '../types';

// ─── State ────────────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_ERROR'; payload: string | null };

// ─── Reducer ──────────────────────────────────────────────────────────────────
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────
interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Restore session on app start
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await Storage.getToken();
        if (!token) {
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        const response = await authService.getMe();
        if (response.success && response.user) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: response.user, token },
          });
        } else {
          await Storage.clearAll();
          dispatch({ type: 'LOGOUT' });
        }
      } catch {
        await Storage.clearAll();
        dispatch({ type: 'LOGOUT' });
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const response = await authService.login(payload);
      if (response.success && response.token && response.user) {
        await Storage.setToken(response.token);
        await Storage.setUser(response.user);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: response.user, token: response.token },
        });
      }
    } catch (error: any) {
      const msg = error.userMessage || 'Login failed. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw error;
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const response = await authService.register(payload);
      if (response.success && response.token && response.user) {
        await Storage.setToken(response.token);
        await Storage.setUser(response.user);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: response.user, token: response.token },
        });
      }
    } catch (error: any) {
      const msg = error.userMessage || 'Registration failed. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await Storage.clearAll();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    try {
      const response = await authService.updateProfile(payload);
      if (response.success && response.user) {
        await Storage.setUser(response.user);
        dispatch({ type: 'UPDATE_USER', payload: response.user });
      }
    } catch (error: any) {
      const msg = error.userMessage || 'Profile update failed.';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, updateProfile, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
