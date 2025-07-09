// components/Sidebar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, TouchableWithoutFeedback } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { cssInterop } from 'nativewind';
import { router } from 'expo-router';

// Interop for Tailwind classes
cssInterop(Animated.View, { className: 'style' });
cssInterop(TouchableWithoutFeedback, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(View, { className: 'style' });

// Ícone para Operações (Cogs/Settings)
const OperationsIcon = ({ width = 25, height = 20, fill = "#000000" }) => (
  <Svg width={width} height={height} viewBox="0 0 512 512" fill={fill}>
    <Path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/>
  </Svg>
);

// Ícone para Inspetores (Users com distintivo)
const InspectorsIcon = ({ width = 25, height = 20, fill = "#000000" }) => (
  <Svg width={width} height={height} viewBox="0 0 640 512" fill={fill}>
    <Path d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192h42.7c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0H21.3C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7h42.7C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3H405.3zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352H378.7C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7H154.7c-14.7 0-26.7-11.9-26.7-26.7z"/>
  </Svg>
);

// Ícone para Cadastro (User Plus)
const SignUpIcon = ({ width = 25, height = 20, fill = "#000000" }) => (
  <Svg width={width} height={height} viewBox="0 0 640 512" fill={fill}>
    <Path d="M352 128c0 70.7-57.3 128-128 128s-128-57.3-128-128S153.3 0 224 0s128 57.3 128 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24V360H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64z"/>
  </Svg>
);

// Define sidebar menu options type
export type SidebarMenuOption = 'operations' | 'inspectors' | 'signup';

// Define the prop types for the Sidebar component
interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  translateX: Animated.Value;
  overlayOpacity: Animated.Value;
  sidebarWidth: number;
  activeOption: SidebarMenuOption;
  onOptionSelect?: (option: SidebarMenuOption) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  translateX, 
  overlayOpacity, 
  sidebarWidth,
  activeOption,
  onOptionSelect
}) => {
  const closeSidebar = () => {
    if (sidebarOpen) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -sidebarWidth,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setSidebarOpen(false);
    }
  };

  const handleOptionPress = (option: SidebarMenuOption) => {
    if (option === 'signup') {
      router.replace('/register');
    }
    
    if (onOptionSelect) {
      onOptionSelect(option);
    }
    closeSidebar();
  };

  return (
    <>
      {/* Animated Overlay */}
      <Animated.View
        className="absolute w-full h-full bg-black/30 z-30"
        style={{ opacity: overlayOpacity, pointerEvents: sidebarOpen ? 'auto' : 'none' }}
      >
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <View className="w-full h-full" />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Sidebar */}
      <Animated.View
        className="absolute left-0 w-64 h-full bg-gray-50 z-40 shadow-lg mt-7"
        style={{ transform: [{ translateX: translateX }] }}
      >
        <ScrollView className="h-full px-3 py-4">
          <View className="my-2">
            {/* Operações */}
            <TouchableOpacity 
              className={`flex-row items-center p-3 rounded-lg mb-2 ${
                activeOption === 'operations' 
                  ? 'bg-indigo-100 border border-indigo-300' 
                  : 'bg-white hover:bg-slate-100'
              }`}
              onPress={() => handleOptionPress('operations')}
            >
              <OperationsIcon 
                fill={activeOption === 'operations' ? '#4338ca' : '#374151'} 
              />
              <Text 
                className={`ml-3 text-base font-medium flex-1 ${
                  activeOption === 'operations' ? 'text-indigo-700' : 'text-gray-900'
                }`}
              >
                Operações
              </Text>
            </TouchableOpacity> 

            {/* Inspetores */}
            <TouchableOpacity 
              className={`flex-row items-center p-3 rounded-lg mb-2 ${
                activeOption === 'inspectors' 
                  ? 'bg-indigo-100 border border-indigo-300' 
                  : 'bg-white hover:bg-slate-100'
              }`}
              onPress={() => handleOptionPress('inspectors')}
            >
              <InspectorsIcon 
                fill={activeOption === 'inspectors' ? '#4338ca' : '#374151'} 
              />
              <Text 
                className={`ml-3 text-base font-medium flex-1 ${
                  activeOption === 'inspectors' ? 'text-indigo-700' : 'text-gray-900'
                }`}
              >
                Inspetores
              </Text>
            </TouchableOpacity>

            {/* Cadastrar Usuário */}
            <TouchableOpacity 
              className={`flex-row items-center p-3 rounded-lg mb-2 ${
                activeOption === 'signup' 
                  ? 'bg-indigo-100 border border-indigo-300' 
                  : 'bg-white hover:bg-slate-100'
              }`}
              onPress={() => handleOptionPress('signup')}
            >
              <SignUpIcon 
                fill={activeOption === 'signup' ? '#4338ca' : '#374151'} 
              />
              <Text 
                className={`ml-3 text-base font-medium flex-1 ${
                  activeOption === 'signup' ? 'text-indigo-700' : 'text-gray-900'
                }`}
              >
                Cadastrar Usuário
              </Text>
            </TouchableOpacity>
            
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );
};

export default Sidebar;