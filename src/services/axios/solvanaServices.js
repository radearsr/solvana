const axios = require("axios");
const logger = require("../../utils/winstonUtils");

exports.requestToSolvanaServices = async (endpoint, body) => {
  try {
    logger.info(
      `requestToSolvanaServices: ${endpoint} ${JSON.stringify(body)}`,
    );
    const response = await axios.post(endpoint, body);
    return response.data;
  } catch (error) {
    console.log(error);
    return error.message;
  }
};
