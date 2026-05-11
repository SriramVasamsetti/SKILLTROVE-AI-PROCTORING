const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log('Created /public/models directory');
}

const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

files.forEach(file => {
  const filePath = path.join(modelsDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Downloading ${file}...`);
    https.get(baseUrl + file, (res) => {
      const fileStream = fs.createWriteStream(filePath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        console.log(`Successfully downloaded ${file}`);
      });
    }).on('error', (err) => {
      console.error(`Error downloading ${file}:`, err.message);
    });
  } else {
    console.log(`${file} already exists, skipping...`);
  }
});
