import express from 'express';
import http from 'http';
import cors from 'cors';
import scrape from "./routes/scrape.js";

const app = express();
app.use(cors())
app.use(express.json());

app.use('/api/scrape', scrape);

const server = http.createServer(app);
const port = 8080;
server.listen(port, () => {
    console.log(`Server running in port ${port}`);
});