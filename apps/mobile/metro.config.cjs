const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
// Resolve all native imports against the app's React, also for workspace packages.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react" || moduleName.startsWith("react/"))
    return {
      type: "sourceFile",
      filePath: require.resolve(moduleName, { paths: [__dirname] }),
    };
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
