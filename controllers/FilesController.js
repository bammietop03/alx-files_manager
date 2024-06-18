import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import Bull from 'bull';
// import imageThumbnail from 'image-thumbnail';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const fs = require('fs');
const path = require('path');

const fileQueue = new Bull('fileQueue');

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-TOken');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    let parentFile = null;
    if (parentId !== 0) {
      parentFile = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const newFile = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : new ObjectId(parentId),
    };

    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const localPath = path.join(folderPath, uuidv4());
      const buffer = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, buffer);

      newFile.localPath = localPath;
    }

    if (type === 'image') {
      await fileQueue.add({ userId });
    }

    const result = await dbClient.db.collection('files').insertOne(newFile);

    return res.status(201).json({
      id: result.insertedId,
      userId: newFile.userId,
      name: newFile.name,
      type: newFile.type,
      isPublic: newFile.isPublic,
      parentId: newFile.parentId,
      localPath: newFile.localPath,
    });
  }

  static async getShow(req, res) {
    const token = req.header('X-TOken');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).send(file);
  }

  static async getIndex(req, res) {
    const token = req.header('X-TOken');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId ? new ObjectId(req.query.parentId) : 0;
    const page = req.query.page ? Number(req.query.page) : 0;
    const pageSize = 20;
    const skip = page * pageSize;

    if (parentId !== 0) {
      const parentFolder = await dbClient.db.collection('files').findOne({ _id: parentId, userId: new ObjectId(userId) });
      if (!parentFolder) {
        return res.status(200).json([]);
      }
    }

    const query = parentId === 0 ? {
      userId: new ObjectId(userId),
    } : { userId: new ObjectId(userId), parentId };

    const files = await dbClient.db.collection('files').aggregate([
      { $match: query },
      { $skip: skip },
      { $limit: pageSize },
    ]).toArray();

    return res.status(200).send(files);
  }

  static async putPublish(req, res) {
    const token = req.header('X-TOken');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const file = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(fileId), userId: new ObjectId(userId) },
      { $set: { isPublic: true } },
      { returnDocument: 'after' },
    );

    if (!file.value) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file.value);
  }

  static async putUnpublish(req, res) {
    const token = req.header('X-TOken');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const file = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(fileId), userId: new ObjectId(userId) },
      { $set: { isPublic: false } },
      { returnDocument: 'after' },
    );

    if (!file.value) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file.value);
  }

  static async getFile(req, res) {
    const token = req.header('X-TOken');

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!file.isPublic && (!userId || userId !== file.userId.toString())) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    const filePath = file.localPath;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    const fileContent = fs.readFileSync(filePath);

    if (!token && file.isPublic) {
      return res.status(200).send(fileContent);
    }
    return res.status(200).send(fileContent);
  }
}

export default FilesController;
