# An AWS Lambda function for resizing images

1. Make a zip of index.js, both package.json, and node_modules.
2. Go to s3 bucket, delete the old zip then upload the new zip. Once uploaded, get the link to the zip and copy it.
3. Go to lambda and click upload from, choose s3 location, then paste the link.
