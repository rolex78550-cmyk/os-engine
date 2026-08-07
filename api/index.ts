/**
 * Vercel Serverless Function Entry Point (catch-all for /api/*)
 * 
 * Imports the main Express app from the bundled server build.
 * All manifestation endpoints are registered in server.ts.
 */
// @ts-ignore
import app from './_server.cjs';

export default app;
