// src/types/express-session.d.ts
import * as session from 'express-session';

declare global {
    namespace Express {
        interface Session {
            account?: string; // Adding the `account` property
        }
    }
}
