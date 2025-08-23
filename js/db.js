// Unified Firestore re-exports + db instance
// Fixes: "does not provide an export named 'Timestamp' / 'db'"
import { db } from "./firebase.js";
export { db };

export {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  limit,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
