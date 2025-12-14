import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase para Jobuzetti (job-sa)
const firebaseConfig = {
******
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
