import aws from "aws-sdk";
import jimp from "jimp";

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

export const handler = async (event) => {
   const { Records } = event;
   try {
      const arrayOfProms = Records.map(async (record) => {
         const file = record.s3.object.key;
         const bucket = record.s3.bucket.name;
         if (file.split("/")[0] === "profilePics") {
            await resizeImage({ bucket, file, height: 100, width: 100, folderName: "profilePics" });
            await resizeImage({ bucket, file, height: 1000, width: 1000, folderName: "profilePics" });
            return;
         } else if (file.split("/")[0] === "postThumbnail") {
            await resizeImage({ bucket, file, height: 300, width: 300, folderName: "postThumbnail" });
            return;
         } else if (file.split("/")[0] === "postMedia") {
            return;
         }
         return;
      });

      await Promise.all(arrayOfProms);

      return { statusCode: 200 };
   } catch (e) {
      console.log(`Error: ${e}`);
      return { statusCode: 400 };
   }
};

const resizeImage = async ({ bucket, file, height, width, folderName }) => {
   const objectBuffer = await s3.getObject({ Bucket: bucket, Key: file }).promise();
   const jimpImg = await jimp.read(objectBuffer.Body);
   const mime = jimpImg.getMIME();

   const resizedObjectBuffer = await jimpImg.scaleToFit(width, height).getBufferAsync(mime);

   const fileName = file.split("/")[1];
   const newFileName = `resized/${folderName}/${width}x${height}/${fileName}`;

   await s3.putObject({ Bucket: bucket, Key: newFileName, Body: resizedObjectBuffer, ContentType: mime }).promise();

   if (folderName === "profilePics" && height === 1000 && width === 1000) {
      await s3.deleteObject({ Bucket: bucket, Key: file }).promise();
   } else if (folderName === "postThumbnail" && height === 300 && width === 300) {
      await s3.deleteObject({ Bucket: bucket, Key: file }).promise();
   }
   return newFileName;
};
