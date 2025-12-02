import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { API_BASE_URL, API_ENABLED } from '../../config/apiConfig';

interface User {
  cpf: string;
  requiresTwoFactor: boolean;
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  twoFactorEnabled?: boolean;
}

interface LoginResponse {
  cpf: string;
  requiresTwoFactor: boolean;
  token?: string; // Token definitivo se 2FA=false
  temporaryToken?: string; // Token tempor├írio se 2FA=true
}

interface TwoFAResponse {
  cpf: string;
  token: string; // Token definitivo
  status: string;
}

interface AuthContextType {
  // Estados
  token: string | null; // Token definitivo para sess├úo
  tempToken: string | null; // Token tempor├írio para verifica├º├úo 2FA
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresTwoFactor: boolean;
  
  // Fun├º├Áes
  login: (cpf: string, password: string) => Promise<boolean>;
  verifyTwoFactor: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeCpf = (value: string) => value.replace(/\D/g, '');

// Busca perfil do usuário autenticado (usa token definitivo)
const fetchUserProfile = async (token: string, fallbackCpf: string): Promise<Partial<User> | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn('Falha ao carregar perfil do usuário:', response.status);
      return null;
    }

    const data = await response.json();
    return {
      id: data?.id,
      cpf: data?.cpf ?? fallbackCpf,
      firstName: data?.firstName ?? data?.first_name,
      lastName: data?.lastName ?? data?.last_name,
      email: data?.email,
      role: data?.role ?? data?.userRole ?? data?.authority,
      twoFactorEnabled: data?.twoFactorEnabled ?? data?.two_factor_enabled,
    };
  } catch (error) {
    console.warn('Erro ao carregar perfil do usuário:', error);
    return null;
  }
};
// Configura├º├Áes da API
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null); // Token definitivo para sess├úo
  const [tempToken, setTempToken] = useState<string | null>(null); // Token tempor├írio para 2FA
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  // Fun├º├úo de login inicial
  const login = async (cpf: string, password: string): Promise<boolean> => {
    if (!API_ENABLED) {
      setIsLoading(true);
      try {
        setTempToken(null);
        setRequiresTwoFactor(false);
        setToken('offline-token');
        setUser({
          cpf,
          requiresTwoFactor: false
        });
        router.replace('/main/Logs');
        return true;
      } finally {
        setIsLoading(false);
      }
    }

    try {
      setIsLoading(true);
      const formattedCpf = cpf;
      const cleanCpf = normalizeCpf(cpf);
      
      console.log('­ƒöä Iniciando login...');
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf: formattedCpf,
          password: password
        })
      });

      if (!response.ok) {
        let serverMessage = '';
        try {
          const body = await response.json();
          serverMessage = body?.message ?? body ?? '';
        } catch {
          // ignore parse errors
        }
        const errorMessage = serverMessage || getErrorMessage(response.status);
        Alert.alert('Erro de Login', errorMessage);
        setTempToken(null);
        setRequiresTwoFactor(false);
        return false;
      }

      const rawLogin: Record<string, any> = await response.json();
      const tokenFromApi = rawLogin.token ?? rawLogin.accessToken ?? rawLogin.jwt;
      const tempTokenFromApi = rawLogin.tempToken ?? rawLogin.temporaryToken ?? rawLogin.tempJwt;
      const loginData: LoginResponse = {
        cpf: rawLogin.cpf ?? formattedCpf ?? cleanCpf,
        requiresTwoFactor: !!(
          rawLogin.requiresTwoFactor ??
          rawLogin.twoFactorEnabled ??
          rawLogin.twoFactor ??
          rawLogin.two_factor
        ),
        token: tokenFromApi ?? undefined,
        temporaryToken: tempTokenFromApi ?? undefined,
      };
      
      console.log('­ƒôï Resposta do login:', { 
        cpf: loginData.cpf, 
        requiresTwoFactor: loginData.requiresTwoFactor,
        hasToken: !!loginData.token,
        hasTemporaryToken: !!loginData.temporaryToken,
        tokenPreview: loginData.token ? `${loginData.token.substring(0, 20)}...` : 'AUSENTE',
        tempTokenPreview: loginData.temporaryToken ? `${loginData.temporaryToken.substring(0, 20)}...` : 'AUSENTE'
      });
      
      if (loginData.requiresTwoFactor) {
        // Caso necessite 2FA - recebe temporaryToken
        console.log('­ƒöÉ 2FA necess├írio - salvando temporaryToken');
        
        if (!loginData.temporaryToken) {
          console.error('ÔØî temporaryToken n├úo recebido');
          Alert.alert('Erro', 'Token tempor├írio n├úo recebido do servidor.');
          return false;
        }
        
        // Salva o temporaryToken
        setTempToken(loginData.temporaryToken);
        setUser({
          cpf: loginData.cpf,
          requiresTwoFactor: true
        });
        setRequiresTwoFactor(true);
        
        console.log('Ô£à temporaryToken salvo para verifica├º├úo 2FA');
        
        return true; // Login inicial bem-sucedido, mas precisa de 2FA
        
      } else {
        // Login direto sem 2FA - recebe token definitivo
        console.log('Ô£à Login direto sem 2FA - token definitivo recebido');
        
        if (!loginData.token) {
          Alert.alert('Erro', 'Token definitivo n├úo recebido do servidor.');
          return false;
        }
        
        // Salva como token DEFINITIVO
        setToken(loginData.token);
        const profile = await fetchUserProfile(loginData.token, loginData.cpf);
        setUser({
          cpf: profile?.cpf ?? loginData.cpf,
          ...profile,
          requiresTwoFactor: false
        });
        setRequiresTwoFactor(false);
        
        // Navega para tela principal
        router.replace('/main/Logs');
        
        return true;
      }
      
    } catch (error) {
      console.error('ÔØî Erro no login:', error);
      Alert.alert('Erro', 'Erro de conex├úo.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fun├º├úo de verifica├º├úo 2FA
  const verifyTwoFactor = async (code: string): Promise<boolean> => {
    if (!API_ENABLED) {
      setIsLoading(true);
      try {
        setToken('offline-token');
        setTempToken(null);
        setRequiresTwoFactor(false);
        router.replace('/main/Logs');
        return true;
      } finally {
        setIsLoading(false);
      }
    }

    if (!tempToken) {
      console.error('ÔØî Token tempor├írio n├úo encontrado');
      Alert.alert('Erro', 'Token tempor├írio n├úo encontrado. Fa├ºa login novamente.');
      setRequiresTwoFactor(false);
      return false;
    }

    try {
      setIsLoading(true);
      
      console.log('­ƒöä Verificando c├│digo 2FA...');
      console.log('­ƒæñ Para usu├írio:', user?.cpf);
      console.log('­ƒÄ½ Usando temporaryToken:', `${tempToken.substring(0, 20)}...`);
      console.log('­ƒöó C├│digo enviado:', code);
      
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`, // Token tempor├írio no header
        },
        body: JSON.stringify({
          code: code // Apenas c├│digo no body
        })
      });

      console.log('­ƒôÑ Resposta /verify:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData?.message ?? JSON.stringify(errorData);
          console.log('­ƒôä Detalhes do erro:', errorData);
        } catch (e) {
          console.log('ÔØî Erro ao ler resposta:', e);
        }
        
        const errorMessage = get2FAErrorMessage(response.status);
        Alert.alert('Erro na Verifica├º├úo', errorDetails || errorMessage);
        return false;
      }

      const rawTwoFA: Record<string, any> = await response.json();
      const finalToken =
        rawTwoFA.token ??
        rawTwoFA.accessToken ??
        rawTwoFA.jwt ??
        rawTwoFA.Authorization ??
        rawTwoFA.authorization ??
        null;

      if (!finalToken) {
        Alert.alert('Erro', 'Token definitivo n├úo recebido na verifica├º├úo 2FA.');
        return false;
      }

      const twoFAData: TwoFAResponse = {
        cpf: rawTwoFA.cpf ?? user?.cpf ?? '',
        token: finalToken,
        status: rawTwoFA.status ?? 'authenticated',
      };
      
      console.log('Ô£à 2FA verificado com sucesso:', { 
        cpf: twoFAData.cpf,
        status: twoFAData.status,
        finalTokenReceived: !!twoFAData.token,
        finalTokenPreview: twoFAData.token ? `${twoFAData.token.substring(0, 20)}...` : 'AUSENTE'
      });
      
      // Substitui token tempor├írio pelo TOKEN DEFINITIVO
      setToken(twoFAData.token); // Token definitivo para a sess├úo
      setTempToken(null); // Limpa token tempor├írio
      setRequiresTwoFactor(false);
      const profile = await fetchUserProfile(twoFAData.token, twoFAData.cpf);
      setUser({
        cpf: profile?.cpf ?? twoFAData.cpf,
        ...profile,
        requiresTwoFactor: false
      });
      
      console.log('­ƒÄ» Token definitivo configurado - redirecionando para app');
      
      // Navega para tela principal
      router.replace('/main/Logs');
      
      return true;
      
    } catch (error) {
      console.error('ÔØî Erro na verifica├º├úo 2FA:', error);
      Alert.alert('Erro', `Erro de conex├úo: ${error}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fun├º├úo de logout
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      console.log('­ƒöä Fazendo logout...');
      
      // Limpa todos os estados
      setToken(null); // Token definitivo
      setTempToken(null); // Token tempor├írio
      setUser(null);
      setRequiresTwoFactor(false);
      
      console.log('Ô£à Logout realizado com sucesso');
      
      // Navega para login
      router.replace('/');
      
    } catch (error) {
      console.error('ÔØî Erro no logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mapeia status HTTP para mensagens de erro de login
  const getErrorMessage = (status: number): string => {
    switch (status) {
      case 401:
        return 'CPF ou senha incorretos';
      case 400:
        return 'Dados inv├ílidos';
      case 403:
        return 'Acesso negado';
      case 500:
        return 'Erro interno do servidor';
      default:
        return 'Erro desconhecido. Tente novamente.';
    }
  };

  // Mapeia status HTTP para mensagens de erro de 2FA
  const get2FAErrorMessage = (status: number): string => {
    switch (status) {
      case 400:
        return 'C├│digo inv├ílido ou expirado';
      case 401:
        return 'Token tempor├írio inv├ílido. Fa├ºa login novamente.';
      case 403:
        return 'C├│digo incorreto';
      case 500:
        return 'Erro interno do servidor';
      default:
        return 'Erro desconhecido. Tente novamente.';
    }
  };

  return (
    <AuthContext.Provider value={{
      token, // Token definitivo para sess├úo
      tempToken, // Token tempor├írio para 2FA
      user,
      isAuthenticated: !!token, // Autenticado apenas com token definitivo
      isLoading,
      requiresTwoFactor,
      login,
      verifyTwoFactor,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Hook para requisi├º├Áes autenticadas (usa apenas token definitivo)
export const useAuthenticatedFetch = () => {
  const { token, logout } = useAuth();

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!API_ENABLED) {
      console.warn('API desabilitada: requisicao ignorada', url);
      throw new Error('API disabled');
    }
    console.log('­ƒöì useAuthenticatedFetch - Iniciando requisi├º├úo');
    console.log('­ƒöù URL:', url);
    console.log('­ƒöæ Token dispon├¡vel:', token ? `${token.substring(0, 30)}...` : 'NENHUM TOKEN');
    
    if (!token) {
      console.error('ÔØî Token n├úo dispon├¡vel para requisi├º├úo autenticada');
      throw new Error('Token n├úo dispon├¡vel');
    }

    // Cria headers dinamicamente baseado no tipo de body
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };

    // Se n├úo ├® FormData, adiciona Content-Type application/json
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Merge com headers customizados (se houver)
    const finalHeaders = {
      ...headers,
      ...options.headers,
    };

    console.log('­ƒôñ Headers da requisi├º├úo:', {
      ...finalHeaders,
      'Authorization': `Bearer ${token.substring(0, 30)}...` // Log parcial do token
    });

    const response = await fetch(url, {
      ...options,
      headers: finalHeaders,
    });

    console.log('­ƒôÑ Resposta da requisi├º├úo autenticada:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // Se token expirou, faz logout autom├ítico
    if (response.status === 401) {
      console.log('­ƒöÆ Token expirado (401), fazendo logout autom├ítico');
      await logout();
      throw new Error('Sess├úo expirada');
    }

    return response;
  }, [token, logout]);

  return authenticatedFetch;
};

export default function() { return null; }


