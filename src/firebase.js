import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'; 

const firebaseConfig = {
    apiKey: "AIzaSyBPLCCGkUi2CLqaRO2adI8vBTrysDWX3jk",
    authDomain: "hcde-438-final-project-39717.firebaseapp.com",
    projectId: "hcde-438-final-project-39717",
    storageBucket: "hcde-438-final-project-39717.firebasestorage.app",
    messagingSenderId: "1056162958387",
    appId: "1:1056162958387:web:47cec2452e7118240f2746",
    measurementId: "G-J605TZ3S80"
 };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); 

export { db };