const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const devicesRouter = require('./routes/devices');
const approvalRouter = require('./routes/approval');
const auditRouter = require('./routes/audit');

const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../web-mobile')));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

app.use('/devices', devicesRouter);
app.use('/api/v1/devices', devicesRouter);
app.use('/approvals', approvalRouter);
app.use('/api/v1/approval', approvalRouter);
app.use('/audit', auditRouter);
app.use('/api/v1/audit', auditRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../../web-mobile/index.html')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        // Basic echo or ws handling for now
    });
});

if (require.main === module) {
    server.listen(3000, () => {
        console.log('Server started on port 3000');
    });
}

module.exports = { app, server };
