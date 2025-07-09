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
  ActivityIndicator, // ← ADICIONAR
} from 'react-native';
import { cssInterop } from "nativewind";
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from './contexts/AuthContext'; // ← ADICIONAR IMPORT

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

interface Errors {
  cpf?: string;
  password?: string;
}

interface LoginResponse {
  cpf: string;
  requiresTwoFactor: boolean;
  token: string;
}

export default function LoginScreen() {
  const [cpf, setCpf] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberLogin, setRememberLogin] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});
  
  // ← USAR CONTEXT em vez de estados locais
  const { login, isLoading } = useAuth();

  // Configure status bar to match gradient background
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#5583D9');
      StatusBar.setTranslucent(true);
    }
  }, []);

  // Função para formatar CPF
  const formatCPF = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  // Função para validar CPF
  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      return false;
    }

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
  };

  // Função para validar senha
  const validatePassword = (password: string): boolean => {
    const hasMinLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return hasMinLength && hasLetter && hasNumber;
  };

  // Função para validar formulário
  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    // Validação do CPF - DESABILITADA
    if (!cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } 
    // ❌ Validação de CPF desabilitada temporariamente
    // else if (!validateCPF(cpf)) {
    //   newErrors.cpf = 'CPF inválido';
    // }

    // Validação da senha
    if (!password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres, 1 letra e 1 número';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle CPF input change
  const handleCPFChange = (text: string): void => {
    const formattedCPF = formatCPF(text);
    setCpf(formattedCPF);
    
    // Limpa erro do CPF quando usuário começa a digitar
    if (errors.cpf) {
      setErrors(prev => ({ ...prev, cpf: undefined }));
    }
  };

  // Handle password input change
  const handlePasswordChange = (text: string): void => {
    setPassword(text);
    
    // Limpa erro da senha quando usuário começa a digitar
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  // Handle login navigation - SIMPLIFICADO
  const handlelogs = async (): Promise<void> => {
    if (validateForm()) {
      // Usa a função login do Context
      const success = await login(cpf, password);
      
      // Se login foi bem-sucedido, o Context já navega automaticamente
      // Se falhou, o Context já mostra o erro
      if (!success) {
        // Limpa a senha em caso de erro
        setPassword('');
      }
    } else {
      // Mostra primeiro erro encontrado
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Alert.alert('Erro de validação', firstError);
      }
    }
  };

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
          <ScrollView className="flex-1">
            <SafeAreaView className="flex-1 items-center justify-center px-5 py-10">
              <Image
                source={require('./images/coruja.png')}
                className="w-24 h-24 mb-1 mt-20"
                resizeMode="contain"
              />
              <Text className="text-2xl font-bold text-black mb-8">NOCT</Text>
              
              <View className="w-full max-w-md bg-white rounded-lg shadow-lg px-6 py-6 mt-6">
                <Text className="text-xl font-bold text-gray-800 mb-5">
                  Entre na sua conta
                </Text>
                
                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">CPF</Text>
                    <TextInput
                      className={`bg-gray-50 border ${errors.cpf ? 'border-red-500' : 'border-gray-300'} text-gray-900 rounded-lg px-3 py-2.5 w-full`}
                      placeholder="000.000.000-00"
                      placeholderTextColor="#A0AEC0"
                      value={cpf}
                      onChangeText={handleCPFChange}
                      keyboardType="numeric"
                      maxLength={14}
                      autoCapitalize="none"
                    />
                    {errors.cpf && (
                      <Text className="text-red-500 text-xs mt-1">{errors.cpf}</Text>
                    )}
                  </View>
                  
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-5">Senha</Text>
                    <TextInput
                      className={`bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-300'} text-gray-900 rounded-lg px-3 py-2.5 w-full`}
                      placeholder="••••••••"
                      placeholderTextColor="#A0AEC0"
                      value={password}
                      onChangeText={handlePasswordChange}
                      secureTextEntry
                    />
                    {errors.password && (
                      <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>
                    )}
                  </View>
                  
                  <View className="flex-row justify-between items-center mt-5">
                    <View className="flex-row items-center">
                      <Switch
                        value={rememberLogin}
                        onValueChange={setRememberLogin}
                        trackColor={{ false: "#E2E8F0", true: "#7F9CF5" }}
                        thumbColor={rememberLogin ? "#4C51BF" : "#f4f3f4"}
                      />
                      <Text className="ml-2 text-sm text-gray-600">Manter login</Text>
                    </View>
                    <TouchableOpacity>
                      <Text className="text-sm font-medium text-indigo-600">Esqueceu sua senha?</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity
                    className={`w-full ${isLoading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} rounded-lg px-4 py-3 mt-5`}
                    activeOpacity={0.8}
                    onPress={handlelogs}
                    disabled={isLoading} // Desabilita durante loading
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#5a67d8" />
                    ) : (
                      <Text className="text-white text-center font-semibold">Entrar</Text>
                    )}
                  </TouchableOpacity>
                  
                  <View className="flex-row justify-center flex-wrap mt-4">
                    <Text className="text-sm text-gray-600">
                      Não possui uma conta ainda?{' '}
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/register')}>
                      <Text className="text-sm font-medium text-indigo-600">Cadastre-se</Text>
                    </TouchableOpacity>
                  </View>
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