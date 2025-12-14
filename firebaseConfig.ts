import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase para Jobuzetti (job-sa)
const firebaseConfig = {
  apiKey: "AIzaSyAecje7rAO5IhZiksy93pOWYdLR7xiFRpM",
  authDomain: "job-sa.firebaseapp.com",
  databaseURL: "https://job-sa-default-rtdb.firebaseio.com",
  projectId: "job-sa",
  storageBucket: "job-sa.firebasestorage.app",
  messagingSenderId: "231252730923",
  appId: "1:231252730923:web:e4c102979a579c5294b66e",
  measurementId: "G-FJLFYM7E9J"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
