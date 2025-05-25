import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Animated, TouchableWithoutFeedback, TextInput, Button, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { cssInterop } from 'nativewind';

// Interop para permitir o uso de classes Tailwind em componentes React Native
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(Animated.View, { className: 'style' });
cssInterop(TouchableWithoutFeedback, { className: 'style' });

export default function Form() {
  const [formData, setFormData] = useState({
    user_id: "",
    description: "",
    image_url: "",
  });
  const handleChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = () => {
    // Lógica para enviar os dados
    console.log("Formulário enviado:", formData);
  };
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 justify-center items-center p-6 bg-white">
        <Text className="text-2xl font-bold mb-4">Formulário</Text>

        <Text className="self-start mb-1">User ID</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-2 w-full mb-4"
          placeholder="Digite o ID do usuário"
          value={formData.user_id}
          onChangeText={(text) => handleChange("user_id", text)}
        />

        <Text className="self-start mb-1">Descrição</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-2 w-full mb-4"
          placeholder="Digite uma descrição"
          value={formData.description}
          onChangeText={(text) => handleChange("description", text)}
          multiline
          numberOfLines={4}
        />

        <Text className="self-start mb-1">URL da Imagem</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-2 w-full mb-6"
          placeholder="Digite a URL da imagem"
          value={formData.image_url}
          onChangeText={(text) => handleChange("image_url", text)}
        />

        <Button title="Enviar" onPress={handleSubmit} />
      </View>
    </ScrollView>
    </SafeAreaView>
  );
} 
