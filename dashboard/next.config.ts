import type { NextConfig } from "next";

const staticDemo = process.env.CFO_STATIC_EXPORT === "1";
const basePath = staticDemo ? (process.env.CFO_DEMO_BASE_PATH ?? "/cfo-demo") : "";
if (basePath && !/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(basePath)) {
  throw new Error(
    "CFO_DEMO_BASE_PATH muss leer sein oder ein Pfad wie /cfo-demo ohne abschließenden Slash.",
  );
}

const nextConfig: NextConfig = {
  cacheComponents: !staticDemo,
  partialPrefetching: !staticDemo,
  ...(staticDemo ? { output: "export", trailingSlash: true, basePath } : {}),
};

export default nextConfig;
