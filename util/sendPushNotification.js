const { getMessaging } = require("firebase-admin/messaging");

module.exports.sendPushNotification = async ({
  title,
  body,
  fcmToken,
  data = {},
}) => {
  const message = {
    data: {
      ...data,
    },
    notification: {
      title: title ? title : "",
      body: body ? body : "",
    },
    token: fcmToken ? fcmToken : "",
  };

  try {
    console.log(message);
    const response = await getMessaging().send(message);
    console.log("Successfully sent message:", response);
    return response;
  } catch (error) {
    // console.log("Error sending message:", error);
    console.log(error, message);
    throw error;
  }
};
