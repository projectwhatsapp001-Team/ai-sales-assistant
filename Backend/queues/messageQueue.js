const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");

const messageQueue = new Queue("messages", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false, // Keep failures for debugging as requested
  },
});

module.exports = { messageQueue };
