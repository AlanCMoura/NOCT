import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Animated, TextInput, FlatList, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { cssInterop } from 'nativewind';
import sombra from "../images/style";
import ListItem from "../components/Operations";
import FilterButton from '../components/Filter';
import Sidebar from '../components/Sidebar';
import { router } from 'expo-router';
import ItemDetailModal from '../components/Details';
import { useAuth, useAuthenticatedFetch } from '../contexts/_AuthContext';
import CustomStatusBar from '../components/StatusBar'; // Importando o componente CustomStatusBar

// Interop para permitir o uso de classes Tailwind em componentes React Native
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(Animated.View, { className: 'style' });

// Define o tipo para search field
type SearchField = 'id' | 'containerId';

// Interface para User baseada na resposta real da API
interface User {
  id: number;
  firstName: string;
  lastName: string;
  cpf: string;
  email: string;
  password: string;
  role: string;
  twoFactorEnabled: boolean;
}

// Interface para Container baseada na resposta real da API
interface Container {
  id: string;
  description: string;
  images: string[];
}

// Interface para OperationItem baseada na resposta REAL da API
interface OperationItem {
  id: number;
  container: Container; // ← Objeto container completo
  user: User; // ← Objeto user completo (já vem na resposta)
  createdAt: string;
  
  // Campo calculado para compatibilidade
  qtde_fotos: number;
  
  // Índice para compatibilidade com o componente ListItem
  [key: string]: any;
}

// Configuração da API
const API_BASE_URL = 'http://containerview-prod.us-east-1.elasticbeanstalk.com';

