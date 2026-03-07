import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/upload", "routes/upload.tsx"),
  route("/files/:filename", "routes/files.$filename.ts"),
] satisfies RouteConfig;
