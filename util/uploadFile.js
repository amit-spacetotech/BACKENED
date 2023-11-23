const fs = require("fs/promises");
const { S3 } = require("aws-sdk");

const s3 = new S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

module.exports.uploadFileToS3 = async (file, fileName) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: file,
    // ACL: "public-read",
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, function (err, data) {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve(data.Location);
    });
  });
};

const path = require("path");

const getFileNameWithoutExtension = (s3Url) => {
  const urlParts = new URL(s3Url);
  const fileName = path.basename(urlParts.pathname);

  // Remove the ".m3u8" extension
  const fileNameWithoutExtension = fileName.replace(/\.m3u8$/, "");

  return "converted/" + fileNameWithoutExtension;
};

module.exports.getBucketFolderFiles = async (url) => {
  const folderName = getFileNameWithoutExtension(url);

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Prefix: folderName,
  };

  return new Promise((resolve, reject) => {
    s3.listObjectsV2(params, (err, data) => {
      if (err) {
        console.error(err);
        reject(err); // Reject the Promise with the error
      } else {
        // Extract the object keys (file names) from the S3 response
        const fileKeys =
          data &&
          data.Contents.map((object) => "https://cdn.okomo.in/" + object.Key);
        resolve(fileKeys); // Resolve the Promise with the fileKeys
      }
    });
  });
};
