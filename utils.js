const getClientIp = function (req) {
  let ipAddress = req.connection.remoteAddress;
  if (!ipAddress) {
    return "";
  }
  // convert from "::ffff:192.0.0.1"  to "192.0.0.1"
  if (ipAddress.substr(0, 7) == "::ffff:") {
    ipAddress = ipAddress.substr(7);
  }
  return ipAddress;
};

// function to get the secret associated to the key id
function getSecret(keyId, done) {
  if (!apiKeys.has(keyId)) {
    return done(new Error("Unknown api key"));
  }
  const clientApp = apiKeys.get(keyId);
  done(null, clientApp.secret, {
    id: clientApp.id,
    name: clientApp.name,
  });
}

module.exports = {
  getClientIp,
  getSecret,
};
