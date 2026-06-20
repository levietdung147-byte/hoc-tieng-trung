// Server tĩnh đơn giản để chạy app local: node serve.js  → http://localhost:8765
const http = require("http"), fs = require("fs"), path = require("path");
const root = __dirname, port = 8765;
const types = { ".html":"text/html",".css":"text/css",".js":"text/javascript",".ics":"text/calendar",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".webmanifest":"application/manifest+json" };
http.createServer((req, res) => {
  let f = decodeURIComponent(req.url.split("?")[0]);
  if (f === "/") f = "/index.html";
  const fp = path.join(root, f);
  fs.readFile(fp, (e, data) => {
    if (e) { res.writeHead(404); return res.end("404"); }
    res.writeHead(200, { "Content-Type": types[path.extname(fp)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(port, () => console.log("http://localhost:" + port));
