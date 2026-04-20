/**
 * HeyNosh - ESP32 Smart Companion
 *
 * This sketch is the practical first hardware build:
 * - button press triggers a query to the backend
 * - backend returns the spoken answer as text
 * - serial monitor shows the answer for verification
 *
 * Why this version:
 * - true always-on wake word on ESP32 is a later step
 * - audio capture + STT + audio playback is a bigger integration
 * - this gets the device, WiFi, API path, and control flow working now
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- Configuration ---
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_ENDPOINT = "http://192.168.1.100:3000/api/heynosh"; // use your Next.js host / LAN IP
const char* API_TOKEN = "TEST_TOKEN_OR_USER_ID";
const char* DEFAULT_QUERY = "Hey Nosh, what ingredients are expiring soon?";

// --- Pins ---
#define BUTTON_PIN 4

// Keep the mic/speaker pins documented for your next step.
#define I2S_MIC_WS 25
#define I2S_MIC_SD 32
#define I2S_MIC_SCK 33
#define I2S_SPK_BCLK 26
#define I2S_SPK_LRC 27
#define I2S_SPK_DIN 22

// Button debounce
#define BUTTON_DEBOUNCE_MS 250

unsigned long lastButtonPressMs = 0;

void setupWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
}

void sendQueryToBackend(const String& queryText) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    setupWiFi();
  }

  HTTPClient http;
  http.begin(API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + API_TOKEN);

  JsonDocument body;
  body["text"] = queryText;

  String payload;
  serializeJson(body, payload);

  Serial.println("Sending command to HeyNosh backend...");
  int httpResponseCode = http.POST(payload);

  if (httpResponseCode <= 0) {
    Serial.print("HTTP error: ");
    Serial.println(httpResponseCode);
    http.end();
    return;
  }

  String responseText = http.getString();
  Serial.print("Raw response: ");
  Serial.println(responseText);

  JsonDocument responseDoc;
  DeserializationError error = deserializeJson(responseDoc, responseText);

  if (!error) {
    const char* spoken = responseDoc["text"] | responseDoc["response"] | "";
    if (spoken && spoken[0] != '\0') {
      Serial.print("HeyNosh says: ");
      Serial.println(spoken);
    }
  } else {
    Serial.println("Response was not JSON. Check backend output.");
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  setupWiFi();
  
  Serial.println("HeyNosh is ready.");
  Serial.println("Press the button to send the default expiring-items query.");
  Serial.println(DEFAULT_QUERY);
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    unsigned long now = millis();
    if (now - lastButtonPressMs < BUTTON_DEBOUNCE_MS) {
      delay(20);
      return;
    }

    lastButtonPressMs = now;
    Serial.println("Button pressed.");
    sendQueryToBackend(DEFAULT_QUERY);

    while (digitalRead(BUTTON_PIN) == LOW) {
      delay(10);
    }

    Serial.println("Ready for next command.");
  }
}
