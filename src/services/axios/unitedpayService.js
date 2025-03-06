const axios = require("axios");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const logger = require("../../utils/winstonUtils");
const { getFullPathFilesInDirectory } = require("../../utils/fileUtils");
const FormData = require("form-data");

const directories = {
  UNITEDPAY: process.env.UNITEDPAY_IMG_PATH,
  MURAPAY: process.env.MURAPAY_IMG_PATH,
};

const baseUrls = {
  UNITEDPAY: process.env.UNITEDPAY_API_UPLOAD_IMG_KYC,
  MURAPAY: process.env.MURAPAY_API_UPLOAD_IMG_KYC,
};

async function uploadVerificationImage(title, agenCode) {
  logger.info(
    `Uploading verification image for ${title} with agen code ${agenCode}`,
  );
  try {
    const baseFolderPath = directories[title];
    const directoryPath = path.join(baseFolderPath, agenCode);
    const filePaths = getFullPathFilesInDirectory(directoryPath);
    logger.info(JSON.stringify({ filePaths }));
    if (filePaths.length === 0) {
      return { success: false, message: "No file to upload" };
    }
    const formData = new FormData();
    formData.append("folderName", agenCode);
    for (const filePath of filePaths) {
      const fileName = path.basename(filePath);
      formData.append(
        "fileToUpload[]",
        fs.createReadStream(filePath),
        fileName,
      );
    }
    const apiUrl = baseUrls[title];
    const response = await axios.post(apiUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    return { success: false, message: "Error uploading file" };
  }
}

async function enableUserNonActive(title, agenCode) {
  logger.info(`Enable user non active for ${title} with agen code ${agenCode}`);
  console.log(
    `${
      process.env.HELPER_API_ENDPOINT
    }/${title.toLowerCase()}/enable-user-nonactive`,
  );

  const response = await axios.post(
    `${
      process.env.HELPER_API_ENDPOINT
    }/${title.toLowerCase()}/enable-user-nonactive`,
    {
      kode_agen: agenCode,
    },
  );
  return response.data;
}

module.exports = { uploadVerificationImage, enableUserNonActive };
