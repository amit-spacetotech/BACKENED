const AWS = require("aws-sdk");
AWS.config.update({
  region: process.env.AWS_REGION,
  secretAccessKey: process.env.SECRET_ACCESS_MEDIA,
  accessKeyId: process.env.ACCESS_MEDIA,
});

module.exports.mediaConversion = async (destination, fileInput) => {
  try {
    const mediaConvert = new AWS.MediaConvert({
      endpoint: "https://htunurlzb.mediaconvert.ap-south-1.amazonaws.com",
    });

    const params = {
      Queue: "arn:aws:mediaconvert:ap-south-1:534531296699:queues/customQueue",
      UserMetadata: {},
      Role: "arn:aws:iam::534531296699:role/service-role/MediaConvert_Default_Role",
      Settings: {
        TimecodeConfig: {
          Source: "ZEROBASED",
        },
        OutputGroups: [
          {
            Name: "Apple HLS",
            Outputs: [
              {
                Preset: "1080P",
                OutputSettings: {
                  HlsSettings: {
                    SegmentModifier: "sm",
                  },
                },
                NameModifier: "nm",
              },
            ],
            OutputGroupSettings: {
              Type: "HLS_GROUP_SETTINGS",
              HlsGroupSettings: {
                SegmentLength: 10,
                Destination: destination,
                MinSegmentLength: 0,
              },
            },
          },
        ],
        Inputs: [
          {
            AudioSelectors: {
              "Audio Selector 1": {
                DefaultSelection: "DEFAULT",
              },
            },
            VideoSelector: {},
            TimecodeSource: "ZEROBASED",
            FileInput: fileInput,
          },
        ],
      },
      AccelerationSettings: {
        Mode: "DISABLED",
      },
      StatusUpdateInterval: "SECONDS_60",
      Priority: 0,
    };

    const createJobPromise = () => {
      return new Promise((resolve, reject) => {
        mediaConvert.createJob(params, (err, data) => {
          if (err) reject(err);
          else {
            resolve(data);
          }
        });
      });
    };

    const jobData = await createJobPromise();
    if (jobData) {
      return true;
    }
  } catch (error) {
    console.error(error);
  }
};
