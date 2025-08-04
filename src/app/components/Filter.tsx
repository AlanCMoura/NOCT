import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  StyleSheet,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
} from 'react-native';

// Tipos baseados nos campos reais da API
type SearchField = 'id' | 'containerId';

interface FilterOption {
  id: number;
  name: string;
  field: SearchField;
  description: string;
}

interface FilterButtonProps {
  onFilterChange: (field: SearchField) => void;
  currentFilterField: SearchField;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  onFilterChange,
  currentFilterField,
}) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const screenHeight = Dimensions.get('window').height;
  const modalPosition = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  
  // Opções de filtro baseadas nos campos da API
  const filterOptions: FilterOption[] = [
    { 
      id: 1, 
      name: 'ID da Operação', 
      field: 'id',
      description: 'Buscar por número da operação (ex: 123 ou OP-123)'
    },
    { 
      id: 2, 
      name: 'Container ID', 
      field: 'containerId',
      description: 'Buscar por identificação do container'
    },
  ];

  useEffect(() => {
    if (modalVisible) {
      showModal();
    }
  }, [modalVisible]);

  const showModal = () => {
    modalPosition.setValue(screenHeight);
    modalOpacity.setValue(0);
    backdropOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(modalPosition, {
        toValue: 0,
        friction: 8,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(modalPosition, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(() => {
      setModalVisible(false);
      callback?.();
    });
  };

  const selectAndApplyFilter = (field: SearchField): void => {
    hideModal(() => {
      onFilterChange(field);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          modalPosition.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150) {
          hideModal();
        } else {
          Animated.spring(modalPosition, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: (_, gestureState) => {
        if (gestureState.dy > 150) {
          hideModal();
        } else {
          Animated.spring(modalPosition, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Função para obter o nome do filtro atual
  const getCurrentFilterName = (): string => {
    const currentOption = filterOptions.find(option => option.field === currentFilterField);
    return currentOption?.name || 'Filtro';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.filterButton}
        activeOpacity={0.8}
        accessibilityLabel={`Filtro atual: ${getCurrentFilterName()}`}
      >
        <Image
          source={require('./icons/filtro.png')}
          style={styles.filterIcon}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        {/* Indicador do filtro ativo */}
        <View style={styles.activeIndicator}>
          <Text style={styles.activeIndicatorText}>
            {currentFilterField === 'id' ? 'ID' : 'Container'}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => hideModal()}
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          <Animated.View
            style={[styles.overlay, { opacity: backdropOpacity }]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => hideModal()}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.modalContent, 
              { 
                transform: [{ translateY: modalPosition }], 
                opacity: modalOpacity 
              }
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.handleBar} />
            <Text style={styles.modalTitle}>Opções de Filtro</Text>
            <Text style={styles.modalSubtitle}>
              Escolha o campo para realizar a busca
            </Text>
            
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => selectAndApplyFilter(option.field)}
                style={[
                  styles.optionButton, 
                  currentFilterField === option.field && styles.selectedOptionButton
                ]}
                accessibilityLabel={`Filtrar por ${option.name}`}
                accessibilityRole="button"
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionText, 
                    currentFilterField === option.field && styles.selectedOptionText
                  ]}>
                    {option.name}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    currentFilterField === option.field && styles.selectedOptionDescription
                  ]}>
                    {option.description}
                  </Text>
                </View>
                {currentFilterField === option.field && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => hideModal()}
                style={styles.cancelButton}
                accessibilityLabel="Cancelar seleção de filtro"
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

// Estilos atualizados com a paleta de cores
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#49C5B6', // Verde-água da paleta
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  filterIcon: {
    width: 20,
    height: 28,
    marginRight: 6,
    tintColor: '#2A2E40', // Ícone em azul grafite da paleta
  },
  activeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeIndicatorText: {
    color: 'black',
    fontSize: 10,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(42, 46, 64, 0.5)', // Overlay com tom da paleta
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingTop: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    maxHeight: '80%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#6D7380', // Cinza lavanda da paleta
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2A2E40', // Azul grafite da paleta
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6D7380', // Cinza lavanda da paleta
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderRadius: 12,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedOptionButton: {
    backgroundColor: '#F0F9F7', // Tom claro do verde-água
    borderColor: '#49C5B6', // Verde-água da paleta
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2E40', // Azul grafite da paleta
    marginBottom: 4,
  },
  selectedOptionText: {
    color: '#49C5B6', // Verde-água da paleta
  },
  optionDescription: {
    fontSize: 13,
    color: '#6D7380', // Cinza lavanda da paleta
    lineHeight: 18,
  },
  selectedOptionDescription: {
    color: '#3DA89F', // Tom mais escuro do verde-água
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#49C5B6', // Verde-água da paleta
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6D7380', // Cinza lavanda da paleta
  },
  cancelButtonText: {
    color: '#2A2E40', // Azul grafite da paleta
    fontWeight: '600',
    fontSize: 14,
  },
});

export default FilterButton;