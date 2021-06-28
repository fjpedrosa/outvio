const createError = require("http-errors");
const express = require("express"),
  ipfilter = require("ipfilter");
const logger = require("morgan");
const chalk = require("chalk");
const { RequestLimiter } = require("./maxRequest");
const { getSecret } = require("./utils");
const apiKeyAuth = require("api-key-auth");
require("dotenv").config();

const port = process.env.PORT || 3000;

const { json, urlencoded } = express;

const app = express();

const ips = process.env.BLACKLIST;
// Create the collection of api keys
// const apiKeys = new Map();
// apiKeys.set("123456789", {
//   id: 1,
//   name: "app1",
//   secret: "secret1",
// });

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use((req, res, next) => {
  if (req.headers["x-api-key"] !== process.env.APIKEY) {
    // res.status(403).send("Forbidden");
    throw new Error("Forbidden");
  }
  return next();
}, RequestLimiter);
// app.use(RequestLimiter);
// app.use(apiKeyAuth({ getSecret }));
app.use("/api", ipfilter(ips));
// require api routes here after I create them
app.use("/api", require("./routes/api"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   console.log(err);
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.json({ error: err });
// });

// Express Error Handler
app.use((err, req, res, next) => {
  if (err.message.match(/not found/)) {
    return res.status(404).send({ error: err.message });
  }
  if (err.message === "Forbidden") {
    return res.status(403).send(err.message);
  }
  res.status(500).send({ error: err.message });
});

function handleFatalError(err) {
  console.error(`${chalk.red("[fatal error]")} ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}

if (!module.parent) {
  process.on("uncaughtException", handleFatalError);
  process.on("unhandledRejection", handleFatalError);

  app.listen(port, () => {
    console.log(
      `${chalk.green("[Outvio-api]")} server listening on port ${port}`
    );
  });
}

module.exports = app;
