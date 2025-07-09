import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Switch,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { cssInterop } from "nativewind";
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { useAuth, useAuthenticatedFetch } from './contexts/AuthContext'; // Ajuste o caminho

// Aplicando cssInterop para todos os componentes que vamos estilizar
cssInterop(Text, {
  className: {
    target: "style",
  },
});
cssInterop(View, {
  className: {
    target: "style",
  },
});
cssInterop(TextInput, {
  className: {
    target: "style",
  },
});
cssInterop(TouchableOpacity, {
  className: {
    target: "style",
  },
});
cssInterop(Image, {
  className: {
    target: "style",
  },
});
cssInterop(SafeAreaView, {
  className: {
    target: "style",
  },
});
cssInterop(ScrollView, {
  className: {
    target: "style",
  },
});
cssInterop(KeyboardAvoidingView, {
  className: {
    target: "style",
  },
});
cssInterop(LinearGradient, {
  className: {
    target: "style",
  },
});

// Configuração da API - mesma URL do AuthContext
const API_BASE_URL = 'http://containerview-prod.us-east-1.elasticbeanstalk.com';

export default function RegisterScreen() {
  // Estados do formulário
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [cpf, setCpf] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [role, setRole] = useState<string>('INSPETOR');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Hooks do contexto de autenticação
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  // Verificação de autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      Alert.alert(
        'Acesso Negado',
        'Você precisa estar logado para cadastrar novos usuários.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/main/logs') // Redireciona para login
          }
        ]
      );
    }
  }, [isAuthenticated, authLoading]);

  // Configure status bar to match gradient background
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#5583D9');
      StatusBar.setTranslucent(true);
    }
  }, []);

  // Format CPF input
  const formatCPF = (value: string): string => {
    // Remove tudo que não é número
    const numericValue = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedValue = numericValue.slice(0, 11);
    
    // Aplica a formatação progressiva
    if (limitedValue.length <= 3) {
      return limitedValue;
    } else if (limitedValue.length <= 6) {
      return limitedValue.replace(/(\d{3})(\d+)/, '$1.$2');
    } else if (limitedValue.length <= 9) {
      return limitedValue.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    } else {
      return limitedValue.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
    }
  };

  const handleCPFChange = (value: string): void => {
    const formatted = formatCPF(value);
    setCpf(formatted);
  };

  // Validate CPF (algoritmo básico)
  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  };

  // Validate email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Erro', 'Sobrenome é obrigatório');
      return false;
    }
    if (!validateCPF(cpf)) {
      Alert.alert('Erro', 'CPF inválido');
      return false;
    }
    if (!email.trim() || !validateEmail(email)) {
      Alert.alert('Erro', 'Email válido é obrigatório');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Erro', 'Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'Senhas não coincidem');
      return false;
    }
    return true;
  };

  // Map HTTP status to error messages
  const getErrorMessage = (status: number): string => {
    switch (status) {
      case 400:
        return 'CPF já cadastrado ou dados inválidos';
      case 401:
        return 'Não autorizado. Faça login novamente.';
      case 403:
        return 'Você não tem permissão para cadastrar usuários';
      case 409:
        return 'Usuário já existe';
      case 500:
        return 'Erro interno do servidor';
      default:
        return 'Erro desconhecido. Tente novamente.';
    }
  };

  // Clear form
  const clearForm = (): void => {
    setFirstName('');
    setLastName('');
    setCpf('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('INSPETOR');
    setTwoFactorEnabled(false);
  };

  // Handle registration
  const handleRegister = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      cpf: cpf,
      email: email.trim().toLowerCase(),
      password,
      role,
      twoFactorEnabled
    };
    
    try {
      console.log('🔄 Iniciando cadastro de usuário...');
      console.log('👤 Usuário logado:', user?.cpf);
      console.log('📝 Dados enviados:', { ...userData, password: '***' });
      
      const response = await authenticatedFetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      console.log('📡 Status da resposta:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Usuário cadastrado com sucesso:', result);
        
        Alert.alert(
          'Sucesso', 
          'Usuário cadastrado com sucesso!',
          [
            {
              text: 'Cadastrar Outro',
              style: 'default',
              onPress: () => clearForm()
            },
            {
              text: 'Voltar',
              style: 'cancel',
              onPress: () => router.replace('/main/logs')
            }
          ]
        );
      } else {
        const errorMessage = getErrorMessage(response.status);
        console.log('❌ Erro no cadastro:', response.status, errorMessage);
        Alert.alert('Erro', errorMessage);
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      
      if (error instanceof Error && error.message === 'Sessão expirada') {
        Alert.alert(
          'Sessão Expirada',
          'Sua sessão expirou. Você será redirecionado para o login.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/main/logs')
            }
          ]
        );
      } else {
        Alert.alert('Erro', 'Erro de conexão. Verifique sua internet e tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while checking authentication
  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-blue-500">
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="text-white mt-4">Verificando autenticação...</Text>
      </View>
    );
  }

  // If not authenticated, don't render the form
  if (!isAuthenticated) {
    return null;
  }

  return (
    <View className="flex-1">
      <StatusBar />
      <LinearGradient
        colors={['#5583D9', '#5578D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <SafeAreaView className="flex-1 items-center justify-center px-5 py-10">
                <Image
                  source={require('./images/coruja.png')}
                  className="w-24 h-24 mb-1 mt-10"
                  resizeMode="contain"
                />
                <Text className="text-2xl font-bold text-black mb-2">NOCT</Text>
                
                {/* Header com informações do usuário logado */}
                <View className="bg-white/20 rounded-lg px-4 py-2 mb-4">
                  <Text className="text-white text-sm text-center">
                    Logado como: {user?.cpf}
                  </Text>
                </View>
                
                <View className="w-full max-w-md bg-white rounded-lg shadow-lg px-6 py-6">
                  <Text className="text-xl font-bold text-gray-800 mb-5">
                    Cadastrar Novo Usuário
                  </Text>
                  
                  <View className="space-y-4">
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Nome</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 w-full"
                        placeholder="Digite o nome"
                        placeholderTextColor="#A0AEC0"
                        value={firstName}
                        onChangeText={(text: string) => setFirstName(text)}
                        autoCapitalize="words"
                        editable={!isSubmitting}
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2 mt-3">Sobrenome</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 w-full"
                        placeholder="Digite o sobrenome"
                        placeholderTextColor="#A0AEC0"
                        value={lastName}
                        onChangeText={(text: string) => setLastName(text)}
                        autoCapitalize="words"
                        editable={!isSubmitting}
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2 mt-3">CPF</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 w-full"
                        placeholder="000.000.000-00"
                        placeholderTextColor="#A0AEC0"
                        value={cpf}
                        onChangeText={handleCPFChange}
                        keyboardType="numeric"
                        maxLength={14}
                        editable={!isSubmitting}
                      />
                    </View>
                    
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2 mt-3">Email</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 w-full"
                        placeholder="nome@exemplo.com"
                        placeholderTextColor="#A0AEC0"
                        value={email}
                        onChangeText={(text: string) => setEmail(text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isSubmitting}
                      />
                    </View>
                    
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2 mt-3">Senha</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 w-full"
                        placeholder="••••••••"
                        placeholderTextColor="#A0AEC0"
                        value={password}
                        onChangeText={(text: string) => setPassword(text)}
                        secureTextEntry
                        editable={!isSubmitting}
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2 mt-3">Confirmar Senha</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 w-full"
                        placeholder="••••••••"
                        placeholderTextColor="#A0AEC0"
                        value={confirmPassword}
                        onChangeText={(text: string) => setConfirmPassword(text)}
                        secureTextEntry
                        editable={!isSubmitting}
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2 mt-3">Função</Text>
                      <View className="bg-gray-50 border border-gray-300 rounded-lg">
                        <Picker
                          selectedValue={role}
                          onValueChange={(itemValue: string) => setRole(itemValue)}
                          style={{ height: 50 }}
                          enabled={!isSubmitting}
                        >
                          <Picker.Item label="Inspetor" value="INSPETOR" />
                          <Picker.Item label="Administrador" value="ADMIN" />
                          <Picker.Item label="Gerente" value="MANAGER" />
                        </Picker>
                      </View>
                    </View>
                    
                    <View className="flex-row justify-between items-center mt-5">
                      <View className="flex-row items-center">
                        <Switch
                          value={twoFactorEnabled}
                          onValueChange={(value: boolean) => setTwoFactorEnabled(value)}
                          trackColor={{ false: "#E2E8F0", true: "#7F9CF5" }}
                          thumbColor={twoFactorEnabled ? "#4C51BF" : "#f4f3f4"}
                          disabled={isSubmitting}
                        />
                        <Text className="ml-2 text-sm text-gray-600">
                          Habilitar autenticação de dois fatores
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      className={`w-full rounded-lg px-4 py-3 mt-5 ${
                        isSubmitting 
                          ? 'bg-gray-400' 
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                      activeOpacity={0.8}
                      onPress={handleRegister}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <View className="flex-row justify-center items-center">
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text className="text-white font-semibold ml-2">Cadastrando...</Text>
                        </View>
                      ) : (
                        <Text className="text-white text-center font-semibold">Cadastrar Usuário</Text>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      className="w-full bg-gray-500 hover:bg-gray-600 rounded-lg px-4 py-3 mt-3"
                      activeOpacity={0.8}
                      onPress={() => router.replace('/main/logs')}
                      disabled={isSubmitting}
                    >
                      <Text className="text-white text-center font-semibold">Voltar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </SafeAreaView>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}