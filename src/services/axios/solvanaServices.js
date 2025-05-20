const axios = require("axios");
const logger = require("../../utils/winstonUtils");
const utils = require("../../utils/fileUtils");

exports.solvanaService = async (endpoint, body) => {
  try {
    logger.info(`solvanaService: ${endpoint} ${JSON.stringify(body)}`);
    const response = await axios.post(endpoint, body);
    return response.data;
  } catch (error) {
    console.log(error);
    return error.message;
  }
};

exports.requestDownloadFile = async (filePath) => {
  try {
    console.log(`Downloading from: ${filePath}`);
    const response = await axios.get(process.env.DOWNLOAD_EXCEL_API, {
      responseType: "stream",
      params: { filePath },
    });
    return utils.saveFileFromResponse(response, filePath);
  } catch (error) {
    console.error("Download failed:", error.message);
  }
};

exports.requestDownloadFileFromUrl = async (url) => {
  try {
    console.log(`Downloading from: ${url}`);
    const response = await axios.get(url, {
      responseType: "stream",
    });
    return utils.saveFileFromResponse(response, url);
  } catch (error) {
    console.error("Download failed:", error.message);
  }
};
