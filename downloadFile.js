require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configure your Cloudinary credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });



// URL of the file you want to download (unsigned)
const unsignedUrl = 'https://res.cloudinary.com/dumrbxh9p/raw/upload/v1716410785/stockages/test.nodemailer.pfe2024%40gmail.com-1716410780047-candidature.pdf';

// Function to create a signed URL
function getSignedUrl(unsignedUrl) {
  const urlParts = unsignedUrl.split('/');
  const publicIdWithExtension = urlParts.slice(-1)[0];
  const folder = urlParts.slice(-3, -1).join('/');
  const publicId = folder + '/' + publicIdWithExtension.split('.')[0];

  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'upload',
    sign_url: true
  });
}

// Get the signed URL
const signedUrl = getSignedUrl(unsignedUrl);

// Path where the file will be saved locally
const localFilePath = path.resolve(__dirname, 'downloaded_file.pdf');

// Function to download the file
async function downloadFile(url, filePath) {
  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// Download the file
downloadFile(signedUrl, localFilePath)
  .then(() => {
    console.log('File downloaded successfully');
  })
  .catch(error => {
    console.error('Error downloading the file:', error);
  });
