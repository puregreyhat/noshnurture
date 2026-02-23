# HeyNosh Companion Device (ESP32)

## Description
This folder contains the firmware and wiring instructions to turn an ESP32 into a "HeyNosh" smart speaker.
The device connects to your Wi-Fi, listens for a prompt (via a physical button to avoid constant heavy ML wake-word processing on the ESP32), records the audio, and sends it to your NoshNurture Next.js backend. The backend processes the prompt, generates a conversational AI response using Gemini, and returns TTS (Text-to-Speech) audio which the ESP32 then plays back!

## 🛒 Hardware Components Needed
1. **ESP32 Development Board** (e.g., ESP32-WROOM-32)
2. **INMP441 Omnidirectional Microphone Module (I2S)**
3. **MAX98357A I2S Audio Amplifier Module**
4. **Speaker** (3W 4-Ohm or 8-Ohm)
5. **Push Button** (Momentary Switch)
6. **Breadboard and Jumper Wires**

## 🔌 Wiring Diagram

### 1. INMP441 Microphone (I2S Input)
| INMP441 Pin | ESP32 Pin | Note |
|-------------|-----------|------|
| VDD         | 3.3V      | Power |
| GND         | GND       | Ground |
| SD          | GPIO 32   | Serial Data |
| WS          | GPIO 25   | Word Select (L/R Clock) |
| SCK         | GPIO 33   | Serial Clock (BCLK) |
| L/R         | GND       | Selects Left channel |

### 2. MAX98357A Amplifier (I2S Output)
| MAX98357A Pin | ESP32 Pin | Note |
|---------------|-----------|------|
| VIN           | 5V / VIN  | Power (5V recommended for louder output) |
| GND           | GND       | Ground |
| DIN           | GPIO 22   | Data In |
| BCLK          | GPIO 26   | Bit Clock |
| LRC           | GPIO 27   | Left/Right Clock |
| Speaker +/-   | Speaker   | Connect to your speaker terminals |

### 3. Push Button
| Push Button Pin | ESP32 Pin |
|-----------------|-----------|
| Terminal 1      | GND       |
| Terminal 2      | GPIO 4    | (Uses internal pull-up resistor in code) |

## 🚀 Setup Instructions

1. **Install Arduino IDE** and add ESP32 board support.
2. **Install Required Libraries** in the Library Manager:
   - `ArduinoJson` (by Benoit Blanchon)
   - `WiFiClientSecure` (Built-in)
   - `HTTPClient` (Built-in)
   *(Note: The I2S functions are built-in for ESP32 cores)*
3. **Configure the Code:**
   Open `HeyNosh.ino` and replace the following at the top:
   - `WIFI_SSID`
   - `WIFI_PASSWORD`
   - `NOSHNURTURE_API_URL` (e.g. `http://YOUR_LOCAL_IP:3000/api/heynosh`)
   - `USER_ID_OR_TOKEN` (Pass the user ID or a secret token for authentication)
4. **Upload!**
   - Connect the ESP32 via USB.
   - Select the correct board and port.
   - Click Upload.

## 🗣️ How to Use
1. Power on the ESP32. It will connect to Wi-Fi.
2. Press and hold the push button.
3. Speak your prompt (e.g., *"What's in my inventory?"* or *"What can I cook with tomatoes?"*)
4. Release the button.
5. The ESP32 will send the audio to the server, and shortly after, the speaker will play the response!
