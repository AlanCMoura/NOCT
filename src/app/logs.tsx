import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Animated, TextInput, FlatList, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { cssInterop } from 'nativewind';
import sombra from "./images/style";
import users from "./results";
import ListItem from "./components/operations";
import FilterButton from './components/filter';
import Sidebar from './components/sidebar';
import { router } from 'expo-router';
import ItemDetailModal from './components/details';

// Interop para permitir o uso de classes Tailwind em componentes React Native
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(Animated.View, { className: 'style' });

// Define the type for search field
type SearchField = 'operacao' | 'container';

// Define a type for your user items if not already defined elsewhere
interface UserItem {
  operacao: string;
  container: string;
  qtde_fotos: string;
  // Add other properties from your users object as needed
  [key: string]: any;
}

export default function Logs() {
  const [searchField, setSearchField] = useState<SearchField>('operacao');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const translateX = useRef(new Animated.Value(-256)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sidebarWidth = 256;
  const [searchText, setSearchText] = useState<string>('');
  const [list, setList] = useState<UserItem[]>(users);
  
  // Estados para o modal
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<UserItem | null>(null);
  
  // Efeito para filtrar lista baseado no texto de busca
  useEffect(() => {
    if (searchText === '') {
      setList(users);
    } else {
      const filteredList = users.filter((item) => {
        const fieldValue = item[searchField];
        // Verificação adicional para garantir que o campo existe e é uma string
        return fieldValue && 
               typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().includes(searchText.toLowerCase());
      });
      setList(filteredList);
    }
  }, [searchText, searchField]);
  
  // Inicialização do sidebar
  useEffect(() => {
    translateX.setValue(-sidebarWidth);
    overlayOpacity.setValue(0);
  }, []);
  
  /* sidebar effect */
  const toggleSidebar = () => {
    const newSidebarState = !sidebarOpen;
    
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: newSidebarState ? 0 : -sidebarWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: newSidebarState ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setSidebarOpen(newSidebarState);
  };

  const handleForm = () => {
    router.push('/form');
  };
  
  // Função para abrir o modal com os detalhes do item
  const handleItemPress = (item: UserItem) => {
    setSelectedItem(item);
    setIsModalVisible(true);
  };
  
  // Função para fechar o modal
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedItem(null); // Limpa o item selecionado
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 flex-col">
        {/* Header */}
        <View className='w-full h-28 bg-indigo-400 shadow-lg' style={sombra.shadow}>
          <TouchableOpacity
            className="absolute p-2 mt-12 ml-3 z-10"
            onPress={toggleSidebar}
          >
            <Svg width={30} height={30} viewBox="0 0 20 20" fill="#000000">
              <Path d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Sidebar Component */}
        <Sidebar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          translateX={translateX}
          overlayOpacity={overlayOpacity}
          sidebarWidth={sidebarWidth}
          activeOption="operations"
        />

        {/* Search Bar */}
        <View className='ml-2 mt-6 bg-white w-full flex-row items-center'>
          <TextInput
            placeholder={`Pesquise por ${searchField === 'operacao' ? 'operação' : 'container'}`}
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
            className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 flex-1 mr-4 ml-7"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          />
          <View className="mr-4">
            <FilterButton
              onFilterChange={setSearchField}
              currentFilterField={searchField}
            />
          </View>
        </View>

        {/* Lista */}
        <View className='bg-white w-full flex-1 items-center mt-4'>
          <FlatList
            data={list}
            renderItem={({ item }) => (
              <ListItem 
                data={item} 
                onPress={handleItemPress}
              />
            )}
            keyExtractor={(item, index) => `${item.operacao}-${index}`}
            className="flex-1 w-full"
            contentContainerStyle={{ paddingBottom: 100 }} // Espaço para o botão flutuante
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListEmptyComponent={() => (
              <View className="items-center justify-center p-8">
                <Text className="text-gray-500 text-base">Nenhum resultado encontrado</Text>
              </View>
            )}
          />
        </View>
        
        {/* Modal de Detalhes */}
        {selectedItem && (
          <ItemDetailModal
            isVisible={isModalVisible}
            onClose={handleCloseModal}
            item={selectedItem}
          />
        )}
        
        {/* Botão Flutuante */}
        <TouchableOpacity style={styles.floatingButton} onPress={handleForm}>
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#4f46e5',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});