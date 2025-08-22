import { listenClearances, listenVVIPs } from "./db.js";
import { state } from "./state.js";

export function attachDataStreams(){
  listenClearances(list => state.clearances = list);
  listenVVIPs(list => state.vvips = list);
}
