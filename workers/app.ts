import type { AppLoadContext, EntryContext } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { createRequestHandler } from "@react-router/serve";

export interface Env {
  UPLOAD_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const loadContext: AppLoadContext = {
      cloudflare: {
        env,
        ctx: context,
        params: {},
      },
    };

    const build = await import("../build/manifest.json");
    const manifest = build.manifest as EntryContext["manifest"];

    const response = await createRequestHandler(
      request,
      manifest,
      loadContext,
      createReadableStreamFromReadable,
    );

    return response;
  },
};
