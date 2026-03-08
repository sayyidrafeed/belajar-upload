import type { AppLoadContext } from "react-router";
import { createRequestHandler } from "react-router";
// @ts-expect-error - virtual module for Cloudflare Worker build
import build from "virtual:react-router/server-build";

export interface Env {
  UPLOAD_BUCKET: R2Bucket;
}

const requestHandler = createRequestHandler(build, import.meta.env.MODE);

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const loadContext: AppLoadContext = {
      cloudflare: {
        env,
        ctx: context,
      },
    };

    return requestHandler(request, loadContext);
  },
};
