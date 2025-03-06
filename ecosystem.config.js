module.exports = {
  apps: [
    {
      name: "Solvana",
      script: "./src/index.js",
      watch: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
