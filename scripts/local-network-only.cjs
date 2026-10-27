// Explicit offline-mode boundary: Node processes may connect only to loopback.
const net = require("node:net");
const { syncBuiltinESMExports } = require("node:module");
const allowed = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "::ffff:127.0.0.1",
]);
function rejectHost(host) {
  if (!allowed.has(String(host).toLowerCase())) {
    const error = new Error(
      `Offline mode blocks non-local connections to ${host}.`,
    );
    error.code = "ENETUNREACH";
    throw error;
  }
}
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  let options = args[0];
  if (Array.isArray(options)) options = options[0];
  if (options && typeof options === "object") {
    // Local IPC sockets and named pipes do not contact the internet.
    if (!options.path || options.port || options.host || options.hostname)
      rejectHost(options.host || options.hostname || "localhost");
  } else if (typeof options === "number" || /^\d+$/.test(String(options))) {
    rejectHost(typeof args[1] === "string" ? args[1] : "localhost");
  } else if (typeof options === "string") {
    if (!options.startsWith("/") && !options.startsWith("\\\\.\\pipe\\"))
      rejectHost(options);
  }
  return connect.apply(this, args);
};
if (globalThis.fetch) {
  const fetch = globalThis.fetch;
  globalThis.fetch = async function (input, init) {
    const url = new URL(
      typeof input === "string" || input instanceof URL ? input : input.url,
    );
    rejectHost(url.hostname);
    return fetch(input, init);
  };
}
syncBuiltinESMExports();
