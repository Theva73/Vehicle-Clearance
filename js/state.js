export const state = {
  clearances: [],
  vvips: [],
  routeHistory: [],
  authMode: "login",
  isVoiceSearchActive: false,
  recognition: null,
  voice: { currentInput: null, currentButton: null, timeout: null },
};
export const setAuthMode = (mode) => (state.authMode = mode);
export const pushRoute = (fn) => state.routeHistory.push(fn);
export const popRoute = () => state.routeHistory.pop();
