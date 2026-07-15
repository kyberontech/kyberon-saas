// ═══════════════════════════════════════════════════════════════════
//  src/lib/mqttConfig.ts
//  ─────────────────────────────────────────────────────────────────
//  CONFIGURAÇÕES CENTRALIZADAS DO BROKER MQTT
//
//  Para alterar o broker, usuário ou senha, edite APENAS este arquivo.
//  O restante do sistema lê estas constantes automaticamente.
// ═══════════════════════════════════════════════════════════════════

// ── Endereço do Broker ─────────────────────────────────────────────
//  Protocolo: WebSocket (ws://) — necessário para rodar no browser
//  Porta padrão WebSocket do Mosquitto: 9001
//  Sem TLS: ws://  |  Com TLS: wss://

// Broker EMQX rodando na sua VPS Hostinger (72.60.240.153)
//  - Em produção (https), o Caddy faz proxy reverso com SSL automático:
//      wss://mqtt.72-60-240-153.nip.io  ->  localhost:8083 (EMQX, sem TLS)
//  - Em desenvolvimento local (http), conecta direto na porta 8083 da VPS

export const MQTT_BROKER_URL = typeof window !== 'undefined' && window.location.protocol === 'https:'
  ? 'wss://mqtt.devsystem.cloud/mqtt'   // produção (https) - via EasyPanel com SSL
  : 'ws://72.60.240.153:8083/mqtt'      // desenvolvimento local (http)


// ── Credenciais ────────────────────────────────────────────────────
// Deixe em branco se a autenticação anônima estiver habilitada no EMQX (padrão).
// Se você criar um usuário no EMQX (Access Control > Authentication), preencha aqui.
export const MQTT_USERNAME = ''//'clpuser'
export const MQTT_PASSWORD = ''//'Clpsenha1'   // ← altere aqui

// ── Identificação do Cliente ───────────────────────────────────────
//  O sufixo aleatório evita conflito se múltiplas abas estiverem abertas
export const MQTT_CLIENT_ID = `kyberon-hmi-${Math.random().toString(16).slice(2, 8)}`

// ── Opções de Reconexão ────────────────────────────────────────────
export const MQTT_RECONNECT_PERIOD = 3000   // ms entre tentativas de reconexão
export const MQTT_CONNECT_TIMEOUT  = 10000  // ms até declarar timeout de conexão
export const MQTT_KEEPALIVE        = 30     // segundos (heartbeat com o broker)

// ── QoS padrão para subscribe ──────────────────────────────────────
//  0 = at most once  |  1 = at least once  |  2 = exactly once
export const MQTT_DEFAULT_QOS: 0 | 1 | 2 = 1

// ── QoS padrão para publish (cards de Comando) ────────────────────
export const MQTT_PUBLISH_QOS: 0 | 1 | 2 = 1

// ── Payload publicado para cards de Comando (ON/OFF) ──────────────
//  Usado quando MQTT_COMMAND_PAYLOAD_FORMAT = 'text'.
//  Confirmado por captura ao vivo: os blocos MQTT nativos da TProg
//  (MQTT_SUBS_BOOL / MQTT_PUB_BOOL) usam a palavra "true"/"false" em
//  texto minúsculo, não "1"/"0" nem byte binário cru.
export const MQTT_COMMAND_PAYLOAD_ON  = 'true'
export const MQTT_COMMAND_PAYLOAD_OFF = 'false'

// ── Formato do payload para cards de Comando (ON/OFF) ──────────────
//  'text'   = envia o texto definido acima (ex: "true"/"false") — formato da TProg.
//  'binary' = envia 1 byte cru (0x01/0x00) — formato usado por outras
//             plataformas de CLP com blocos MQTT nativos.
//  Se o bloco do CLP mostrar STATE=inscrito/dados recebidos mas o VALUE nunca
//  atualizar, capture o que o próprio CLP publica (MQTT_PUB_BOOL) num tópico
//  de teste para descobrir o formato exato e ajustar aqui.
export const MQTT_COMMAND_PAYLOAD_FORMAT: 'binary' | 'text' = 'text'
