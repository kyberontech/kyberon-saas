// src/instrumentation.ts — hook de boot do Next.js, roda uma vez quando o servidor sobe.
// Usado para iniciar o subscriber MQTT de histórico independente de navegador.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startMqttHistoryWorker } = await import('./lib/mqttServerWorker')
    startMqttHistoryWorker()
  }
}
