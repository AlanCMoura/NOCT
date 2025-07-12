import React, { createContext, useContext, useState, ReactNode } from 'react';
import { router } from 'expo-router';
import { Alert } from 'react-native';

interface User {
  cpf: string;
  requiresTwoFactor: boolean;
}

interface LoginResponse {
  cpf: string;
  requiresTwoFactor: boolean;
  token?: string; // Token definitivo se 2FA=false
  temporaryToken?: string; // Token temporário se 2FA=true
}

interface TwoFAResponse {
  cpf: string;
  token: string; // Token definitivo
  status: string;
}

interface AuthContextType {
  // Estados
  token: string | null; // Token definitivo para sessão
  tempToken: string | null; // Token temporário para verificação 2FA
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresTwoFactor: boolean;
  
  // Funções
  login: (cpf: string, password: string) => Promise<boolean>;
  verifyTwoFactor: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configurações da API
const API_BASE_URL = 'http://containerview-prod.us-east-1.elasticbeanstalk.com';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null); // Token definitivo para sessão
  const [tempToken, setTempToken] = useState<string | null>(null); // Token temporário para 2FA
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  // Função de login inicial
  const login = async (cpf: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Iniciando login...');
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf: cpf, // Envia CPF COM formatação (pontos e traços)
          password: password
        })
      });

      if (!response.ok) {
        const errorMessage = getErrorMessage(response.status);
        Alert.alert('Erro de Login', errorMessage);
        return false;
      }

      const loginData: LoginResponse = await response.json();
      
      console.log('📋 Resposta do login:', { 
        cpf: loginData.cpf, 
        requiresTwoFactor: loginData.requiresTwoFactor,
        hasToken: !!loginData.token,
        hasTemporaryToken: !!loginData.temporaryToken,
        tokenPreview: loginData.token ? `${loginData.token.substring(0, 20)}...` : 'AUSENTE',
        tempTokenPreview: loginData.temporaryToken ? `${loginData.temporaryToken.substring(0, 20)}...` : 'AUSENTE'
      });
      
      if (loginData.requiresTwoFactor) {
        // Caso necessite 2FA - recebe temporaryToken
        console.log('🔐 2FA necessário - salvando temporaryToken');
        
        if (!loginData.temporaryToken) {
          console.error('❌ temporaryToken não recebido');
          Alert.alert('Erro', 'Token temporário não recebido do servidor.');
          return false;
        }
        
        // Salva o temporaryToken
        setTempToken(loginData.temporaryToken);
        setUser({
          cpf: loginData.cpf,
          requiresTwoFactor: true
        });
        setRequiresTwoFactor(true);
        
        console.log('✅ temporaryToken salvo para verificação 2FA');
        
        return true; // Login inicial bem-sucedido, mas precisa de 2FA
        
      } else {
        // Login direto sem 2FA - recebe token definitivo
        console.log('✅ Login direto sem 2FA - token definitivo recebido');
        
        if (!loginData.token) {
          Alert.alert('Erro', 'Token definitivo não recebido do servidor.');
          return false;
        }
        
        // Salva como token DEFINITIVO
        setToken(loginData.token);
        setUser({
          cpf: loginData.cpf,
          requiresTwoFactor: false
        });
        setRequiresTwoFactor(false);
        
        // Navega para tela principal
        router.replace('/main/logs');
        
        return true;
      }
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      Alert.alert('Erro', 'Erro de conexão.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de verificação 2FA
  const verifyTwoFactor = async (code: string): Promise<boolean> => {
    if (!tempToken) {
      console.error('❌ Token temporário não encontrado');
      Alert.alert('Erro', 'Token temporário não encontrado. Faça login novamente.');
      setRequiresTwoFactor(false);
      return false;
    }

    try {
      setIsLoading(true);
      
      console.log('🔄 Verificando código 2FA...');
      console.log('👤 Para usuário:', user?.cpf);
      console.log('🎫 Usando temporaryToken:', `${tempToken.substring(0, 20)}...`);
      console.log('🔢 Código enviado:', code);
      
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`, // Token temporário no header
        },
        body: JSON.stringify({
          code: code // Apenas código no body
        })
      });

      console.log('📥 Resposta /verify:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorData = await response.text();
          errorDetails = errorData;
          console.log('📄 Detalhes do erro:', errorData);
        } catch (e) {
          console.log('❌ Erro ao ler resposta:', e);
        }
        
        const errorMessage = get2FAErrorMessage(response.status);
        Alert.alert('Erro na Verificação', `${errorMessage}\n\n${errorDetails}`);
        return false;
      }

      const twoFAData: TwoFAResponse = await response.json();
      
      console.log('✅ 2FA verificado com sucesso:', { 
        cpf: twoFAData.cpf,
        status: twoFAData.status,
        finalTokenReceived: !!twoFAData.token,
        finalTokenPreview: twoFAData.token ? `${twoFAData.token.substring(0, 20)}...` : 'AUSENTE'
      });
      
      // Substitui token temporário pelo TOKEN DEFINITIVO
      setToken(twoFAData.token); // Token definitivo para a sessão
      setTempToken(null); // Limpa token temporário
      setRequiresTwoFactor(false);
      setUser({
        cpf: twoFAData.cpf,
        requiresTwoFactor: false
      });
      
      console.log('🎯 Token definitivo configurado - redirecionando para app');
      
      // Navega para tela principal
      router.replace('/main/logs');
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro na verificação 2FA:', error);
      Alert.alert('Erro', `Erro de conexão: ${error}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Fazendo logout...');
      
      // Limpa todos os estados
      setToken(null); // Token definitivo
      setTempToken(null); // Token temporário
      setUser(null);
      setRequiresTwoFactor(false);
      
      console.log('✅ Logout realizado com sucesso');
      
      // Navega para login
      router.replace('/');
      
    } catch (error) {
      console.error('❌ Erro no logout:', error);
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
        return 'Dados inválidos';
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
        return 'Código inválido ou expirado';
      case 401:
        return 'Token temporário inválido. Faça login novamente.';
      case 403:
        return 'Código incorreto';
      case 500:
        return 'Erro interno do servidor';
      default:
        return 'Erro desconhecido. Tente novamente.';
    }
  };

  return (
    <AuthContext.Provider value={{
      token, // Token definitivo para sessão
      tempToken, // Token temporário para 2FA
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

// Hook para requisições autenticadas (usa apenas token definitivo)
export const useAuthenticatedFetch = () => {
  const { token, logout } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    console.log('🔍 useAuthenticatedFetch - Iniciando requisição');
    console.log('🔗 URL:', url);
    console.log('🔑 Token disponível:', token ? `${token.substring(0, 30)}...` : 'NENHUM TOKEN');
    
    if (!token) {
      console.error('❌ Token não disponível para requisição autenticada');
      throw new Error('Token não disponível');
    }

    // Cria headers dinamicamente baseado no tipo de body
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };

    // Se não é FormData, adiciona Content-Type application/json
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Merge com headers customizados (se houver)
    const finalHeaders = {
      ...headers,
      ...options.headers,
    };

    console.log('📤 Headers da requisição:', {
      ...finalHeaders,
      'Authorization': `Bearer ${token.substring(0, 30)}...` // Log parcial do token
    });

    const response = await fetch(url, {
      ...options,
      headers: finalHeaders,
    });

    console.log('📥 Resposta da requisição autenticada:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // Se token expirou, faz logout automático
    if (response.status === 401) {
      console.log('🔒 Token expirado (401), fazendo logout automático');
      await logout();
      throw new Error('Sessão expirada');
    }

    return response;
  };

  return authenticatedFetch;
};