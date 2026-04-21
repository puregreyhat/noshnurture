# noshnurture_mobile

This is a minimal HeyNosh phone app.

It does three things:
- uses the phone microphone for speech-to-text
- sends the transcript to `https://noshnurture.vercel.app/api/heynosh`
- shows the assistant reply in an in-app Serial Monitor panel

## Run
1. Open `noshnurture_mobile` in Flutter.
2. Run `flutter pub get`.
3. Launch on a phone or emulator with microphone support.
4. Tap the mic, speak your query, then stop to send it.

## Notes
- The app uses `speech_to_text` for the microphone step.
- The app sends `Bearer TEST_TOKEN_OR_USER_ID` by default.
- If you want a real user token later, replace the token in `lib/main.dart`.
- Android and iOS microphone permissions are already present in the project.
