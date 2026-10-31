/**
 * TwinSense: IoT-Based Digital Twin for Predictive Maintenance
 * ESP32 Simulation Firmware for Wokwi
 * 
 * Hardware Configuration:
 * - MCU: ESP32 DevKit v1
 * - DHT22 Temp/Humidity: GPIO 15
 * - Potentiometer (Vibration / Load Proxy): GPIO 34 (ADC1)
 * - LED Green (Normal): GPIO 18
 * - LED Yellow (Warning): GPIO 19
 * - LED Red (Critical Alert): GPIO 21
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// --- System Identifiers & Telemetry Config ---
const char* MACHINE_ID = "MOTOR-001";
const char* TELEMETRY_SOURCE = "wokwi_esp32";

// --- Wi-Fi Credentials for Wokwi Virtual Network ---
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

// --- MQTT Broker Configuration ---
// Uses public broker suitable for external Wokwi simulation access.
// In Phase 3, this connects to the Python MQTT consumer.
const char* MQTT_BROKER = "broker.hivemq.com";
const int   MQTT_PORT   = 1883;
const char* TOPIC_TELEMETRY = "twinsense/MOTOR-001/telemetry";
const char* TOPIC_STATUS    = "twinsense/MOTOR-001/status";
const char* TOPIC_COMMANDS  = "twinsense/MOTOR-001/commands";

// --- Pin Allocations ---
#define DHTPIN 15
#define DHTTYPE DHT22
#define POT_PIN 34
#define LED_GREEN 18
#define LED_YELLOW 19
#define LED_RED 21

// --- Operational Engineering Thresholds ---
const float TEMP_WARN_THRESHOLD = 65.0; // °C
const float TEMP_CRIT_THRESHOLD = 80.0; // °C
const float VIB_WARN_THRESHOLD  = 0.50; // Proxy g
const float VIB_CRIT_THRESHOLD  = 0.75; // Proxy g

// --- Global Objects ---
DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// --- State Variables ---
unsigned long lastPublishTime = 0;
const unsigned long PUBLISH_INTERVAL_MS = 2000; // 2 seconds telemetry loop
unsigned long lastMqttRetryTime = 0;
const unsigned long MQTT_RETRY_INTERVAL_MS = 2000; // 2s quick retry for robust reconnection
unsigned long lastWiFiRetryTime = 0;
const unsigned long WIFI_RETRY_INTERVAL_MS = 10000;

// --- Function Declarations ---
void setupWiFi();
void connectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void updateStatusLEDs(const char* status);
void publishTelemetry();

void setup() {
  Serial.begin(115200);
  delay(500);

  // Seed pseudo-random generator with ADC noise and clock micros for unique MQTT client IDs
  randomSeed(micros() ^ analogRead(POT_PIN));

  Serial.println("\n==================================================");
  Serial.println("  TwinSense - Industrial Digital Twin Telemetry");
  Serial.println("  ESP32 Edge Node Firmware Initializing...");
  Serial.printf("  Target Machine ID: %s\n", MACHINE_ID);
  Serial.println("==================================================");

  // Initialize Pin Modes
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(POT_PIN, INPUT);

  // Self-test LEDs on startup
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_YELLOW, HIGH);
  digitalWrite(LED_RED, HIGH);
  delay(600);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_RED, LOW);

  // Initialize Sensors
  dht.begin();
  Serial.println("[SETUP] DHT22 Temperature & Humidity Sensor initialized on GPIO 15.");
  Serial.println("[SETUP] Potentiometer Vibration Proxy initialized on GPIO 34 (ADC1).");

  // Initialize Networking
  setupWiFi();

  // Configure MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(512); // Ensure capacity for JSON payloads
  mqttClient.setKeepAlive(60);   // Keepalive 60s prevents HiveMQ idle disconnects
  mqttClient.setSocketTimeout(15);
}

void loop() {
  // Ensure Wi-Fi connection without restarting the radio every loop cycle
  if (WiFi.status() != WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastWiFiRetryTime > WIFI_RETRY_INTERVAL_MS) {
      lastWiFiRetryTime = now;
      Serial.println("\n[WIFI] Waiting for connection to 'Wokwi-GUEST'...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASS);
    }
    delay(100);
    return; // Do not attempt MQTT or telemetry without an IP address
  }

  // Manage MQTT lifecycle only when WiFi is connected
  if (!mqttClient.connected()) {
    unsigned long now = millis();
    if (now - lastMqttRetryTime > MQTT_RETRY_INTERVAL_MS) {
      lastMqttRetryTime = now;
      connectMQTT();
    }
  } else {
    mqttClient.loop();
  }

  // Periodic Telemetry Transmission
  unsigned long currentMillis = millis();
  if (currentMillis - lastPublishTime >= PUBLISH_INTERVAL_MS) {
    lastPublishTime = currentMillis;
    publishTelemetry();
  }
}

void setupWiFi() {
  Serial.printf("\n[WIFI] Connecting to SSID '%s'...", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long startAttempt = millis();
  // Allow up to 10 seconds for DHCP allocation without resetting WiFi.begin
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 10000) {
    delay(300);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" CONNECTED!");
    Serial.printf("[WIFI] Assigned IP Address: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println(" PENDING (Connecting in background)...");
  }
}

void connectMQTT() {
  Serial.printf("[MQTT] Attempting connection to broker '%s:%d'...", MQTT_BROKER, MQTT_PORT);
  
  // Unique client ID based on MAC/Machine ID
  String clientId = String("TwinSense-ESP32-") + String(MACHINE_ID) + "-" + String(random(0xffff), HEX);
  
  // LWT (Last Will and Testament) payload
  StaticJsonDocument<128> lwtDoc;
  lwtDoc["machine_id"] = MACHINE_ID;
  lwtDoc["status"] = "OFFLINE";
  lwtDoc["timestamp_ms"] = millis();
  char lwtBuffer[128];
  serializeJson(lwtDoc, lwtBuffer);

  if (mqttClient.connect(clientId.c_str(), TOPIC_STATUS, 0, false, lwtBuffer)) {
    Serial.println(" CONNECTED!");
    
    // Publish online birth message
    StaticJsonDocument<128> birthDoc;
    birthDoc["machine_id"] = MACHINE_ID;
    birthDoc["status"] = "ONLINE";
    birthDoc["ip"] = WiFi.localIP().toString();
    birthDoc["timestamp_ms"] = millis();
    char birthBuffer[128];
    serializeJson(birthDoc, birthBuffer);
    mqttClient.publish(TOPIC_STATUS, birthBuffer, false);

    // Subscribe to remote control and simulation commands
    mqttClient.subscribe(TOPIC_COMMANDS);
    Serial.printf("[MQTT] Subscribed to command topic: %s\n", TOPIC_COMMANDS);
  } else {
    Serial.printf(" FAILED. rc=%d (Retrying in %lu ms)\n", mqttClient.state(), MQTT_RETRY_INTERVAL_MS);
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.printf("[MQTT RX] Message arrived on topic [%s]: ", topic);
  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';
  Serial.println(message);

  // Parse command JSON
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, message);
  if (!err) {
    if (doc.containsKey("command")) {
      const char* cmd = doc["command"];
      Serial.printf("[COMMAND EXECUTED] %s\n", cmd);
      // Support diagnostic commands (e.g., self-test flash)
      if (strcmp(cmd, "identify") == 0) {
        for (int i = 0; i < 3; i++) {
          digitalWrite(LED_GREEN, HIGH);
          digitalWrite(LED_YELLOW, HIGH);
          digitalWrite(LED_RED, HIGH);
          delay(100);
          digitalWrite(LED_GREEN, LOW);
          digitalWrite(LED_YELLOW, LOW);
          digitalWrite(LED_RED, LOW);
          delay(100);
        }
      }
    }
  }
}

void publishTelemetry() {
  // 1. Read Physical Sensor Simulation (DHT22)
  float rawTemp = dht.readTemperature();
  float rawHum  = dht.readHumidity();

  // Validate DHT22 reading
  float temp_c = isnan(rawTemp) ? 52.0 : rawTemp;
  float hum_pct = isnan(rawHum) ? 42.0 : rawHum;

  // 2. Read Potentiometer Proxy (GPIO 34 ADC)
  int rawAdc = analogRead(POT_PIN); // 0 - 4095
  // Map ADC directly to vibration proxy (0.05g to 1.20g)
  float vibration_proxy = 0.05 + ((float)rawAdc / 4095.0) * 1.15;
  // Load percentage proxy (0 - 100%)
  int load_percent = map(rawAdc, 0, 4095, 30, 100);

  // 3. Documented Motor Behavioral Model
  // Synchronous speed: 1500 RPM (50 Hz, 4-pole motor)
  // Slip increases non-linearly with load and vibration/mechanical friction
  float estimatedSlipRpm = 14.0 + (load_percent * 0.45) + (vibration_proxy * 120.0);
  int rpm = (int)round(1500.0 - estimatedSlipRpm);
  if (rpm < 1100) rpm = 1100;
  if (rpm > 1495) rpm = 1495;

  // 4. Determine Operating Condition State
  const char* status = "NORMAL";
  if (temp_c >= TEMP_CRIT_THRESHOLD || vibration_proxy >= VIB_CRIT_THRESHOLD) {
    status = "CRITICAL";
  } else if (temp_c >= TEMP_WARN_THRESHOLD || vibration_proxy >= VIB_WARN_THRESHOLD) {
    status = "WARNING";
  }

  // Update physical edge LEDs
  updateStatusLEDs(status);

  // 5. Serialize Structured Telemetry JSON
  StaticJsonDocument<384> doc;
  doc["machine_id"] = MACHINE_ID;
  doc["source"] = TELEMETRY_SOURCE;
  doc["temperature_c"] = serialized(String(temp_c, 1));
  doc["humidity_percent"] = serialized(String(hum_pct, 1));
  doc["vibration_proxy"] = serialized(String(vibration_proxy, 2));
  doc["rpm"] = rpm;
  doc["load_percent"] = load_percent;
  doc["timestamp_ms"] = millis();
  doc["status"] = status;

  char jsonBuffer[384];
  serializeJson(doc, jsonBuffer);

  // 6. Serial Monitor Diagnostics (Clean, Simple, Clear)
  Serial.println("\n========================================");
  Serial.printf(" [MOTOR-001] Condition: %s\n", status);
  Serial.println("----------------------------------------");
  Serial.printf("  • Temperature : %.1f °C\n", temp_c);
  Serial.printf("  • Humidity    : %.1f %%\n", hum_pct);
  Serial.printf("  • Vibration   : %.2f g\n", vibration_proxy);
  Serial.printf("  • Motor Speed : %d RPM\n", rpm);
  Serial.printf("  • Motor Load  : %d %%\n", load_percent);
  Serial.println("----------------------------------------");
  Serial.println("  JSON Payload:");
  serializeJsonPretty(doc, Serial);
  Serial.println();

  // 7. Publish over MQTT
  if (mqttClient.connected()) {
    bool pubOk = mqttClient.publish(TOPIC_TELEMETRY, jsonBuffer);
    if (pubOk) {
      Serial.println("  MQTT Status   : Published OK");
    } else {
      Serial.println("  MQTT Status   : Publish FAILED");
    }
  } else {
    Serial.println("  MQTT Status   : Broker Disconnected");
  }
  Serial.println("========================================");
}

void updateStatusLEDs(const char* status) {
  if (strcmp(status, "CRITICAL") == 0) {
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_RED, HIGH);
  } else if (strcmp(status, "WARNING") == 0) {
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, HIGH);
    digitalWrite(LED_RED, LOW);
  } else {
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_RED, LOW);
  }
}
