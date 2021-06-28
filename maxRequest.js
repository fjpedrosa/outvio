const moment = require("moment");
const redis = require("redis");
require("dotenv").config();

const redisClient = redis.createClient();
const WINDOW_SIZE_IN_HOURS = 1;
const MAX_WINDOW_REQUEST_COUNT =
  process.env.MAX_REQUESTS_PER_HOUR.split(" ")[0] || 1000;
const WINDOW_LOG_INTERVAL_IN_HOURS = 1;

const RequestLimiter = (req, res, next) => {
  try {
    // check that redis client exists
    if (!redisClient) {
      throw new Error("Redis client does not exist!");
    }
    // fetch records of current user using IP address, returns null when no record is found
    redisClient.get(req.ip, function (err, record) {
      if (err) throw err;
      const currentRequestTime = moment();

      //  if no record is found , create a new record for user and store to redis
      if (record === null) {
        let newRecord = [];
        let requestLog = {
          requestTimeStamp: currentRequestTime.unix(),
          requestCount: 1,
        };
        newRecord.push(requestLog);
        redisClient.set(req.ip, JSON.stringify(newRecord));
        return next();
      }
      // if record is found, parse it's value and calculate number of requests users has made within the last window
      let data = JSON.parse(record);
      let windowStartTimestamp = moment()
        .subtract(WINDOW_SIZE_IN_HOURS, "hours")
        .unix();
      let requestsWithinWindow = data.filter((entry) => {
        return entry.requestTimeStamp > windowStartTimestamp;
      });

      let totalWindowRequestsCount = requestsWithinWindow.reduce(
        (accumulator, entry) => {
          return accumulator + entry.requestCount;
        },
        0
      );
      // if number of requests made is greater than or equal to the desired maximum, return error
      if (totalWindowRequestsCount >= MAX_WINDOW_REQUEST_COUNT) {
        res
          .status(429)
          .send(
            `You have exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_HOURS} hrs limit! Next request on ${moment(
              requestsWithinWindow.requestTimeStamp
            ).add(1, "hour")}`
          );
      } else {
        // if number of requests made is less than allowed maximum, log new entry
        let lastRequestLog = data[data.length - 1];
        let potentialCurrentWindowIntervalStartTimeStamp = currentRequestTime
          .subtract(WINDOW_LOG_INTERVAL_IN_HOURS, "hours")
          .unix();
        //  if interval has not passed since last request log, increment counter
        if (
          lastRequestLog.requestTimeStamp >
          potentialCurrentWindowIntervalStartTimeStamp
        ) {
          lastRequestLog.requestCount++;
          data[data.length - 1] = lastRequestLog;
        } else {
          //  if interval has passed, log new entry for current user and timestamp
          data.push({
            requestTimeStamp: currentRequestTime.unix(),
            requestCount: 1,
          });
        }
        redisClient.set(req.ip, JSON.stringify(data));
        next();
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  RequestLimiter,
};
