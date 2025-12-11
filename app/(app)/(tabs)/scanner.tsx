/**
 * BLE Scanner Screen - Minew SDK
 */

import { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMinewScanner } from '@/hooks/useMinewScanner';
import type { MinewBeacon } from '@/services/minew-scanner';

export default function ScannerScreen() {
  const {
    isScanning,
    beacons,
    error,
    startScan,
    stopScan,
    clearDevices,
  } = useMinewScanner();

  /**
   * Toggle escaneo
   */
  const handleToggleScan = async () => {
    if (isScanning) {
      stopScan();
    } else {
      await startScan();
    }
  };

  /**
   * Lista ordenada por RSSI
   */
  const sortedBeacons = useMemo(() => {
    return [...beacons].sort((a, b) => b.rssi - a.rssi);
  }, [beacons]);

  /**
   * Obtiene el nombre del tipo de frame
   */
  const getFrameTypeName = (frames: MinewBeacon['frames']): string => {
    if (!frames || frames.length === 0) return 'Unknown';
    
    const frameTypes = frames.map(f => f.frameType);
    if (frameTypes.includes('FrameHTSensor')) return 'Temp/Humidity';
    if (frameTypes.includes('FrameiBeacon')) return 'iBeacon';
    if (frameTypes.includes('FrameUID')) return 'Eddystone UID';
    if (frameTypes.includes('FrameURL')) return 'Eddystone URL';
    if (frameTypes.includes('FrameAccSensor')) return 'Accelerometer';
    if (frameTypes.includes('FrameTLM')) return 'Telemetry';
    
    return frames[0]?.frameType || 'Unknown';
  };

  /**
   * Renderiza un beacon
   */
  const renderBeacon = ({ item }: { item: MinewBeacon }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="font-semibold text-gray-800" numberOfLines={1}>
            {item.name || 'Sin nombre'}
          </Text>
          <Text className="text-gray-500 text-xs">{item.mac}</Text>
        </View>
        <View className="bg-primary-100 px-2 py-1 rounded">
          <Text className="text-primary-700 text-xs font-medium">
            {item.rssi} dBm
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <View className="bg-gray-100 px-2 py-1 rounded">
          <Text className="text-gray-600 text-xs">
            {getFrameTypeName(item.frames)}
          </Text>
        </View>

        {item.temperature !== undefined && (
          <View className="bg-blue-100 px-2 py-1 rounded">
            <Text className="text-blue-700 text-xs">
              🌡️ {item.temperature.toFixed(1)}°C
            </Text>
          </View>
        )}

        {item.humidity !== undefined && (
          <View className="bg-cyan-100 px-2 py-1 rounded">
            <Text className="text-cyan-700 text-xs">
              💧 {item.humidity.toFixed(1)}%
            </Text>
          </View>
        )}

        {item.battery > 0 && (
          <View className={`px-2 py-1 rounded ${item.battery > 20 ? 'bg-green-100' : 'bg-red-100'}`}>
            <Text className={`text-xs ${item.battery > 20 ? 'text-green-700' : 'text-red-700'}`}>
              🔋 {item.battery}%
            </Text>
          </View>
        )}

        {item.uuid && (
          <View className="bg-purple-100 px-2 py-1 rounded">
            <Text className="text-purple-700 text-xs">
              📍 {item.major}/{item.minor}
            </Text>
          </View>
        )}
      </View>

      {item.uuid && (
        <Text className="text-gray-400 text-xs mt-2" numberOfLines={1}>
          {item.uuid}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {isScanning && (
              <ActivityIndicator size="small" color="#333" className="mr-2" />
            )}
            <Text className="text-gray-600 text-sm">
              {isScanning
                ? `Escaneando... (${beacons.length})`
                : `${beacons.length} beacons`}
            </Text>
          </View>

          <Pressable
            className={`px-4 py-2 rounded-lg ${
              isScanning ? 'bg-red-500 active:bg-red-600' : 'bg-primary-500 active:bg-primary-600'
            }`}
            onPress={handleToggleScan}
          >
            <Text className="text-white font-semibold">
              {isScanning ? 'Detener' : 'Escanear'}
            </Text>
          </Pressable>
        </View>

        {/* Error message */}
        {error && !isScanning && (
          <Text className="text-red-500 text-xs mt-2">{error}</Text>
        )}
      </View>

      {/* Lista de beacons */}
      <FlatList
        data={sortedBeacons}
        keyExtractor={(item) => item.mac}
        renderItem={renderBeacon}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              clearDevices();
              if (!isScanning) startScan();
            }}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-400 text-lg mb-2">
              {isScanning ? '🔍 Buscando...' : '📡 Sin beacons'}
            </Text>
            <Text className="text-gray-400 text-sm text-center px-8">
              {isScanning
                ? 'Acerca un beacon Minew'
                : 'Presiona "Escanear" para buscar'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}