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
} from 'react-native';
import { cssInterop } from "nativewind";
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';

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

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [cpf, setCpf] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [role, setRole] = useState<string>('INSPETOR');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);

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
    const numericValue = value.replace(/\D/g, '');
    const formattedValue = numericValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
    return formattedValue;
  };

  const handleCPFChange = (value: string): void => {
    const formatted = formatCPF(value);
    setCpf(formatted);
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
    if (cpf.replace(/\D/g, '').length !== 11) {
      Alert.alert('Erro', 'CPF deve ter 11 dígitos');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
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

  // Handle registration
  const handleRegister = async (): Promise<void> => {
    if (validateForm()) {
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        cpf: cpf.replace(/\D/g, ''),
        email: email.trim().toLowerCase(),
        password,
        role,
        twoFactorEnabled
      };
      
      try {
        // Ajuste a URL base conforme seu ambiente
        const API_BASE_URL = __DEV__ 
          ? 'http://10.0.2.2:8080' // Android Emulator
          : 'http://localhost:8080'; // iOS Simulator
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Usuário cadastrado:', result);
          Alert.alert(
            'Sucesso', 
            'Usuário cadastrado com sucesso!',
            [
              {
                text: 'OK',
                onPress: () => router.push('/') // Volta para tela de login
              }
            ]
          );
        } else {
          const errorData = await response.json().catch(() => ({}));
          Alert.alert('Erro', errorData.message || 'Erro ao cadastrar usuário. Tente novamente.');
        }
      } catch (error) {
        console.error('Erro na requisição:', error);
        Alert.alert('Erro', 'Erro de conexão. Verifique se a API está rodando e tente novamente.');
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
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <SafeAreaView className="flex-1 items-center justify-center px-5 py-10">
                <Image
                  source={require('./images/coruja.png')}
                  className="w-24 h-24 mb-1 mt-10"
                  resizeMode="contain"
                />
                <Text className="text-2xl font-bold text-black mb-8">NOCT</Text>
                
                <View className="w-full max-w-md bg-white rounded-lg shadow-lg px-6 py-6 mt-6">
                  <Text className="text-xl font-bold text-gray-800 mb-5">
                    Criar nova conta
                  </Text>
                  
                  <View className="space-y-4">
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Nome</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 w-full"
                        placeholder="Digite seu nome"
                        placeholderTextColor="#A0AEC0"
                        value={firstName}
                        onChangeText={(text: string) => setFirstName(text)}
                        autoCapitalize="words"
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2 mt-3">Sobrenome</Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 w-full"
                        placeholder="Digite seu sobrenome"
                        placeholderTextColor="#A0AEC0"
                        value={lastName}
                        onChangeText={(text: string) => setLastName(text)}
                        autoCapitalize="words"
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
                      />
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2 mt-3">Função</Text>
                      <View className="bg-gray-50 border border-gray-300 rounded-lg">
                        <Picker
                          selectedValue={role}
                          onValueChange={(itemValue: string) => setRole(itemValue)}
                          style={{ height: 50 }}
                        >
                          <Picker.Item label="Inspetor" value="INSPETOR" />
                          <Picker.Item label="Administrador" value="ADMIN" />
                          <Picker.Item label="Usuário" value="USER" />
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
                        />
                        <Text className="ml-2 text-sm text-gray-600">
                          Habilitar autenticação de dois fatores
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-3 mt-5"
                      activeOpacity={0.8}
                      onPress={handleRegister}
                    >
                      <Text className="text-white text-center font-semibold">Cadastrar</Text>
                    </TouchableOpacity>
                    
                    <View className="flex-row justify-center flex-wrap mt-4">
                      <Text className="text-sm text-gray-600">
                        Já possui uma conta?{' '}
                      </Text>
                      <TouchableOpacity onPress={() => router.push('/')}>
                        <Text className="text-sm font-medium text-indigo-600">Faça login</Text>
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