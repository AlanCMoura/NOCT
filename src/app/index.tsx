import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { cssInterop } from "nativewind";
import { useAuth } from './contexts/_AuthContext';
import TwoFactorModal from './components/TwoFactorModal';
import CustomStatusBar from './components/StatusBar'; // Importando o componente CustomStatusBar

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

interface Errors {
  cpf?: string;
  password?: string;
}

export default function LoginScreen() {
  const [cpf, setCpf] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberLogin, setRememberLogin] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});
  
  // Hook de autenticação
  const { login, isLoading, requiresTwoFactor } = useAuth();

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
    const hasMinLength = password.length >= 6; // Reduzido para 6 caracteres
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return hasMinLength && hasLetter && hasNumber;
  };

  // Função para validar formulário
  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    // Validação do CPF - COMENTADA TEMPORARIAMENTE
    if (!cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } 
    // ❌ Validação de CPF comentada para testes
    // else if (!validateCPF(cpf)) {
    //   newErrors.cpf = 'CPF inválido';
    // }

    // Validação da senha
    if (!password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres, 1 letra e 1 número';
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

  // Toggle password visibility
  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };

  // Eye icon component
  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {visible ? (
        // Eye open icon
        <>
          <Path
            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            stroke="#6D7380"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
            stroke="#6D7380"
            strokeWidth="2"
            fill="none"
          />
        </>
      ) : (
        // Eye closed icon (eye with slash)
        <>
          <Path
            d="M9.88 9.88a3 3 0 1 0 4.24 4.24"
            stroke="#6D7380"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M10.73 5.08A11 11 0 0 1 12 5c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68"
            stroke="#6D7380"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 8 11 8a9.74 9.74 0 0 0 5.39-1.61"
            stroke="#6D7380"
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M2 2l20 20"
            stroke="#6D7380"
            strokeWidth="2"
            fill="none"
          />
        </>
      )}
    </Svg>
  );

  // Handle login
  const handleLogin = async (): Promise<void> => {
    if (validateForm()) {
      const success = await login(cpf, password);
      
      if (!success) {
        // Limpa a senha em caso de erro
        setPassword('');
      }
      // Se requiresTwoFactor for true, o modal abrirá automaticamente
    } else {
      // Mostra primeiro erro encontrado
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Alert.alert('Erro de validação', firstError);
      }
    }
  };

  // Handle close 2FA modal
  const handleClose2FAModal = (): void => {
    // O modal 2FA já lida com o logout quando necessário
    // Aqui só precisamos limpar o formulário
    setPassword('');
  };

  return (
    <View className="flex-1">
      {/* Usando o CustomStatusBar com configurações específicas */}
      <CustomStatusBar 
        barStyle="dark-content"
        backgroundColor="#6D7380"
        translucent={true}
      />
      
      <View className="flex-1" style={{ backgroundColor: '#F8F9FA' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView className="flex-1">
              <SafeAreaView className="flex-1 items-center justify-center px-5 py-10">
                <Image
                  source={require('./components/icons/logo.png')}
                  className="w-96 h-64 mt-10 ml-4"
                  resizeMode="contain"
                />                
                <View className="w-96 max-w-md bg-white rounded-3xl shadow-lg px-6 py-6">
                  <Text className="text-xl font-bold text-gray-800 mb-5">
                    Entre na sua conta
                  </Text>
                  
                  <View className="space-y-4">
                    <View>
                      <Text className="text-sm font-medium" style={{ color: '#2A2E40' }}>CPF</Text>
                      <TextInput
                        className={`bg-gray-50 border ${errors.cpf ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2.5 w-full mt-2`}
                        style={{ color: '#2A2E40' }}
                        placeholder="000.000.000-00"
                        placeholderTextColor="#6D7380"
                        value={cpf}
                        onChangeText={handleCPFChange}
                        keyboardType="numeric"
                        maxLength={14}
                        autoCapitalize="none"
                        editable={!isLoading}
                      />
                      {errors.cpf && (
                        <Text className="text-red-500 text-xs mt-1">{errors.cpf}</Text>
                      )}
                    </View>
                    
                    <View>
                      <Text className="text-sm font-medium mt-5 mb-2" style={{ color: '#2A2E40' }}>Senha</Text>
                      <View className="relative">
                        <TextInput
                          className={`bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2.5 pr-12 w-full`}
                          style={{ color: '#2A2E40' }}
                          placeholder="••••••••"
                          placeholderTextColor="#6D7380"
                          value={password}
                          onChangeText={handlePasswordChange}
                          secureTextEntry={!showPassword}
                          editable={!isLoading}
                        />
                        <TouchableOpacity
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onPress={togglePasswordVisibility}
                          disabled={isLoading}
                          style={{ 
                            top: '50%', 
                            transform: [{ translateY: -10 }]
                          }}
                        >
                          <EyeIcon visible={showPassword} />
                        </TouchableOpacity>
                      </View>
                      {errors.password && (
                        <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>
                      )}
                    </View>
                    
                    <View className="flex-row justify-between items-center mt-5">
                      <View className="flex-row items-center">
                        <Switch
                          value={rememberLogin}
                          onValueChange={setRememberLogin}
                          trackColor={{ false: "#E2E8F0", true: "#49C5B6" }} // Verde-água da paleta
                          thumbColor={rememberLogin ? "#5046E5" : "#f4f3f4"} // Cor principal da paleta
                          disabled={isLoading}
                        />
                        <Text className="ml-2 text-sm" style={{ color: '#6D7380' }}>Manter login</Text>
                      </View>
                      <TouchableOpacity disabled={isLoading}>
                        <Text className="text-sm font-medium" style={{ color: '#49C5B6' }}>
                          Esqueceu sua senha?
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity
                      className={`w-full rounded-lg px-4 py-3 mt-5 mb-1`}
                      style={{ 
                        backgroundColor:'#49C5B6', // Verde-água como cor principal do botão
                        opacity: isLoading ? 0.7 : 1
                      }}
                      activeOpacity={0.8}
                      onPress={handleLogin}
                      disabled={isLoading}
                    >
                        <View className="flex-row justify-center items-center">
                          <Text className="text-white font-semibold">Entrar</Text>
                        </View>
                      
                    </TouchableOpacity>
                  </View>
                </View>
              </SafeAreaView>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>

      {/* Modal 2FA */}
      <TwoFactorModal 
        isVisible={requiresTwoFactor}
        onClose={handleClose2FAModal}
      />
    </View>
  );
}