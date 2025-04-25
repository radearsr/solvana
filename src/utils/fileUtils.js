const fs = require("fs");
const path = require("path");
const logger = require("./winstonUtils");

exports.getFullPathFilesInDirectory = (directoryPath) => {
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
    logger.error(error);
    return [];
  }
};

exports.readJsonFile = (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContent || "[]");
  } catch (error) {
    logger.error(error);
    return [];
  }
};

exports.writeJsonFile = (filePath, data) => {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonData);
  } catch (error) {
    logger.error(error);
  }
};

exports.deleteFile = (filePath) => {
  try {
    fs.unlinkSync(filePath);
    logger.debug(`File deleted: ${filePath}`);
  } catch (error) {
    logger.error(`Error deleting file: ${filePath}`, error);
  }
};

exports.saveFileFromResponse = (response, filePath) => {
  const downloadsDir = path.join(__dirname, "downloads");
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }
  const tempFileName = path.basename(filePath);
  const savePath = path.join(downloadsDir, tempFileName);
  const writer = fs.createWriteStream(savePath);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      console.log(`File saved to ${savePath}`);
      resolve(savePath);
    });
    writer.on("error", reject);
  });
};

exports.getDetailsFromFile = (defaultFullpath, filePath) => {
  const filename = path.basename(defaultFullpath);
  const bufferSorce = fs.createReadStream(filePath);
  return {
    source: bufferSorce,
    filename,
  };
};
