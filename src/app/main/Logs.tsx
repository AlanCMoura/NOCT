import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Animated, TextInput, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Path } from 'react-native-svg';
import { cssInterop } from 'nativewind';
import ListItem, { OperationCardData } from "../components/Operations";
import Sidebar from '../components/Sidebar';
import { router } from 'expo-router';
import { useAuth, useAuthenticatedFetch } from '../contexts/_AuthContext';
import CustomStatusBar from '../components/StatusBar'; // Importando o componente CustomStatusBar
import { API_BASE_URL } from '../../config/apiConfig';

// Interop para permitir o uso de classes Tailwind em componentes React Native
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(Animated.View, { className: 'style' });

type FetchOperationsOptions = {
  showLoadingIndicator?: boolean;
  queryText?: string;
  operationId?: number;
};

type ApiUser = {
  id?: number;
  firstName?: string;
  lastName?: string;
  cpf?: string;
  email?: string;
  role?: string;
  twoFactorEnabled?: boolean;
};

type ApiContainer = {
  id?: string;
  description?: string;
  images?: string[];
  ctv?: string;
  containerId?: string;
  code?: string;
};

type ApiOperation = {
  id?: number;
  ctv?: string;
  vessel?: string;
  status?: string;
  createdAt?: string;
  user?: ApiUser;
  container?: ApiContainer;
  containers?: ApiContainer[];
  containerList?: ApiContainer[];
  containerCount?: number;
  sackImages?: Array<{ url?: string; imageUrl?: string; signedUrl?: string } | string>;
};

interface OperationItem {
  id: number;
  container: ApiContainer;
  user: ApiUser;
  createdAt: string;
  qtde_fotos: number;
  status?: string;
  containerCount?: number;
  ctv?: string;
  vessel?: string;
}

