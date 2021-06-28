const router = require("express").Router();

router.get("/endpoint1", (req, res, next) => {
  //do something
  return res.status(400).json({ message: `hello world` });
});

router.post("/endpoint2", (req, res, next) => {
  //do something

  return res
    .status(400)
    .json({ message: "This is what you sent: ", ...req.body });
});

router.get("/endpoint3", (req, res, next) => {
  //do something
  return res.status(400).json({ message: "Endpoint 3" });
});

router.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

module.exports = router;
