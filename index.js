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
   const { Records } = event;
   try {
      const arrayOfProms = Records.map(async (record) => {
         const file = record.s3.object.key;
         if (file.split("/")[0] !== "profilePics") return;
         const bucket = record.s3.bucket.name;
         await resizeImage({ bucket, file, height: 200, width: 200 }); // call this function with different widths and heights to get multiple sizes of the same image.
         await resizeImage({ bucket, file, height: 1000, width: 1000 });
         return;
      });

      await Promise.all(arrayOfProms);

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

   if(height === 1000 && width === 1000) {
      await s3.deleteObject({Bucket: bucket, Key: file}).promise();
   }
   return newFileName;
};
