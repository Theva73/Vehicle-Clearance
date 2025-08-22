// js/voice-search.js
import { showNotification } from './utils.js';

let recognition = null;
let isVoiceSearchActive = false;
let currentVoiceInput = null;
let currentVoiceButton = null;

// Internal helper functions (not exported)
const processVehicleNumber = (spokenText) => {
    // ... (logic for processing speech to text)
};
const handleVoiceResult = (event) => {
    // ... (logic for handling the result)
};
const stopVoiceSearch = () => {
    // ... (logic to stop the search)
};


export const initializeVoiceRecognition = () => {
    // ... (logic to set up SpeechRecognition)
};

export const startVoiceSearch = (inputElement, buttonElement) => {
    // ... (logic to start listening)
};