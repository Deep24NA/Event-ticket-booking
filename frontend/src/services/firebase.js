import { initializeApp } from "firebase/app";
import {getMessaging , getToken , onMessage} from "firebase/messaging";
import { config } from "./config";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB6sQXaC5Kcy9bQuH8scnXA7UZZJ1WFcK4",
  authDomain: "eventtix-web.firebaseapp.com",
  projectId: "eventtix-web",
  storageBucket: "eventtix-web.firebasestorage.app",
  messagingSenderId: "766131626579",
  appId: "1:766131626579:web:b291dda3112df315335ca6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    console.log("1. Requesting notification permission...");
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("2. Permission granted! Fetching FCM token...");
      
      // 🚨 Make sure 'const' is right here before the variable!
      const generatedToken = await getToken(messaging, { 
        vapidKey: config.FIRE_BASE_VPID // Put your actual VAPID key here
      });
      
      if (generatedToken) {
        console.log("3. Success! FCM Token generated:", generatedToken);
        return generatedToken;
      } else {
        console.warn("3. Failed to generate a token. Check your VAPID key.");
        return null;
      }
    } else {
      console.log("2. Notification permission was denied by the user.");
      return null;
    }
  } catch (error) {
    console.error("🚨 Token Request Error:", error);
    return null;
  }
};

export const onMessageListner = () => {
    return new Promise((resolve) => {
        onMessage(messaging , (payload) => {
            resolve(payload);
        })
    })
}