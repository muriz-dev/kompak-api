import { Hono } from 'hono'
import { cors } from "hono/cors";
import { dbMiddleware } from "./db/connection";
import { errorHandler } from './middlewares/error-handler';
import type { Env } from './types';
import router from './routes';
import { ApiResponse } from './utils/api-response';

const app = new Hono<Env>()

app.use("*", (c, next) =>
  cors({
    origin: c.env.CORS_ORIGINS,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })(c, next)
);

app.onError(errorHandler);

app.use("*", dbMiddleware);

app.route("/", router);

app.get("/", (c) => {
  return ApiResponse.ok(c, "Kompak API is running");
});

export default app
