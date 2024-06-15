import { createClient } from "redis";

class RedisClient {
    constructor() {
        this.client = createClient();

        this.client.on('connect', () => {
            // console.log("Redis client connected to the server");
        })

        this.client.on('error', (error) => {
            console.log(error)
        })

    }

    isAlive() {
        return this.client.connected;
    }
    

    async get(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, reply) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    async set(key, value, duration) {
        return new Promise((resolve, reject) => {
            this.client.set(key, value, 'EX', duration, (err, reply) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(reply)
                }
            });
        });
    }

    async del(key) {
        return new Promise((resolve, reject) => {
            this.client.del(key, (err, reply) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(reply)
                }
            });
        });
    }
}

const redisClient = new RedisClient();
export default redisClient;