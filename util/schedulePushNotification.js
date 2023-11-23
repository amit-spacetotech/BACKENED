const schedule = require("node-schedule");
const Notification = require("../models/Notification"); // Import your Notification model
const { sendPushNotification } = require("../util/sendPushNotification"); // Import your push notification function
const User = require("../models/User"); // Import your User model
const moment = require("moment");
// Function to schedule push notifications
module.exports.schedulePushNotifications = async () => {
  try {
    console.log("-----Scheduling Push Notification-----");
    // Fetch notifications that need to be scheduled
    const notifications = await Notification.find({
      type: "Push", // Filter by notification type if needed
      date: { $gte: new Date() }, // Filter notifications with a date in the future
    });

    // Schedule each notification
    notifications.forEach(async (notification) => {
      const { _id, title, message, date, time } = notification;

      const [timeValue, amPm] = time.split(" ");

      // Split the hours and minutes
      const [hours, minutes] = timeValue.split(":");

      // Convert hours and minutes to numbers
      const hoursNum = parseInt(hours, 10);
      const minutesNum = parseInt(minutes, 10);

      // Adjust hours for am/pm
      let adjustedHours = hoursNum;
      if (amPm.toLowerCase() === "pm" && hoursNum !== 12) {
        adjustedHours += 12;
      } else if (amPm.toLowerCase() === "am" && hoursNum === 12) {
        adjustedHours = 0;
      }

      // Create a new Date object with the adjusted hours and minutes
      const notificationTime = new Date(date);
      notificationTime.setHours(adjustedHours, minutesNum, 0);

      // Combine the date and time to create a valid notificationTime

      // Schedule the notification
      const job = schedule.scheduleJob(notificationTime, async () => {
        try {
          const usersToUpdate = []; // To store user IDs who have received the notification

          // Fetch all users from the User model
          const allUsers = await User.find({}, "_id");

          // Send the push notification to each user
          for (const user of allUsers) {
            if (user.fcmToken) {
              try {
                // Send the push notification
                await sendPushNotification({
                  title,
                  body: message,
                  fcmToken: user.fcmToken,
                  // Additional data if needed
                });

                usersToUpdate.push(user._id); // Add the user ID to the list
              } catch (error) {
                console.error(
                  `Error sending push notification to user ${user._id}:`,
                  error
                );
                // Continue processing other users even if there's an error
                continue;
              }
            }
          }

          // Update the notification with the list of users who received it
          await Notification.findByIdAndUpdate(_id, {
            $addToSet: { users: { $each: usersToUpdate } },
          });

          console.log(
            `Scheduled notification: ${title} for ${notificationTime}`
          );

          // Cancel the job after sending to all users
          job.cancel();
          console.log(`Cancelled notification: ${title}`);
        } catch (error) {
          console.error("Error sending push notification:", error);
        }
      });
    });
  } catch (error) {
    console.error("Error scheduling notifications:", error);
  }
};
