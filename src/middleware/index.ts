import { Request, Response, NextFunction } from 'express';

export function captureRawBody(req: Request, res: Response, next: NextFunction) {
    req.rawBody = Buffer.alloc(0);

    req.on('data', (chunk) => {
        req.rawBody = Buffer.concat([req.rawBody as Buffer, chunk]);
    });

    req.on('end', () => {
        next();
    });
}

