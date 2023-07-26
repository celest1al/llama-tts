import { browserCheck } from "./browser-check";

export function getDefaultVoice(): SpeechSynthesisVoice {
  const browser = browserCheck();
  const voices = window.speechSynthesis.getVoices();

  if (browser === "chrome") {
    return (
      voices.find((voice) => voice.name === "Google US English") ?? voices[0]
    );
  } else if (browser === "firefox") {
    return (
      voices.find((voice) => voice.name === "English (United States)") ??
      voices[0]
    );
  } else if (browser === "edge") {
    return (
      voices.find(
        (voice) =>
          voice.name ===
          "Microsoft Aria Online (Natural) - English (United States)"
      ) ?? voices[0]
    );
  } else {
    return voices[0];
  }
}
