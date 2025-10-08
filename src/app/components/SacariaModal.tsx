import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { cssInterop } from 'nativewind';
import type { OperationCargoDetail } from '../mocks/mockOperationDetails';

cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });

interface SacariaModalProps {
  visible: boolean;
  onClose: () => void;
  cargo?: OperationCargoDetail;
}

const CloseIcon = ({ size = 22, color = '#2A2E40' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Path
      d="M6 6L18 18"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

const SacariaModal: React.FC<SacariaModalProps> = ({ visible, onClose, cargo }) => {
  const imageCount = cargo?.images.length ?? 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{cargo?.title ?? 'Sacaria'}</Text>
              <Text style={styles.subtitle}>
                {imageCount} {imageCount === 1 ? 'imagem' : 'imagens'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {cargo?.description ? (
              <Text style={styles.description}>{cargo.description}</Text>
            ) : null}

            <FlatList
              data={cargo?.images ?? []}
              numColumns={2}
              keyExtractor={(item, index) => `${item}-${index}`}
              columnWrapperStyle={styles.imageRow}
              contentContainerStyle={styles.imageList}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.image} />
              )}
              scrollEnabled={false}
            />

            {cargo?.notes ? (
              <View style={styles.notesCard}>
                <Text style={styles.notesLabel}>Marcação</Text>
                <Text style={styles.notesValue}>{cargo.notes}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(42, 46, 64, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2E40',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6D7380',
  },
  closeButton: {
    padding: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(73, 197, 182, 0.12)',
  },
  description: {
    fontSize: 15,
    color: '#2A2E40',
    lineHeight: 22,
  },
  imageList: {
    gap: 12,
  },
  imageRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  image: {
    width: '48%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  notesCard: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: '#6D7380',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesValue: {
    fontSize: 15,
    color: '#2A2E40',
    fontWeight: '600',
  },
});

export default SacariaModal;
