const AWS = require('aws-sdk');
const util = require('util');
const sharp = require('sharp');
                
// get reference to S3 client
const s3 = new AWS.S3();
                
exports.handler = async (event, context, callback) => {
                
// Read options from the event parameter.
console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
const srcBucket = event.Records[0].s3.bucket.name;
console.log(event);
console.log(srcBucket);
// Object key may have spaces or unicode non-ASCII characters.
const srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
let srcKeyReduced = srcKey.split('/')[1];
console.log(srcKeyReduced);
const dstBucket = srcBucket;
console.log(dstBucket);
                
// Infer the image type from the file suffix.
const typeMatch = srcKeyReduced.match(/\.([^.]*)$/);
if (!typeMatch) {
  console.log("Could not determine the image type.");
  return;
}
                
// Check that the image type is supported
const imageType = typeMatch[1].toLowerCase();
if (imageType != "jpg" && imageType != "png" && imageType != "jpeg") {
  console.log(`Unsupported image type: ${imageType}`);
  return;
}
                
// Download the image from the S3 source bucket.
                
try {
  const params = {
    Bucket: srcBucket,
    Key: `images/${srcKeyReduced}`
  };
  var origimage = await s3.getObject(params).promise();
                
} catch (error) {
  console.log(error);
  return;
}        
// set thumbnail width. Resize will set the height automatically to maintain aspect ratio.
const width  = 200;
                
// Use the sharp module to resize the image and save in a buffer.
try {
  var buffer = await sharp(origimage.Body).resize(width).toBuffer();
                
} catch (error) {
  console.log(error);
  return;
}
                
// Upload the thumbnail image to the destination bucket
try {
  const destparams = {
    Bucket: dstBucket,
    Key: `thumbnails/${srcKeyReduced}`,
    Body: buffer,
    ContentType: "image"
  };
  console.log(`DESTPARAMS: ${destparams}`);              
  const putResult = await s3.putObject(destparams).promise();
  console.log(`DESTPARAMS: ${putResult}`);
                
  } catch (error) {
    console.log(error);
    return;
  }
                
  console.log('Successfully resized ' + srcBucket + '/' + srcKeyReduced +
    ` and uploaded to ${dstBucket}/thumbnails/${srcKeyReduced}`);
  };