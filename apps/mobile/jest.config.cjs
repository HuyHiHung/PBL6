module.exports = {
  preset: "jest-expo",
  testTimeout: 15000,
  testMatch: ["<rootDir>/tests/**/*.test.tsx"],
  moduleNameMapper: {
    "^react$": require.resolve("react"),
    "^react/jsx-runtime$": require.resolve("react/jsx-runtime"),
    "^react/jsx-dev-runtime$": require.resolve("react/jsx-dev-runtime"),
    "^@sprout/api-client$": "<rootDir>/../../packages/api-client/src/index.ts",
  },
};
