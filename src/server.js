require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const activityLoggerMiddleware = require('./middleware/activityLoggerMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const requestIdMiddleware = require('./middleware/requestIdMiddleware');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
const app = express();
const PORT = process.env.PORT || 5000;
connectDB();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(morgan('dev'));
app.use(requestIdMiddleware);
app.use(activityLoggerMiddleware);
app.use(rateLimitMiddleware(100, 60));
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
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port http://localhost:${PORT}`);
});