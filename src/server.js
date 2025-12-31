require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const connectDB = require('./config/db');

const activityLoggerMiddleware = require('./middleware/activityLoggerMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const requestIdMiddleware = require('./middleware/requestIdMiddleware');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
const tokenBlacklistMiddleware = require('./middleware/tokenBlacklistMiddleware');

const routes = require('./routers/routes');
const {
    initSocket
} = require('./services/socketService');

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

connectDB();

initSocket(server);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(morgan('dev'));

app.use(requestIdMiddleware);
app.use(tokenBlacklistMiddleware);
app.use(activityLoggerMiddleware);
app.use(rateLimitMiddleware(100, 60));

app.use('/api', routes);

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Trendverse API is running',
        timestamp: new Date()
    });
});

app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'API Route not found'
    });
});

app.use(errorMiddleware);

require('./subscribers')();

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port http://localhost:${PORT}`);
});