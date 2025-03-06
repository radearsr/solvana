const fs = require("fs");
const path = require("path");

function getFullPathFilesInDirectory(directoryPath) {
  try {
    const files = fs.readdirSync(directoryPath);
    const filePaths = files.filter((file) =>
      fs.statSync(path.join(directoryPath, file)).isFile(),
    );
    const fullPathFiles = filePaths.map((file) =>
      path.join(directoryPath, file),
    );
    return fullPathFiles;
  } catch (error) {
    console.error("Error reading directory:", error);
    return [];
  }
}

module.exports = { getFullPathFilesInDirectory };