// Configuração da API
export default function Logs() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const translateX = useRef(new Animated.Value(-256)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sidebarWidth = 256;
  const [searchText, setSearchText] = useState<string>('');
  const [operations, setOperations] = useState<OperationItem[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<OperationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const latestFetchIdRef = useRef<number>(0);
  
  // Hooks de autenticação
  const { isAuthenticated } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const insets = useSafeAreaInsets();
  const headerPaddingTop = Math.max(insets.top, 12) + 12;

  const mapOperationData = (apiResponse: ApiOperation): OperationItem => {
    const fallbackContainer =
      apiResponse.container ||
      (apiResponse.containers && apiResponse.containers.length > 0
        ? apiResponse.containers[0]
        : { id: '', description: '', images: [] });

    const ctv =
      apiResponse.ctv ??
      fallbackContainer?.ctv ??
      fallbackContainer?.containerId ??
      fallbackContainer?.code ??
      fallbackContainer?.id ??
      '';

    const normalizedContainer: ApiContainer = {
      ...fallbackContainer,
      id: ctv || fallbackContainer?.id || '',
    };

    const images =
      normalizedContainer?.images ??
      (Array.isArray((normalizedContainer as any)?.imageUrls)
        ? (normalizedContainer as any).imageUrls
        : undefined) ??
      (Array.isArray((normalizedContainer as any)?.photos)
        ? (normalizedContainer as any).photos
        : undefined) ??
      (Array.isArray((normalizedContainer as any)?.sackImages)
        ? (normalizedContainer as any).sackImages
        : undefined) ??
      [];

    const safeImages = Array.isArray(images) ? images : [];
    const sackImageList = Array.isArray(apiResponse.sackImages)
      ? apiResponse.sackImages
          .map((img) =>
            typeof img === "string"
              ? img
              : img?.signedUrl || img?.imageUrl || img?.url || undefined,
          )
          .filter((u): u is string => !!u && u.length > 0)
      : [];
    const containerCountFromApi = (apiResponse as any)?.containerCount;
    const parsedContainerCount =
      typeof containerCountFromApi === 'string'
        ? Number(containerCountFromApi)
        : typeof containerCountFromApi === 'number'
          ? containerCountFromApi
          : undefined;

    const containerCount =
      (Number.isFinite(parsedContainerCount) ? parsedContainerCount : undefined) ??
      (Array.isArray(apiResponse.containers) ? apiResponse.containers.length : undefined) ??
      (Array.isArray(apiResponse.containerList) ? apiResponse.containerList.length : undefined) ??
      (fallbackContainer?.id ? 1 : 0);

    const mappedData: OperationItem = {
      id: apiResponse.id ?? 0,
      container: normalizedContainer ?? { id: '' },
      user: apiResponse.user ?? {},
      createdAt: apiResponse.createdAt ?? '',
      status: apiResponse.status,
      qtde_fotos: safeImages.length || sackImageList.length,
      containerCount,
      ctv,
      vessel:
        (apiResponse as any)?.vessel ??
        (apiResponse as any)?.vesselName ??
        (apiResponse as any)?.shipName ??
        (apiResponse as any)?.ship ??
        (apiResponse.container as any)?.vessel ??
        (apiResponse.container as any)?.ship ??
        normalizedContainer?.description ??
        undefined,
    };

    return mappedData;
  };

  const mapDataForListItem = (item: OperationItem): OperationCardData => {
    const normalizedStatus = (item.status ?? '').toLowerCase();
    const isClosed =
      normalizedStatus.includes('fech') ||
      normalizedStatus.includes('close') ||
      normalizedStatus.includes('final') ||
      normalizedStatus.includes('compl');
    const statusLabel = isClosed ? 'Fechada' : 'Aberta';
    const operationLabel =
      item.ctv ||
      item.container?.id ||
      item.container?.containerId ||
      item.container?.code ||
      (item.id ? `OP-${item.id}` : 'Operacao');
    const vesselName =
      item.vessel ||
      (item.container as any)?.vessel ||
      (item.container as any)?.ship ||
      item.container?.description ||
      undefined;

    return {
      operationId: item.id,
      operationCode: operationLabel,
      containerId:
        item.ctv ||
        item.container?.id ||
        (item.container as any)?.containerId ||
        (item.container as any)?.ctv ||
        '',
      reservation: item.container?.description || undefined,
      vessel: vesselName,
      createdAt: item.createdAt,
      status: statusLabel,
      photoCount: item.qtde_fotos,
      containerCount: item.containerCount,
      responsible:
        item.user && (item.user.firstName || item.user.lastName)
          ? `${item.user.firstName ?? ''} ${item.user.lastName ?? ''}`.trim()
          : undefined,
    };
  };

  const filterOperationsByQuery = (
    list: OperationItem[],
    query: string | undefined,
  ) => {
    const normalizedQuery = query?.trim().toLowerCase();
    if (!normalizedQuery) return list;

    return list.filter((item) => {
      const searchValue = item.id.toString();
      const operationFormat = `OP-${item.id}`;
      return (
        searchValue.includes(normalizedQuery) ||
        operationFormat.toLowerCase().includes(normalizedQuery)
      );
    });
  };

  const fetchOperations = async ({
    showLoadingIndicator = true,
    queryText,
    operationId,
  }: FetchOperationsOptions = {}) => {
    const fetchId = ++latestFetchIdRef.current;
    const trimmedQuery = queryText?.trim();
    const baseSize =
      Number.isFinite(operationId) ? 1 : trimmedQuery && trimmedQuery.length > 0 ? 50 : 51;
    const queryParams = ['page=0', `size=${baseSize}`, 'sortBy=id', 'sortDirection=DESC'];

    if (showLoadingIndicator) {
      setLoading(true);
    }

    const fetchContainerCount = async (operationId: number): Promise<number | null> => {
      try {
        const response = await authenticatedFetch(
          `${API_BASE_URL}/containers/by-operation/${operationId}?page=0&size=1&sortBy=id&sortDirection=ASC`,
        );
        if (!response.ok) return null;
        const data = await response.json();
        const totalElements = (data && typeof data.totalElements === 'number') ? data.totalElements : null;
        if (Number.isFinite(totalElements)) return totalElements as number;
        if (Array.isArray(data?.content)) return data.content.length;
        return null;
      } catch {
        return null;
      }
    };

    const applyContainerCount = (operationId: number, count: number) => {
      setOperations((prev) =>
        prev.map((op) => (op.id === operationId ? { ...op, containerCount: count } : op)),
      );
      setFilteredOperations((prev) =>
        prev.map((op) => (op.id === operationId ? { ...op, containerCount: count } : op)),
      );
    };

    try {
      let response: Response;

      if (Number.isFinite(operationId)) {
        response = await authenticatedFetch(
          `${API_BASE_URL}/operations/${operationId}`,
        );
      } else {
        response = await authenticatedFetch(
          `${API_BASE_URL}/operations?${queryParams.join('&')}`,
        );
      }

      if (!response.ok) {
        if (response.status === 404) {
          if (fetchId === latestFetchIdRef.current) {
            setOperations([]);
            setFilteredOperations([]);
            setLoading(false);
            setRefreshing(false);
          }
          return;
        } else {
          const message = `Erro ${response.status} ao buscar operações`;
          console.error('[Logs] Falha na API de operações:', message);
          if (Number.isFinite(operationId)) {
            setOperations([]);
            setFilteredOperations([]);
          }
          Alert.alert('Erro', message);
          return;
        }
      }

      const data = await response.json();
      const content: ApiOperation[] = Number.isFinite(operationId)
        ? (data ? [data as ApiOperation] : [])
        : Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data)
            ? data
            : [];

      const mappedOperations = content
        .map(mapOperationData)
        .filter((item) => Number.isFinite(item.id) && item.id !== 0)
        .sort((a, b) => (b.id || 0) - (a.id || 0)); // garante ordem do maior ID para o menor

      if (fetchId !== latestFetchIdRef.current) {
        return;
      }

      const filteredList = filterOperationsByQuery(mappedOperations, trimmedQuery);

      setOperations(mappedOperations);
      setFilteredOperations(filteredList);

      const missingCounts = mappedOperations.filter(
        (item) => item.containerCount === undefined || item.containerCount === null,
      );
      if (missingCounts.length) {
        missingCounts.forEach(async (item) => {
          if (!Number.isFinite(item.id)) return;
          const count = await fetchContainerCount(item.id);
          if (count !== null) {
            applyContainerCount(item.id, count);
          }
        });
      }

      console.log('[Logs] Operações carregadas da API:', {
        quantidade: mappedOperations.length,
        exemplo: mappedOperations.length > 0 ? mappedOperations[0].id : 'NENHUMA',
      });
    } catch (error) {
      console.error('[Logs] Erro ao carregar operações da API:', error);
      Alert.alert('Erro', 'Não foi possível carregar as operações.');
    } finally {
      if (fetchId === latestFetchIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Carrega lista padrão (50 maiores IDs) quando não há busca digitada
  useEffect(() => {
    if (!isAuthenticated) return;
    const trimmed = searchText.trim();
    if (trimmed.length === 0) {
      fetchOperations();
    }
  }, [isAuthenticated, searchText]);
  
  // Inicialização do sidebar
  useEffect(() => {
    translateX.setValue(-sidebarWidth);
    overlayOpacity.setValue(0);
  }, []);

  // Função para refresh manual
  const onRefresh = () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    const trimmed = searchText.trim();
    const isIdSearch = /^\d+$/.test(trimmed);
    fetchOperations({
      showLoadingIndicator: false,
      queryText: isIdSearch ? trimmed : undefined,
      operationId: isIdSearch ? Number(trimmed) : undefined,
    });
  };

  const handleSearch = () => {
    if (!isAuthenticated) return;
    const trimmed = searchText.trim();
    const isIdSearch = /^\d+$/.test(trimmed);
    setLoading(true);
    fetchOperations({
      queryText: trimmed || undefined,
      operationId: isIdSearch ? Number(trimmed) : undefined,
    });
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

  const handleOperationPress = (data: OperationCardData) => {
    router.push({
      pathname: '/main/OperationDetails',
      params: { id: data.operationId.toString() },
    });
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
        <View
          className="w-full px-6 pb-4"
          style={{
            backgroundColor: '#FFFFFF',
            paddingTop: headerPaddingTop,
            borderBottomColor: 'rgba(42, 46, 64, 0.08)',
            borderBottomWidth: 1,
            shadowColor: '#000000',
            shadowOpacity: 0.05,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity
                className="p-2 mr-3"
                onPress={toggleSidebar}
                activeOpacity={0.7}
                style={{
                  borderRadius: 8,
                  backgroundColor: 'rgba(73, 197, 182, 0.12)',
                }}
              >
                <Svg width={24} height={24} viewBox="0 0 20 20" fill="none">
                  <Path
                    d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 1 1 0 1.5H2.75A.75.75 0 0 1 2 4.75zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 1 1 0 1.5H2.75A.75.75 0 0 1 2 10Z"
                    stroke="#2A2E40"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </Svg>
              </TouchableOpacity>
              <View>
                <Text className="text-xl font-semibold" style={{ color: '#2A2E40' }}>
                  Operações
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="p-2"
              activeOpacity={0.7}
              onPress={() => router.push('/main/Profile')}
              style={{
                borderRadius: 9999,
                backgroundColor: 'rgba(73, 197, 182, 0.12)',
              }}
            >
              <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                  stroke="#2A2E40"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                  stroke="#2A2E40"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
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
        <View className="px-6 mt-6 w-full flex-row items-center">
          <TextInput
            placeholder={
              'Pesquise por ID da operação'
            }
            placeholderTextColor="#6D7380"
            value={searchText}
            onChangeText={setSearchText}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 flex-1 mr-3"
            style={{
              borderColor: searchText ? '#49C5B6' : '#E5E7EB',
              borderWidth: searchText ? 2 : 1,
              color: '#2A2E40',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 2,
            }}
            editable={!loading}
            selectionColor="#49C5B6"
          />
          <TouchableOpacity
            className="px-4 py-2 rounded-lg"
            onPress={handleSearch}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#A7DCD5' : '#49C5B6',
              minWidth: 90,
              alignItems: 'center',
              justifyContent: 'center',
              height: 44,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Buscar</Text>
          </TouchableOpacity>
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
                  onPress={handleOperationPress}
                />
              )}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              className="flex-1 w-full"
              contentContainerStyle={{ paddingBottom: 64, paddingHorizontal: 16 }}
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
                      Ajuste os filtros ou aguarde novos registros.
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
      </View>
    </SafeAreaView>
  );
}

