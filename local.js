const server = require("./server");
const PORT = 8080;

server.listen(PORT, () => {
  console.log("server listen on port " + PORT);
});
