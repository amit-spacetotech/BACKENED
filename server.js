const express = require("express");
const mongoose = require("mongoose");
const app = express();
const path = require("path");
require("dotenv").config();
const cors = require("cors");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const httpLogger = require("./util/createLogger");
const ffmpeg = require("fluent-ffmpeg");
//USER_ROUTE
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const categoryRoute = require("./routes/categoryRoute");
const followRoute = require("./routes/followRoute");
const postRoute = require("./routes/postRoute");
const admin = require("firebase-admin");
const serviceAccount = require("./config/service.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//ADMIN_ROUTE
const authAdminRoute = require("./routes/Dashboard/authRoute");
const userAdminRoute = require("./routes/Dashboard/userRoute");
const userManagementRoute = require("./routes/Dashboard/userManagementRoute");
const postMgmntRoute = require("./routes/Dashboard/postMgmntRoute");
const notificationRoute = require("./routes/Dashboard/notificationRoute");

//UTILS_ROUTE
const reportAndBlock = require("./routes/reportAndBlock");
const utilsRoute = require("./routes/utilsRoute");

//middleware
const { checkPermission } = require("./middleware/checkPermission");
const { checkGuestAccess } = require("./middleware/checkGuestAccess");
const {
  schedulePushNotifications,
} = require("./util/schedulePushNotification");

app.use("/static", express.static("views"));
app.get("/", (req, res) => res.send("Working!!!"));
// app.get("/vr", (req, res) => {
//   const queryParams = req.query;
//   const videoUrl = queryParams.video;
//   res.sendFile(path.join(__dirname, "views", "index.html"));
// });
app.use(cors());

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(httpLogger);
ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");
const dbURI = process.env.DB_URI;
mongoose.set("strictQuery", true);
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    app.listen(process.env.PORT, () => {
      schedulePushNotifications();
      console.log("Application Started in Port " + process.env.PORT);
    });
  })
  .catch((err) => console.log(err));

// ROUTES

//USER
app.use("/api/auth", checkGuestAccess(), authRoute);
app.use("/api/user", checkPermission(["USER"]), userRoute);
app.use("/api/category", categoryRoute);
app.use("/api/follow", checkPermission(["USER"]), followRoute);
app.use("/api/post", checkPermission(["USER"]), postRoute);

//Admin
app.use("/admin/auth", checkGuestAccess(), authAdminRoute);
app.use("/admin/user", checkPermission(["ADMIN"]), userAdminRoute);
app.use("/admin/customer", checkPermission(["ADMIN"]), userManagementRoute);
app.use("/admin/post", checkPermission(["ADMIN"]), postMgmntRoute);
app.use("/admin/notification", checkPermission(["ADMIN"]), notificationRoute);

//utils
app.use(
  "/api/reportOrBlock",
  checkPermission(["USER", "ADMIN"]),
  reportAndBlock
);
app.use("/api/utils", utilsRoute);

//Firebase
app.get("/deleteFirebaseChat", (req, res) => {
  const db = admin.firestore();
  const chatRoomId = req.query.chatRoomId;
  const parentDocRef = db.collection("ChatRoom").doc(chatRoomId);
  const subcollectionRef = parentDocRef.collection("chats");
  subcollectionRef
    .get()
    .then((querySnapshot) => {
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(subcollectionRef.doc(doc.id).delete());
      });
      return Promise.all(deletePromises);
    })
    .then(() => {
      return parentDocRef.delete();
    })
    .then(() => {
      res.json({ message: "Deletion Successfull" });
      console.log("Subcollection and its documents deleted successfully.");
    })
    .catch((error) => {
      console.error("Error deleting subcollection: ", error);
    });
});
