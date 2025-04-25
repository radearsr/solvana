require("dotenv").config();
const { Groq } = require("groq-sdk");
const logger = require("../../utils/winstonUtils");
const fileUtils = require("../../utils/fileUtils");

const client = new Groq({
  apiKey: process.env.GROQ_API_TOKEN,
});

async function clearNoiseToParseJson(resultMessage) {
  logger.debug(JSON.stringify({ defaultResponseJson: resultMessage }));
  if (!resultMessage.includes("```")) {
    return JSON.parse(resultMessage);
  }
  const removedNoise = resultMessage.replace("json", "").replace(/```/g, "");
  const clearJson = removedNoise.replace(/(\r\n|\n|\r)/gm, "");
  logger.debug(JSON.stringify({ clearJson }));
  const resultJsonParsed = JSON.parse(clearJson);
  return resultJsonParsed;
}

async function askToCategories(message) {
  const askToCategoriesChatHistory = fileUtils.readJsonFile(
    "./src/config/askToCategoriesChatHistory.json",
  );
  const availableService = fileUtils.readJsonFile(
    "./src/config/availableService.json",
  );
  const serviceListMessage = availableService
    .map((service, idx) => `${idx + 1}.${service.name}: ${service.description}`)
    .join("\n");
  const systemPrompt = `
  Kamu adalah solvana, asisten IT yang ramah dan profesional, dan dibawah ini adalah layanan yang bisa kamu berikan:
  ${serviceListMessage}
  jawab menggunakan bahasa indonesia dengan ramah, tambahkan sedikit emoji(jangan gunakan diakhir jawaban), dan dengan format <jawaban> SERVICES <nama layanan> jika kamu bisa bantu
  `;
  if (askToCategoriesChatHistory.length === 12) {
    askToCategoriesChatHistory.splice(0, 2);
  }
  askToCategoriesChatHistory.push({ role: "user", content: message });
  const chatCompletion = await client.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      ...askToCategoriesChatHistory,
    ],
    model: "llama3-70b-8192",
    temperature: 1,
  });
  askToCategoriesChatHistory.push(chatCompletion.choices[0].message);
  const resultChatCompletion = chatCompletion.choices[0].message.content;
  if (!resultChatCompletion.includes("SERVICES")) {
    return {
      resultMessage: resultChatCompletion,
      categoryName: null,
      endpoint: null,
      body: null,
      description: null,
    };
  }
  fileUtils.writeJsonFile(
    "./src/config/askToCategoriesChatHistory.json",
    askToCategoriesChatHistory,
  );
  const categoryName = resultChatCompletion.split("SERVICES")[1];
  const matchedService = availableService.find((service) =>
    categoryName.includes(service.name),
  );
  logger.warn(JSON.stringify({ matchedService }));
  return {
    resultMessage: resultChatCompletion,
    categoryName,
    body: matchedService.requiredBody,
    endpoint: matchedService.apiEndpoint,
    description: matchedService.description,
    responseType: matchedService.responseType,
  };
}

async function askToGenerateJson(message, jsonExpectation, description) {
  logger.info(JSON.stringify({ message, jsonExpectation, description }));
  const chatCompletion = await client.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `
        dari pesan dibawah ini,
        ${message}
        bantu buatkan json datanya, jawab hanya dengan format json saja, tidak usah memberikan penjelasan apapun, ini untuk struktur jsonnya, dan ini adalah informasi tambahan ${description}
        ${JSON.stringify(jsonExpectation)}
        `,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 1,
  });
  const resultChatCompletion = chatCompletion.choices[0].message.content;
  logger.info(JSON.stringify({ resultChatCompletion }));
  return clearNoiseToParseJson(resultChatCompletion);
}

module.exports = { askToCategories, askToGenerateJson };
