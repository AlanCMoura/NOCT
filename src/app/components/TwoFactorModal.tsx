import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { cssInterop } from "nativewind";
import { Svg, Path } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext'; // Ajuste o caminho

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
cssInterop(Modal, {
  className: {
    target: "style",
  },
});

// Componente para ícone de fechar
const CloseIcon: React.FC = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2}>
    <Path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface TwoFactorModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function TwoFactorModal({ isVisible, onClose }: TwoFactorModalProps) {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Referências para os inputs
  const inputRefs = useRef<(TextInput | null)[]>([]);
  
  // Hooks do contexto de autenticação
  const { verifyTwoFactor, isLoading, user, tempToken, logout } = useAuth();

  // Limpa código quando modal abre
  useEffect(() => {
    if (isVisible) {
      setCode(['', '', '', '', '', '']);
      setCurrentIndex(0);
      setIsSubmitting(false);
      
      // Foca no primeiro input após um delay
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Handle input change
  const handleInputChange = (value: string, index: number): void => {
    // Aceita apenas números
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Move para próximo input se digitou um número
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setCurrentIndex(index + 1);
    }
  };

  // Handle key press (backspace)
  const handleKeyPress = (key: string, index: number): void => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      // Move para input anterior se backspace em campo vazio
      inputRefs.current[index - 1]?.focus();
      setCurrentIndex(index - 1);
    }
  };

  // Handle paste (cola código completo)
  const handlePaste = (pastedText: string): void => {
    const numbers = pastedText.replace(/\D/g, '').slice(0, 6);
    const newCode = Array(6).fill('');
    
    for (let i = 0; i < numbers.length; i++) {
      newCode[i] = numbers[i];
    }
    
    setCode(newCode);
    
    // Foca no próximo input vazio ou no último
    const nextEmptyIndex = newCode.findIndex(c => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
    setCurrentIndex(focusIndex);
  };

  // Validar se código está completo
  const isCodeComplete = (): boolean => {
    return code.every(digit => digit !== '');
  };

  // Handle verification
  const handleVerification = async (): Promise<void> => {
    if (!isCodeComplete()) {
      Alert.alert('Código Incompleto', 'Digite o código de 6 dígitos.');
      return;
    }

    setIsSubmitting(true);
    
    const fullCode = code.join('');
    console.log('🔢 Código digitado:', fullCode);
    
    try {
      const success = await verifyTwoFactor(fullCode);
      
      if (success) {
        // Modal será fechado automaticamente quando isVisible mudar
        onClose();
      } else {
        // Limpa o código em caso de erro
        setCode(['', '', '', '', '', '']);
        setCurrentIndex(0);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('❌ Erro na verificação:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close modal
  const handleClose = (): void => {
    Alert.alert(
      'Cancelar Verificação',
      'Tem certeza que deseja cancelar? Você precisará fazer login novamente.',
      [
        {
          text: 'Continuar Verificação',
          style: 'cancel'
        },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: () => {
            logout();
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full px-5"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="bg-white rounded-xl shadow-lg max-w-md w-full mx-auto" style={styles.modalContainer}>
              
              {/* Header */}
              <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
                <Text className="text-xl font-bold text-gray-800">
                  Verificação 2FA
                </Text>
                <TouchableOpacity onPress={handleClose} className="p-1">
                  <CloseIcon />
                </TouchableOpacity>
              </View>
              
              {/* Content */}
              <View className="p-6">
                <Text className="text-sm text-gray-600 text-center mb-6 leading-5">
                  Enviamos um código de 6 dígitos para o email cadastrado do CPF{' '}
                  <Text className="font-medium text-gray-800">{user?.cpf}</Text>
                </Text>
                
                {/* Inputs do código */}
                <View className="flex-row justify-between mb-6">
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      className={`w-12 h-12 border-2 ${
                        currentIndex === index ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                      } rounded-lg text-center text-lg font-bold text-gray-800`}
                      value={digit}
                      onChangeText={(value) => handleInputChange(value, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      onFocus={() => setCurrentIndex(index)}
                      keyboardType="numeric"
                      maxLength={1}
                      selectTextOnFocus
                      editable={!isSubmitting && !isLoading}
                      style={{
                        shadowColor: currentIndex === index ? '#4F46E5' : '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: currentIndex === index ? 0.1 : 0.05,
                        shadowRadius: 2,
                        elevation: currentIndex === index ? 2 : 1,
                      }}
                    />
                  ))}
                </View>
                
                {/* Indicador de progresso */}
                <View className="flex-row justify-center mb-4">
                  <Text className="text-xs text-gray-500">
                    {code.filter(d => d).length}/6 dígitos
                  </Text>
                </View>
                
                {/* Botão de verificar */}
                <TouchableOpacity
                  className={`w-full rounded-lg px-4 py-4 mb-4 ${
                    isSubmitting || isLoading || !isCodeComplete()
                      ? 'bg-gray-300' 
                      : 'bg-indigo-600'
                  }`}
                  activeOpacity={0.8}
                  onPress={handleVerification}
                  disabled={isSubmitting || isLoading || !isCodeComplete()}
                  style={styles.buttonShadow}
                >
                  {isSubmitting || isLoading ? (
                    <View className="flex-row justify-center items-center">
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text className="text-white font-semibold ml-2">Verificando...</Text>
                    </View>
                  ) : (
                    <Text className="text-white text-center font-semibold text-base">
                      Verificar Código
                    </Text>
                  )}
                </TouchableOpacity>
                
                {/* Link para reenviar código */}
                <TouchableOpacity 
                  className="w-full py-2"
                  onPress={() => {
                    Alert.alert('Reenviar Código', 'Funcionalidade em desenvolvimento');
                  }}
                  disabled={isSubmitting || isLoading}
                >
                  <Text className="text-indigo-600 text-center font-medium">
                    Não recebeu o código? Reenviar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  buttonShadow: {
    elevation: 3,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  }
});