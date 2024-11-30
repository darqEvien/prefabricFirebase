import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// Firebase yapılandırman
const firebaseConfig = {
    apiKey: "AIzaSyA8UsQZNNkhW-76nND5uysnTp65E-OEcik",
    authDomain: "poroductuploadedpage.firebaseapp.com",
    databaseURL: "https://poroductuploadedpage-default-rtdb.firebaseio.com",
    projectId: "poroductuploadedpage",
    storageBucket: "poroductuploadedpage.appspot.com",
    messagingSenderId: "448207131997",
    appId: "1:448207131997:web:0bc357afb437fb8f1f44b4",
  };

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
export { db,analytics };