require("dotenv").config();
/** If you want to use the local development environment with the dev backend,
 * this will create a proxy so you won't run into CORS issues.
 * It accepts the following command line parameters:
 * - port the port where the proxy will listen
 * - target the DEV backend target to contact.
 * Example: If you set the port to 3000 and target to https://dev.nibo.ai then
 * your actual "resourceBaseUrl" in NiboSettings should be http://localhost:3000/api/v1
 */
// parse command line options
const options = {
  target: process.env.TARGET,
  port: process.env.PORT,
  token: process.env.TOKEN,
};

// Start the proxy
console.log("Start proxy on port", options.port, "for", options.target);
var http = require("http"),
  httpProxy = require("http-proxy");

// Create a proxy server with custom application logic
var proxy = httpProxy.createProxyServer({});
var sendError = function (res, err) {
  return res.status(500).send({
    error: err,
    message: "An error occured in the proxy",
  });
};

// error handling
proxy.on("error", function (err, req, res) {
  sendError(res, err);
});

var enableCors = function (req, res) {
  if (req.headers["access-control-request-method"]) {
    res.setHeader(
      "access-control-allow-methods",
      req.headers["access-control-request-method"]
    );
  }

  if (req.headers["access-control-request-headers"]) {
    res.setHeader(
      "access-control-allow-headers",
      req.headers["access-control-request-headers"]
    );
  }

  if (req.headers.origin) {
    res.setHeader("access-control-allow-origin", req.headers.origin);
    res.setHeader("access-control-allow-credentials", "true");
  }
};

// set header for CORS
proxy.on("proxyRes", function (proxyRes, req, res) {
  enableCors(req, res);
});

var server = http.createServer(function (req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  if (req.method === "OPTIONS") {
    enableCors(req, res);
    res.writeHead(200);
    res.end();
    return;
  }
  req.headers.authorization = options.token;
  proxy.web(
    req,
    res,
    {
      target: options.target,
      secure: true,
      changeOrigin: true,
    },
    function (err) {
      sendError(res, err);
    }
  );
});

server.listen(options.port);
