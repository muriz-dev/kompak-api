import { Hono } from 'hono'
import { cors } from "hono/cors";
import { dbMiddleware } from "./db/connection";
import { errorHandler } from './middlewares/error-handler';
import type { Env } from './types';
import router from './routes';
import { ApiResponse } from './utils/api-response';
import { getObject } from './libs/storage';

const app = new Hono<Env>()

app.use("*", (c, next) =>
  cors({
    origin: c.env.CORS_ORIGINS,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })(c, next)
);

app.get("/storage/*", async (c) => {
  const key = c.req.path.replace("/storage/", "");
  if (!key) return c.notFound();

  const object = await getObject(c.env, key);
  if (!object || !object.Body) return c.notFound();

  const headers = new Headers();
  if (object.ContentType) headers.set("Content-Type", object.ContentType);
  if (object.ContentLength) headers.set("Content-Length", object.ContentLength.toString());
  if (object.ETag) headers.set("ETag", object.ETag);

  // Tambahkan Cache-Control agar di-cache oleh browser dan Cloudflare CDN
  // Ini adalah pertahanan utama terhadap DDoS untuk endpoint aset statis
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  // @ts-ignore: AWS SDK body stream is compatible with Response
  return new Response(object.Body, { headers });
});

app.onError(errorHandler);

app.use("*", dbMiddleware);

app.route("/", router);

app.get("/", (c) => {
  return ApiResponse.ok(c, "Kompak API is running");
});

export default app
