# Configuração MQTT — Kyberon HMI

## 1. Instalar o Mosquitto

```bash
# Ubuntu / Debian
sudo apt install mosquitto mosquitto-clients

# Windows: https://mosquitto.org/download/
```

---

## 2. Configurar o Mosquitto (WebSocket + Autenticação)

Edite ou crie `/etc/mosquitto/conf.d/kyberon.conf`:

```conf
# ── Listener MQTT padrão (TCP — para o CLP) ──────────────────────
listener 1883
protocol mqtt

# ── Listener WebSocket (para o browser) ──────────────────────────
listener 9001
protocol websockets

# ── Autenticação ──────────────────────────────────────────────────
allow_anonymous false
password_file /etc/mosquitto/passwd
```

---

## 3. Criar usuário e senha

```bash
# Cria o arquivo de senhas com o usuário "clpuser"
sudo mosquitto_passwd -c /etc/mosquitto/passwd clpuser
# (será pedida a senha — use a mesma de mqttConfig.ts: "clpsenha")
```

---

## 4. Reiniciar o Mosquitto

```bash
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto   # iniciar automaticamente no boot
```

---

## 5. Testar a conexão

```bash
# Assinar um tópico (em outra aba)
mosquitto_sub -h localhost -p 1883 -u clpuser -P clpsenha -t "planta/sensor1/temperatura"

# Publicar um valor de teste
mosquitto_pub -h localhost -p 1883 -u clpuser -P clpsenha -t "planta/sensor1/temperatura" -m "23.5"
```

---

## 6. Variáveis do projeto (`src/lib/mqttConfig.ts`)

| Variável               | Valor padrão                  | Descrição                          |
|------------------------|-------------------------------|------------------------------------|
| `MQTT_BROKER_URL`      | `ws://localhost:9001/mqtt`    | Endereço WebSocket do broker       |
| `MQTT_USERNAME`        | `clpuser`                     | Usuário MQTT                       |
| `MQTT_PASSWORD`        | `clpsenha`                    | Senha MQTT                         |
| `MQTT_CLIENT_ID`       | `kyberon-hmi-XXXXXX`          | ID único do cliente                |
| `MQTT_DEFAULT_QOS`     | `1`                           | QoS para subscribe                 |
| `MQTT_PUBLISH_QOS`     | `1`                           | QoS para publish (Comandos)        |
| `MQTT_COMMAND_PAYLOAD_ON`  | `"1"`                     | Payload publicado ao ligar         |
| `MQTT_COMMAND_PAYLOAD_OFF` | `"0"`                     | Payload publicado ao desligar      |

---

## 7. Instalar dependências do projeto

```bash
npm install
npm run dev
```
