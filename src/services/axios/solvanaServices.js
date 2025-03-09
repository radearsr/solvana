const axios = require("axios");

exports.requestToSolvanaServices = async (endpoint, body) => {
  try {
    const response = await axios.post(endpoint, JSON.parse(body));
    return response.data;
  } catch (error) {
    console.log(error);
    return error.message;
  }
};
