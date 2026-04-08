import admin from "firebase-admin";
import serviceAccount from "../services/eventtix-web-firebase-adminsdk-fbsvc-46c91df9a8.json" with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const sendNotification = async (fcmToken, title, body) => {
  const message = {
    notification: { title: body },
    token: fcmToken,
  };
  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
  } catch (error) {
    console.error("Error sending message:", error);
  }
};
