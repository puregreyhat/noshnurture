# HeyNosh Companion Device (ESP32)

## Description
This folder contains the firmware and wiring instructions to turn an ESP32-S3 into a "HeyNosh" smart speaker prototype.

Current hardware approach:
- start with push-to-talk using the button
- confirm Wi-Fi, backend call, and command handling first
- add true wake-word listening later only if you still want it

## 🛒 Hardware Components Needed
1. **ESP32-S3 DevKitC** or similar ESP32 board
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
   Open `HeyNosh.ino` and replace:
   - `WIFI_SSID`
   - `WIFI_PASSWORD`
   - `API_ENDPOINT` (for example `http://YOUR_LOCAL_IP:3000/api/heynosh`)
   - `API_TOKEN` (keep this aligned with your backend auth setup)
4. **Upload!**
   - Connect the ESP32 via USB.
   - Select the correct board and port.
   - Click Upload.

## 🗣️ How to Use
1. Power on the ESP32. It will connect to Wi-Fi.
2. Open Serial Monitor at `115200`.
3. Press the push button.
4. The board will send the default HeyNosh query to your backend.
5. You should see the backend JSON response in Serial Monitor.

If you want voice capture and speaker playback next, that becomes the second phase. For the first pass, this button flow is the reliable way to confirm the hardware, network, and backend are working together.
