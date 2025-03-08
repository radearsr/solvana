const axios = require("axios");

exports.requestToSolvanaServices = async (endpoint, body) => {
  const response = await axios.post(endpoint, JSON.parse(body));
  return response.data;
};
