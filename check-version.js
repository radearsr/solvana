const fs = require("fs");

const packageJsonPath = "./package.json";
const gitShowCmd = `git show HEAD:${packageJsonPath}`;

try {
  const prevPackageJson = require("child_process").execSync(gitShowCmd, {
    encoding: "utf-8",
  });

  const prevVersion = JSON.parse(prevPackageJson).version;
  const currentVersion = JSON.parse(
    fs.readFileSync(packageJsonPath, "utf-8"),
  ).version;

  if (prevVersion === currentVersion) {
    console.error(
      "⛔ Version in package.json must be updated before committing.",
    );
    process.exit(1);
  }
} catch (error) {
  console.log(
    "No previous commit found or unable to retrieve previous package.json. Skipping check.",
    error.message,
  );
  process.exit(0);
}
