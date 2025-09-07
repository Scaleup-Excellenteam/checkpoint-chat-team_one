import { Request, Response, NextFunction } from 'express';

// error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        status: 500,
        message: 'Something broke!',
        error: err.message
    });
};

export default errorHandler;