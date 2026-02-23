/**
 * HeyNosh - ESP32 Smart Companion
 * 
 * Hardware:
 * - ESP32
 * - INMP441 I2S Microphone
 * - MAX98357A I2S Amplifier
 * - Push Button
 * 
 * Flow:
 * 1. Connect to WiFi.
 * 2. Wait for button press.
 * 3. Record audio via I2S mic while pressed.
 * 4. Post audio to NoshNurture /api/heynosh backend.
 * 5. Receive text response, or ideally receive an audio stream to play.
 *    (For simplicity and ESP32 memory limits, this code assumes the server returns 
 *     a URL to an audio file [TTS] or streams raw PCM/WAV back).
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <driver/i2s.h>
#include <ArduinoJson.h>

// --- Configuration ---
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_ENDPOINT = "http://192.168.1.100:3000/api/heynosh"; // Replace with your computer's local IP or Vercel URL
const char* API_TOKEN = "TEST_TOKEN_OR_USER_ID"; 

// --- Pins ---
#define BUTTON_PIN 4

// I2S Microphone Pins (INMP441)
#define I2S_MIC_PORT I2S_NUM_0
#define I2S_MIC_WS 25
#define I2S_MIC_SD 32
#define I2S_MIC_SCK 33

// I2S Speaker Pins (MAX98357A)
#define I2S_SPK_PORT I2S_NUM_1
#define I2S_SPK_BCLK 26
#define I2S_SPK_LRC 27
#define I2S_SPK_DIN 22

// Audio settings
#define SAMPLE_RATE 16000
#define RECORD_TIME 5 // maximum seconds, but it stops on button release
// Buffer size for reading from mic
#define BUFFER_SIZE 512

void setupWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
}

void setupI2S_Mic() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 1024,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };
  
  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_MIC_SCK,
    .ws_io_num = I2S_MIC_WS,
    .data_out_num = -1,
    .data_in_num = I2S_MIC_SD
  };
  
  i2s_driver_install(I2S_MIC_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_MIC_PORT, &pin_config);
}

void setupI2S_Speaker() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 512,
    .use_apll = false,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SPK_BCLK,
    .ws_io_num = I2S_SPK_LRC,
    .data_out_num = I2S_SPK_DIN,
    .data_in_num = -1
  };

  i2s_driver_install(I2S_SPK_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_SPK_PORT, &pin_config);
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  
  setupWiFi();
  setupI2S_Mic();
  setupI2S_Speaker();
  
  Serial.println("HeyNosh is ready! Hold the button and speak.");
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    Serial.println("Button pressed! Recording started...");
    // Ideally, here you would start streaming the audio data over HTTP chunks to the Next.js API.
    // Due to ESP32 RAM limits, streaming using HTTP Chunked Transfer is best for long queries.
    
    HTTPClient http;
    http.begin(API_ENDPOINT);
    http.addHeader("Content-Type", "application/octet-stream");
    http.addHeader("Authorization", String("Bearer ") + API_TOKEN);
    
    // NOTE: For full Voice-to-Server, the ESP32 HTTPClient chunked streaming is required,
    // or you can send text. If dealing with raw audio is too heavy without a library,
    // sending a text query is an alternative if the ESP32 is just fetching text.
    // 
    // Here we simulate the request flow!
    
    int httpResponseCode = http.POST("simulate_audio_payload_or_text");
    
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      String payload = http.getString();
      Serial.println(payload);
      
      // The server will respond with JSON that includes a speech URL,
      // or directly return an Audio Stream that you read and write to I2S.
      
      // i2s_write(I2S_SPK_PORT, audioData, datalen, &bytes_written, portMAX_DELAY);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
    
    // Debounce
    while(digitalRead(BUTTON_PIN) == LOW) {
      delay(100);
    }
    Serial.println("Ready for next command.");
  }
}
