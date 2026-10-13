import { createServer } from "node:http";
import worker from "../worker/index.js";

const port = Number(process.env.PORT || 4173);

const server = createServer(async (req, res) => {
  const request = new Request(`http://localhost:${port}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
    duplex: "half",
  });

  const response = await worker.fetch(request, {}, {});
  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (response.body) {
    for await (const chunk of response.body) {
      res.write(Buffer.from(chunk));
    }
  }
  res.end();
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Dinner Roulette Splitter running at http://localhost:${port}`);
});
