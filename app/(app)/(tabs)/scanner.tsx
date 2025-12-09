/**
 * BLE Scanner Screen - Solo Minew
 */

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBleScanner } from '@/hooks';
import { getFrameTypeName } from '@/services/minew-parser';
import type { MinewBeacon } from '@/types';
import { BleScannerState } from '@/constants/ble';

export default function ScannerScreen() {
  const {
    status,
    beacons,
    permissions,
    startScan,
    stopScan,
    requestPermissions,
    clearDevices,
  } = useBleScanner();

  const isScanning = status.state === BleScannerState.SCANNING;

  /**
   * Toggle escaneo
   */
  const handleToggleScan = async () => {
    if (isScanning) {
      stopScan();
    } else {
      if (!permissions?.allGranted) {
        const granted = await requestPermissions();
        if (!granted) return;
      }
      await startScan(true); // Solo Minew
    }
  };

  /**
   * Lista ordenada por RSSI (más cercano primero)
   */
  const sortedBeacons = useMemo(() => {
    return [...beacons].sort((a, b) => b.rssi - a.rssi);
  }, [beacons]);

  /**
   * Renderiza un beacon Minew
   */
  const renderBeacon = ({ item }: { item: MinewBeacon }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="font-semibold text-gray-800 flex-1 mr-2" numberOfLines={1}>
          {item.mac}
        </Text>
        <View className="bg-primary-100 px-2 py-1 rounded">
          <Text className="text-primary-700 text-xs font-medium">
            {item.rssi} dBm
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {/* Frame Type */}
        <View className="bg-gray-100 px-2 py-1 rounded">
          <Text className="text-gray-600 text-xs">
            {getFrameTypeName(item.frameType)}
          </Text>
        </View>

        {/* Temperatura */}
        {item.temperature !== null && (
          <View className="bg-blue-100 px-2 py-1 rounded">
            <Text className="text-blue-700 text-xs">
              🌡️ {item.temperature.toFixed(1)}°C
            </Text>
          </View>
        )}

        {/* Humedad */}
        {item.humidity !== null && (
          <View className="bg-cyan-100 px-2 py-1 rounded">
            <Text className="text-cyan-700 text-xs">
              💧 {item.humidity.toFixed(1)}%
            </Text>
          </View>
        )}

        {/* Batería */}
        {item.batteryLevel !== null && (
          <View
            className={`px-2 py-1 rounded ${
              item.batteryLevel > 20 ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <Text
              className={`text-xs ${
                item.batteryLevel > 20 ? 'text-green-700' : 'text-red-700'
              }`}
            >
              🔋 {item.batteryLevel}%
            </Text>
          </View>
        )}

        {/* iBeacon */}
        {item.uuid && (
          <View className="bg-purple-100 px-2 py-1 rounded">
            <Text className="text-purple-700 text-xs">
              📍 {item.major}/{item.minor}
            </Text>
          </View>
        )}
      </View>

      {/* UUID completo para iBeacon */}
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
                ? `Escaneando... (${beacons.length} encontrados)`
                : status.error
                  ? status.error
                  : `${beacons.length} beacons Minew`}
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
      </View>

      {/* Error de permisos */}
      {permissions && !permissions.allGranted && (
        <View className="bg-yellow-50 px-4 py-3 border-b border-yellow-100">
          <Text className="text-yellow-800 text-sm">
            ⚠️ Faltan permisos para escanear Bluetooth.
          </Text>
          <Pressable
            className="mt-2 bg-yellow-500 active:bg-yellow-600 py-2 px-3 rounded self-start"
            onPress={requestPermissions}
          >
            <Text className="text-white text-sm font-medium">
              Conceder permisos
            </Text>
          </Pressable>
        </View>
      )}

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
              if (!isScanning) {
                startScan(true);
              }
            }}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-400 text-lg mb-2">
              {isScanning ? '🔍 Buscando beacons...' : '📡 Sin beacons'}
            </Text>
            <Text className="text-gray-400 text-sm text-center px-8">
              {isScanning
                ? 'Acerca un beacon Minew para detectarlo'
                : 'Presiona "Escanear" para buscar beacons Minew'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}