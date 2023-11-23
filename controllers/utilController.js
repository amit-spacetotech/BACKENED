const { uploadFileToS3 } = require("../util/uploadFile");
const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { mediaConversion } = require("../util/mediaConversion");

module.exports.uploadFile = [
  async (req, res) => {
    try {
      console.log(req.files);
      if (req.files) {
        const imageFile = req.files.file;
        const extension = imageFile.name.split(".").pop();
        const fileName = `Img${Math.random() * 9999999}.${extension}`;

        let imgUrl = await uploadFileToS3(imageFile.data, fileName);
        if (imgUrl) {
          imgUrl;
          res.status(200).json({ url: imgUrl });
        }
      } else {
        res.status(400).json({ error: "File Not Found" });
      }
    } catch (err) {
      // console.log(err)
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.uploadFileVid = [
  async (req, res) => {
    try {
      if (req.files) {
        const videoFile = req.files.file;
        const extension = videoFile.name.split(".").pop();
        const fileName = `Video${Math.random() * 9999999}.${extension}`;

        // Save the uploaded video temporarily
        const tempFilePath = path.join(__dirname, "..", "uploads", fileName);
        await videoFile.mv(tempFilePath);

        // Output directory for HLS files
        const outputDir = path.join(__dirname, "..", "output");
        const uniqueIndexName = `index_${Date.now()}_${Math.random()}.m3u8`;
        // Convert video to HLS format
        ffmpeg(tempFilePath)
          .addOption("-hls_time", "10") // Segment duration in seconds
          .addOption("-hls_list_size", "0") // Keeps all segments in the playlist
          .output(path.join(outputDir, uniqueIndexName))
          .on("end", async () => {
            console.log("Video converted to HLS format");

            // Read the content of the merged uniqueIndexName playlist file
            const mergedPlaylistPath = path.join(outputDir, uniqueIndexName);
            const mergedPlaylistContent = fs.readFileSync(
              mergedPlaylistPath,
              "utf-8"
            );

            // Upload the merged playlist to S3
            const mergedPlaylistKey = `merged/${uniqueIndexName}`; // Adjust the key as needed
            const mergedPlaylistUrl = await uploadFileToS3(
              mergedPlaylistContent,
              mergedPlaylistKey
            );

            // Upload merged .ts segments to S3
            const uploadedTsUrls = [];
            const hlsFiles = fs.readdirSync(outputDir);
            for (const file of hlsFiles) {
              console.log("Current file:", file);
              if (!file.endsWith(".ts")) {
                console.log("Skipping index file:", file);
                continue;
              }

              const filePath = path.join(outputDir, file);
              const fileStream = fs.createReadStream(filePath);
              const tsKey = `merged/${file}`; // Adjust the key as needed
              const tsUrl = await uploadFileToS3(fileStream, tsKey);
              uploadedTsUrls.push(tsUrl);
            }

            // Clean up the temporary video file and HLS files
            fs.unlinkSync(tempFilePath);
            for (const file of hlsFiles) {
              fs.unlinkSync(path.join(outputDir, file));
            }

            const response = {
              message: "Video converted and uploaded successfully",
              playlistUrl: mergedPlaylistUrl,
              tsUrls: uploadedTsUrls,
            };

            res.status(200).json(response);
          })
          .run();
      } else {
        res.status(400).json({ error: "File Not Found" });
      }
    } catch (err) {
      console.error(err);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.statusCheck = [
  async (req, res) => {
    try {
      res.status(200).json({ message: "Recieved Successfuly" });
    } catch (err) {
      // console.log(err)

      res.status(400).json({ error: err });
    }
  },
];

module.exports.uploadVideoFile = [
  async (req, res) => {
    try {
      if (req.files) {
        const imageFile = req.files.file;
        const extension = imageFile.name.split(".").pop();

        const folderPath = "inputs";
        let randomFileName = `Img${Math.random() * 9999999}`;
        const fileName = `${randomFileName}.${extension}`;

        let imgUrl = await uploadFileToS3(
          imageFile.data,
          `${folderPath}/${fileName}`
        );
       
        if (imgUrl) {
          console.log("imgUrl", imgUrl);
          let fileInput = `s3://okomobucket/inputs/${fileName}`;
          let destination = `s3://okomobucket/converted/${randomFileName}/`;
          await mediaConversion(destination, fileInput);
          res.status(200).json({
            url: `https://cdn.okomo.in/converted/${randomFileName}/${randomFileName}.m3u8`,
          });
        }
      } else {
        res.status(400).json({ error: "File Not Found" });
      }
    } catch (err) {
      // Handle errors appropriately
      // let error = err.message;
      console.log(err, "error");
      res.status(400).json({ error: true });
    }
  },
];


