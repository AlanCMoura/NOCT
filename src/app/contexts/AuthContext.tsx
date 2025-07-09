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
  token: string;
}

interface AuthContextType {
  // Estados
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Funções
  login: (cpf: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configurações da API
const API_BASE_URL = 'http://containerview-prod.us-east-1.elasticbeanstalk.com';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Começa como false

  // Função de login (sem persistência)
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
          cpf: cpf,
          password: password
        })
      });

      if (!response.ok) {
        const errorMessage = getErrorMessage(response.status);
        Alert.alert('Erro de Login', errorMessage);
        return false;
      }

      const loginData: LoginResponse = await response.json();
      
      // Salva apenas no estado (memória) - NÃO persiste
      setToken(loginData.token);
      setUser({
        cpf: loginData.cpf,
        requiresTwoFactor: loginData.requiresTwoFactor
      });
      
      console.log('✅ Login realizado com sucesso');
      console.log('🔑 Token capturado:', loginData.token);
      
      // Navega para tela principal
      router.replace('/main/logs');
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      Alert.alert('Erro', 'Erro de conexão.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout (só limpa estado)
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Fazendo logout...');
      
      // Limpa apenas o estado (não há AsyncStorage para limpar)
      setToken(null);
      setUser(null);
      
      console.log('✅ Logout realizado com sucesso');
      
      // Navega para login
      router.replace('/');
      
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mapeia status HTTP para mensagens de erro
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

  return (
    <AuthContext.Provider value={{
      token,
      user,
      isAuthenticated: !!token,
      isLoading,
      login,
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

// Hook para requisições autenticadas
export const useAuthenticatedFetch = () => {
  const { token, logout } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('Token não disponível');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Se token expirou, faz logout automático
    if (response.status === 401) {
      console.log('🔒 Token expirado, fazendo logout automático');
      await logout();
      throw new Error('Sessão expirada');
    }

    return response;
  };

  return authenticatedFetch;
};