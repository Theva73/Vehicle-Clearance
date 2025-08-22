import { state } from "./state.js";
import { showNotification } from "./utils.js";

const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
const beep = (frequency=440, duration=100, type='sine') => {
  try{
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = type; osc.frequency.value = frequency;
    gain.gain.value = 0.3;
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration/1000);
    osc.start(); osc.stop(audioCtx.currentTime + duration/1000);
  }catch(e){}
};

const processVehicleNumber = (spoken) => {
  let p = spoken.toLowerCase().trim();
  ['um','uh','the','number','is','vehicle','car','plate'].forEach(w => p = p.replace(new RegExp(`\\b${w}\\b`, "gi"), " "));
  [
    ['zero','0'],['oh','0'],['o','0'],['one','1'],['won','1'],['two','2'],['to','2'],['too','2'],
    ['three','3'],['tree','3'],['four','4'],['for','4'],['fore','4'],['five','5'],['fife','5'],
    ['six','6'],['sex','6'],['seven','7'],['sven','7'],['eight','8'],['ate','8'],['nine','9'],['nein','9']
  ].forEach(([w,d]) => p = p.replace(new RegExp(`\\b${w}\\b`, "gi"), ` ${d} `));
  const digits = p.match(/\d+/g);
  return digits ? digits.join('') : '';
};
const valid = (v) => v && /^\d{3,8}$/.test(v);

export function bindVoice(buttonEl, inputEl, onComplete){
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showNotification("Voice search not supported on this device","error"); return;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  state.recognition = new SpeechRecognition();
  state.recognition.continuous = false;
  state.recognition.interimResults = false; state.recognition.lang = 'en-US'; state.recognition.maxAlternatives = 3;

  state.recognition.onstart = () => { state.isVoiceSearchActive = true; buttonEl.classList.add('listening'); };
  state.recognition.onend   = () => { if (state.isVoiceSearchActive) stop(); };
  state.recognition.onerror = (e) => {
    showNotification(e.error==='no-speech'?'No speech detected. Try again.':e.error==='not-allowed'?'Microphone permission denied.':'Voice error','error');
    stop();
  };
  state.recognition.onresult = (evt) => {
    let n = processVehicleNumber(evt.results[0][0].transcript);
    if (!valid(n) && evt.results[0].length>1){
      for (let i=1;i<evt.results[0].length;i++){
        const alt = processVehicleNumber(evt.results[0][i].transcript);
        if (valid(alt)){ n = alt; break; }
      }
    }
    if (valid(n)){ inputEl.value = n; inputEl.dispatchEvent(new Event('input',{bubbles:true})); showNotification(`Vehicle number "${n}" detected!`); onComplete?.(n); }
    else { showNotification(`Could not detect a valid number`,'error'); }
    stop();
  };

  const start = () => {
    if (state.isVoiceSearchActive) return stop();
    beep(523,150);
    state.voice.currentInput = inputEl; state.voice.currentButton = buttonEl;
    try{
      state.recognition.start();
      state.voice.timeout = setTimeout(()=>{ showNotification("Voice search timed out.","error"); stop(); }, 8000);
    }catch{ showNotification("Failed to start voice search","error"); }
  };
  const stop = () => {
    beep(392,150);
    if (state.recognition) try{ state.recognition.stop(); }catch{}
    if (state.voice.timeout) clearTimeout(state.voice.timeout);
    buttonEl.classList.remove('listening');
    state.isVoiceSearchActive=false; state.voice.currentInput=null; state.voice.currentButton=null; state.voice.timeout=null;
  };

  buttonEl.addEventListener('click', start);
}
