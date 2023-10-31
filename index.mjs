import AWS from 'aws-sdk';
import QRCode from 'qrcode';

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });
const s3 = new AWS.S3();

// Define S3 bucket and key
const bucketName = 'qr-code-generator-anujsd';
const key = `qr-codes/${Date.now()}.png`;

export const handler = async (event) => {
  console.log(JSON.stringify(event));

  // Process POST request
  try {
    let requestBody;
    if (typeof event.body === 'string') {
      requestBody = JSON.parse(event.body);
    } else {
      requestBody = event.body; // Assuming it's already parsed
    }

    const { url } = requestBody;

    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'URL is required', body: requestBody }),
      };
    }

    // Generate QR code
    const qrCodeBuffer = await QRCode.toBuffer(url);

    // Upload QR code to S3
    await s3
      .putObject({
        Bucket: bucketName,
        Key: key,
        Body: qrCodeBuffer,
        ContentType: 'image/png',
      })
      .promise();

    // Construct the public URL of the QR code
    const publicUrl = `https://${bucketName}.s3.amazonaws.com/${key}`;

    // Return response with CORS headers
    return {
      statusCode: 200,
      body: JSON.stringify({ qrCodeUrl: publicUrl }),
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
