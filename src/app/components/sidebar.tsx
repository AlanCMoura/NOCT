// components/Sidebar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, TouchableWithoutFeedback } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { cssInterop } from 'nativewind';

// Interop for Tailwind classes
cssInterop(Animated.View, { className: 'style' });
cssInterop(TouchableWithoutFeedback, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(View, { className: 'style' });

const KanbanIcon = () => (
  <Svg width={20} height={25} viewBox="3 0 20 20" fill="#000000">
    <Path
      fillRule="evenodd"
      d="M8 3a1 1 0 011-1h6a1 1 0 011 1h2a2 2 0 012 2v15a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h2zm6 1h-4v2H9a1 1 0 000 2h6a1 1 0 100-2h-1V4zm-3 8a1 1 0 011-1h3a1 1 0 110 2h-3a1 1 0 01-1-1zm-2-1a1 1 0 100 2h.01a1 1 0 100-2H9zm2 5a1 1 0 011-1h3a1 1 0 110 2h-3a1 1 0 01-1-1zm-2-1a1 1 0 100 2h.01a1 1 0 100-2H9z"
      clipRule="evenodd"
    />
  </Svg>
);

const SignUpIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="#000000">
    <Path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.96 2.96 0 0 0 .13 5H5Z" />
    <Path d="M6.737 11.061a2.961 2.961 0 0 1 .81-1.515l6.117-6.116A4.839 4.839 0 0 1 16 2.141V2a1.97 1.97 0 0 0-1.933-2H7v5a2 2 0 0 1-2 2H0v11a1.969 1.969 0 0 0 1.933 2h12.134A1.97 1.97 0 0 0 16 18v-3.093l-1.546 1.546c-.413.413-.94.695-1.513.81l-3.4.679a2.947 2.947 0 0 1-1.85-.227 2.96 2.96 0 0 1-1.635-3.257l.681-3.397Z" />
    <Path d="M8.961 16a.93.93 0 0 0 .189-.019l3.4-.679a.961.961 0 0 0 .49-.263l6.118-6.117a2.884 2.884 0 0 0-4.079-4.078l-6.117 6.117a.96.96 0 0 0-.263.491l-.679 3.4A.961.961 0 0 0 8.961 16Zm7.477-9.8a.958.958 0 0 1 .68-.281.961.961 0 0 1 .682 1.644l-.315.315-1.36-1.36.313-.318Zm-5.911 5.911 4.236-4.236 1.359 1.359-4.236 4.237-1.7.339.341-1.699Z" />
  </Svg>
);

const Users = ({ width = 20, height = 20, fill = "#000000" }) => (
  <Svg width={width} height={height} viewBox="0 0 512 512" fill={fill}>
    <Path d="M256 288c79.5 0 144-64.5 144-144S335.5 0 256 0 112 64.5 112 144s64.5 144 144 144zm128 32h-55.1c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16H128C57.3 320 0 377.3 0 448v16c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48v-16c0-70.7-57.3-128-128-128z" />
  </Svg>
);
// Define sidebar menu options type
export type SidebarMenuOption = 'operations' | 'signup';

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
              <KanbanIcon />
              <Text 
                className={`ml-3 text-base font-medium flex-1 ${
                  activeOption === 'operations' ? 'text-indigo-700' : 'text-gray-900'
                }`}
              >
                Operações
              </Text>
            </TouchableOpacity> 
            {/* Users */}
            <TouchableOpacity 
              className={`flex-row items-center p-3 rounded-lg mb-2 ${
                activeOption === 'signup' 
                  ? 'bg-indigo-100 border border-indigo-300' 
                  : 'bg-white hover:bg-slate-100'
              }`}
              onPress={() => handleOptionPress('signup')}
            >
              <Users />
              <Text 
                className={`ml-3 text-base font-medium flex-1 ${
                  activeOption === 'signup' ? 'text-indigo-700' : 'text-gray-900'
                }`}
              >
                Inspetores
              </Text>
            </TouchableOpacity>
            {/* Sign Up */}
            <TouchableOpacity 
              className={`flex-row items-center p-3 rounded-lg mb-2 ${
                activeOption === 'signup' 
                  ? 'bg-indigo-100 border border-indigo-300' 
                  : 'bg-white hover:bg-slate-100'
              }`}
              onPress={() => handleOptionPress('signup')}
            >
              <SignUpIcon />
              <Text 
                className={`ml-3 text-base font-medium flex-1 ${
                  activeOption === 'signup' ? 'text-indigo-700' : 'text-gray-900'
                }`}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
            
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );
};

export default Sidebar;