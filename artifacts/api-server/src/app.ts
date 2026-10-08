// Configures JSON parsing, safe request logging, and the API router.
// Central error handling ensures malformed bodies never leak internal details.
import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "8kb" }));

app.use("/api", router);
const handleError: ErrorRequestHandler = (_error, _req, res, _next) => {
  res.status(400).json({ code: "BAD_REQUEST", message: "Please send a valid JSON request smaller than 8 KB." });
};
app.use(handleError);

export default app;
