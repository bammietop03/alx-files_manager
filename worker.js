import Bull from 'bull';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import path from 'path';
import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });
  if (!file) {
    throw new Error('File not found');
  }

  const filePath = path.join('/path/to/files', file.localPath); // Adjust the base path as needed

  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }

  const sizes = [500, 250, 100];
  for (const size of sizes) {
    try {
      const thumbnail = await imageThumbnail(filePath, { width: size });
      const thumbnailPath = filePath.replace(/(\.[\w\d_-]+)$/i, `_${size}$1`);
      fs.writeFileSync(thumbnailPath, thumbnail);
    } catch (error) {
      console.error(`Error generating thumbnail for size ${size}:`, error);
    }
  }

  done();
});

fileQueue.on('completed', (job, result) => {
  console.log(`Job completed with result ${result}`);
});

fileQueue.on('failed', (job, err) => {
  console.log(`Job failed with error ${err}`);
});
