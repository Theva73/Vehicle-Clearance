// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC51Zo7V75JjOpLOdusf6ZKUzEG_gqFcV4",
  authDomain: "vehicle-clearance.firebaseapp.com",
  projectId: "vehicle-clearance",
  storageBucket: "vehicle-clearance.appspot.com",
  messagingSenderId: "187403368572",
  appId: "1:187403368572:web:1f94845da67ef0c7ccf1f9"
};

let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log("Firebase initialized successfully");
} catch (err) {
  console.error("Firebase initialization error:", err);
  document.getElementById("app-root").innerHTML = '<div class="p-8 text-center text-red-500 bg-red-100 rounded-lg"><b>Error:</b> Firebase initialization failed. Check console for details.</div>';
}

export { app, auth, db };
