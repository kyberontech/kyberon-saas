// src/lib/mqttPayload.ts — normalização de payload MQTT compartilhada entre
// o subscriber do navegador (mqttClient.ts) e o worker de histórico (mqttServerWorker.ts)

// Alguns CLPs publicam boolean como 1 byte binário cru (0x00/0x01) em vez de texto ASCII.
export function normalizeMqttPayload(payload: Buffer): string {
  return (payload.length === 1 && (payload[0] === 0 || payload[0] === 1))
    ? String(payload[0])
    : payload.toString()
}
