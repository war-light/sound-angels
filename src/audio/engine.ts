// Public audio facade. Live music/combat state lives outside React;
// Tone.js Transport + scheduling details live in ./player.
export { ensureAudio, isAudioReady, setVolume } from "./context"
export { isPlaying, rewind, setBpm, start, stop } from "./player"
