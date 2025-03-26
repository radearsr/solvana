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

function readJsonFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContent || "[]");
  } catch (error) {
    console.error("Error reading file:", error);
    return [];
  }
}

function writeJsonFile(filePath, data) {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonData);
  } catch (error) {
    console.error("Error writing file:", error);
  }
}

module.exports = { getFullPathFilesInDirectory, readJsonFile, writeJsonFile };
