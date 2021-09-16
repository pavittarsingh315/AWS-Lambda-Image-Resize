const aws = require("aws-sdk");
const jimp = require("jimp");

const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_BUCKET_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_BUCKET_SECRET_ACCESS_KEY;

const s3 = new aws.S3({
   region,
   signatureVersion: "v4",
   credentials: {
      accessKeyId,
      secretAccessKey,
   },
});

exports.handler = async (event) => {
   try {
      const bucket = await event.Records[0].s3.bucket.name;
      const file = await event.Records[0].s3.object.key;
      const height = 500;
      const width = 500;
      await resizeImage({ bucket, file, height, width }); // call this function with different widths and heights to get multiple sizes of the same image.

      return { statusCode: 200 };
   } catch (e) {
      console.log(`Error: ${e}`);
      return { statusCode: 400 };
   }
};

const resizeImage = async ({ bucket, file, height, width }) => {
   const objectBuffer = await s3.getObject({ Bucket: bucket, Key: file }).promise();
   const jimpImg = await jimp.read(objectBuffer.Body);
   const mime = jimpImg.getMIME();

   const resizedObjectBuffer = await jimpImg.scaleToFit(width, height).getBufferAsync(mime);

   const fileName = file.split("/")[1];
   const newFileName = `resized/profilePics/${width}x${height}/${fileName}`;

   await s3.putObject({ Bucket: bucket, Key: newFileName, Body: resizedObjectBuffer, ContentType: mime }).promise();
   return newFileName;
};