export default function Logs() {
  const [searchField, setSearchField] = useState<SearchField>('id');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const translateX = useRef(new Animated.Value(-256)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sidebarWidth = 256;
  const [searchText, setSearchText] = useState<string>('');
  const [operations, setOperations] = useState<OperationItem[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<OperationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Estados para o modal
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<OperationItem | null>(null);
  
  // Hooks de autenticação
  const { isAuthenticated, user, token } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  // Função para mapear dados da API real para o formato esperado pelos componentes
  const mapOperationData = (apiResponse: any): OperationItem => {
    const mappedData: OperationItem = {
      id: apiResponse.id,
      container: apiResponse.container,
      user: apiResponse.user,
      createdAt: apiResponse.createdAt,
      
      // Campo calculado
      qtde_fotos: apiResponse.container?.images?.length || 0,
    };

    console.log('🔄 Mapeando operação:', {
      id: mappedData.id,
      containerId: mappedData.container?.id || 'N/A',
      imageCount: mappedData.qtde_fotos,
      hasUser: !!mappedData.user,
      userName: mappedData.user ? `${mappedData.user.firstName} ${mappedData.user.lastName}` : 'N/A'
    });

    return mappedData;
  };

  // Função para mapear dados para o componente ListItem
  const mapDataForListItem = (item: OperationItem) => {
    return {
      operacao: `OP-${item.id}`, // Gera na hora da exibição
      container: item.container?.id || '', // Usa o ID real do container
      qtde_fotos: String(item.qtde_fotos),
      // Campos adicionais que o ListItem pode precisar
      id: item.id,
      containerId: item.container?.id || '',
      containerDescription: item.container?.description || '',
      containerImages: item.container?.images || [],
      createdAt: item.createdAt,
      userId: item.user?.id || 0,
    };
  };

  // Função para buscar operações do backend
  const fetchOperations = async (showLoadingIndicator = true) => {
    if (!isAuthenticated) {
      console.log('❌ Usuário não autenticado - redirecionando para login');
      router.replace('/');
      return;
    }

    try {
      if (showLoadingIndicator) {
        setLoading(true);
      }

      console.log('🔄 Buscando operações do backend...');
      console.log('👤 Usuário logado:', user?.cpf);
      console.log('🔑 Token disponível:', token ? 'SIM' : 'NÃO');

      const response = await authenticatedFetch(`${API_BASE_URL}/operations`);

      console.log('📥 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Operações recebidas:', {
          count: data.length,
          sample: data.length > 0 ? {
            id: data[0].id,
            hasContainer: !!data[0].container,
            hasUser: !!data[0].user,
            containerImagesCount: data[0].container?.images?.length || 0
          } : 'NENHUMA OPERAÇÃO'
        });

        // Mapeia os dados da API para o formato interno
        const mappedOperations = data.map(mapOperationData);
        setOperations(mappedOperations);
        setFilteredOperations(mappedOperations);

        console.log('🎯 Operações processadas e salvas no estado');
      } else {
        console.error('❌ Erro na resposta da API:', response.status);
        
        if (response.status === 401) {
          Alert.alert(
            'Sessão Expirada',
            'Sua sessão expirou. Você será redirecionado para o login.',
            [{ text: 'OK', onPress: () => router.replace('/') }]
          );
          return;
        }

        const errorMessage = getErrorMessage(response.status);
        Alert.alert('Erro', `Não foi possível carregar as operações.\n\n${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar operações:', error);
      
      if (error instanceof Error && error.message === 'Sessão expirada') {
        Alert.alert(
          'Sessão Expirada',
          'Sua sessão expirou. Você será redirecionado para o login.',
          [{ text: 'OK', onPress: () => router.replace('/') }]
        );
      } else {
        Alert.alert(
          'Erro de Conexão',
          'Não foi possível conectar ao servidor.\n\nVerifique sua conexão com a internet e tente novamente.',
          [
            { text: 'Tentar Novamente', onPress: () => fetchOperations() },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Função para mapear códigos de erro HTTP
  const getErrorMessage = (status: number): string => {
    switch (status) {
      case 400:
        return 'Requisição inválida.';
      case 401:
        return 'Não autorizado. Faça login novamente.';
      case 403:
        return 'Você não tem permissão para ver as operações.';
      case 404:
        return 'Operações não encontradas.';
      case 500:
        return 'Erro interno do servidor.';
      default:
        return 'Erro desconhecido.';
    }
  };

  // Efeito para buscar operações quando o componente for montado
  useEffect(() => {
    if (isAuthenticated) {
      fetchOperations();
    }
  }, [isAuthenticated]);

  // Efeito para filtrar lista baseado no texto de busca
  useEffect(() => {
    if (searchText === '') {
      setFilteredOperations(operations);
    } else {
      const filtered = operations.filter((item) => {
        if (searchField === 'id') {
          // Busca pelo ID (tanto o número quanto o formato OP-XXX)
          const searchValue = item.id.toString();
          const operationFormat = `OP-${item.id}`;
          return searchValue.includes(searchText) || 
                 operationFormat.toLowerCase().includes(searchText.toLowerCase());
        } else if (searchField === 'containerId') {
          const searchValue = item.container?.id || '';
          return searchValue.toLowerCase().includes(searchText.toLowerCase());
        }
        
        return false;
      });
      setFilteredOperations(filtered);
    }
  }, [searchText, searchField, operations]);
  
  // Inicialização do sidebar
  useEffect(() => {
    translateX.setValue(-sidebarWidth);
    overlayOpacity.setValue(0);
  }, []);

  // Função para refresh manual
  const onRefresh = () => {
    setRefreshing(true);
    fetchOperations(false);
  };
  
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
    router.push('/main/Form');
  };
  
  // Função para abrir o modal (usando IDs reais, sem redundância)
  const handleItemPress = (data: { [key: string]: any; operacao: string; container: string; qtde_fotos: string; }) => {
    try {
      // Extrair ID da operação do formato "OP-123"
      const operationId = parseInt(data.operacao.replace('OP-', ''));
      
      // Encontra o item pelo ID real
      const fullItem = operations.find(op => op.id === operationId);
      if (!fullItem) {
        Alert.alert('Erro', 'Operação não encontrada');
        return;
      }

      console.log('📋 Abrindo modal (usando IDs reais):', {
        operationId: fullItem.id,
        containerId: fullItem.container?.id || 'N/A',
        hasUser: !!fullItem.user,
        hasContainer: !!fullItem.container,
        imageCount: fullItem.qtde_fotos,
        userName: fullItem.user ? `${fullItem.user.firstName} ${fullItem.user.lastName}` : 'N/A'
      });

      setSelectedItem(fullItem);
      setIsModalVisible(true);

    } catch (error) {
      console.error('❌ Erro ao abrir modal:', error);
      Alert.alert('Erro', 'Erro ao abrir detalhes da operação');
    }
  };
  
  // Função para fechar o modal
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
  };

  // Se não autenticado, mostra loading
  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <CustomStatusBar 
          barStyle="light-content"
          backgroundColor="#6D7380"
          translucent={true}
        />
        <ActivityIndicator size="large" color="#49C5B6" />
        <Text className="mt-4" style={{ color: '#2A2E40' }}>Verificando autenticação...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Usando o CustomStatusBar com configurações específicas */}
      <CustomStatusBar 
        barStyle="light-content"
        backgroundColor="#6D7380"
        translucent={true}
      />
      
      <View className="flex-1 flex-col">
        
        {/* Header */}
        <View className='w-full h-28 shadow-lg' style={[{ backgroundColor: '#49C5B6' }, sombra.shadow]}>
          <TouchableOpacity
            className="absolute p-2 mt-12 ml-3 z-10"
            onPress={toggleSidebar}
            activeOpacity={0.7}
            style={{
              borderRadius: 8,
            }}
          >
            <Svg width={30} height={30} viewBox="0 0 20 20" fill="none">
              <Path 
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                stroke="#000000"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>

          {/* Ícone de perfil */}
          <TouchableOpacity 
            className="absolute right-4 top-12 p-2"
            activeOpacity={0.7}
            onPress={() => {
              // Aqui você pode adicionar navegação para tela de perfil
              console.log('Navegando para perfil...');
            }}
          >
            <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke="#2A2E40"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                stroke="#2A2E40"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
            placeholder={`Pesquise por ${searchField === 'id' ? 'ID da operação' : 'container'}`}
            placeholderTextColor="#6D7380"
            value={searchText}
            onChangeText={setSearchText}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 flex-1 mr-4 ml-7"
            style={{
              borderColor: searchText ? '#49C5B6' : '#E5E7EB',
              borderWidth: searchText ? 2 : 1,
              color: '#2A2E40',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
            editable={!loading}
            selectionColor="#49C5B6"
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
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#49C5B6" />
              <Text className="mt-4" style={{ color: '#2A2E40' }}>Carregando operações...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredOperations}
              renderItem={({ item }) => (
                <ListItem 
                  data={mapDataForListItem(item)}
                  onPress={handleItemPress}
                />
              )}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              className="flex-1 w-full"
              contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              ListEmptyComponent={() => (
                <View className="items-center justify-center p-8">
                  <Text className="text-base text-center" style={{ color: '#6D7380' }}>
                    {searchText 
                      ? 'Nenhum resultado encontrado para sua busca' 
                      : 'Nenhuma operação encontrada'
                    }
                  </Text>
                  {!searchText && (
                    <Text className="text-sm text-center mt-2" style={{ color: '#6D7380', opacity: 0.7 }}>
                      Toque no botão + para criar sua primeira operação
                    </Text>
                  )}
                </View>
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#49C5B6']}
                  tintColor="#49C5B6"
                />
              }
            />
          )}
        </View>
        
        {/* Modal de Detalhes */}
        <ItemDetailModal
          isVisible={isModalVisible}
          onClose={handleCloseModal}
          item={selectedItem}
          imageFetch={authenticatedFetch}
        />
      </View>
      
      {/* Botão Flutuante - Movido para fora da estrutura principal */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity 
          style={[
            styles.floatingButton, 
          ]} 
          onPress={handleForm}
          disabled={loading}
          activeOpacity={0.8}
        >
            <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 9999, // Z-index muito alto para garantir que fique por cima
  },
  floatingButton: {
    backgroundColor: '#49C5B6', // Verde-água da paleta
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12, // Elevation maior no Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Borda sutil para melhor definição
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Efeito de pressão mais suave
    transform: [{ scale: 1 }],
  },
  floatingButtonDisabled: {
    backgroundColor: '#6D7380', // Cinza quando desabilitado
    elevation: 6,
    shadowOpacity: 0.1,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 22, // Tamanho um pouco maior
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28, // Para centralização perfeita
  },
});