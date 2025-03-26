module.exports = {
  apps: [
    {
      name: "Solvana",
      script: "./src/index.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
