import { describe } from 'mocha';
import chai, { expect } from 'chai';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// Testing dbClient
describe('dbClient', () => {
  it('should check if mongodb is connected', () => {
    const isValid = dbClient.isAlive();
    expect(isValid).to.be.true;
  });

  it('should count the number of users doc and return them', async () => {
    const value = await dbClient.nbUsers();
    expect(value).to.equal(1);
  });

  it('should count the number of files doc and return them', async () => {
    const value = await dbClient.nbFiles();
    expect(value).to.equal(4);
  });
});

// Testing redisClient
describe('redisClient', () => {
  it('should check if redis is connected', () => {
    const isConnected = redisClient.isAlive();
    expect(isConnected).to.be.true;
  });

  it('should set a value in redis', async () => {
    await redisClient.set('testKey', 'testValue', 3600);
    const value = await redisClient.get('testKey');
    expect(value).to.equal('testValue');
  });

  it('should delete a key from redis', async () => {
    await redisClient.del('testKey');
    const value = await redisClient.get('testKey');
    expect(value).to.be.null;
  });
});
