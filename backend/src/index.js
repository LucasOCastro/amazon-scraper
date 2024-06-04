import express from 'express'
import http from 'http'

const app = express();
app.use(express.json());

const server = http.createServer(app);
const port = 8080;
server.listen(port, () => {
    console.log(`Server running in port ${port}`);
});