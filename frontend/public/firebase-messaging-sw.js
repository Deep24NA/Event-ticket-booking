importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");


firebase.initializeApp({
  apiKey: "AIzaSyB6sQXaC5Kcy9bQuH8scnXA7UZZJ1WFcK4",
  authDomain: "eventtix-web.firebaseapp.com",
  projectId: "eventtix-web",
  storageBucket: "eventtix-web.firebasestorage.app",
  messagingSenderId: "766131626579",
  appId: "1:766131626579:web:b291dda3112df315335ca6",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("Background Message:", payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
    body: payload.notification.body,
//    icon: "/logo192.png", 
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
})