require("dotenv").config();
const { Groq } = require("groq-sdk");
const logger = require("../../utils/winstonUtils");
const fileUtils = require("../../utils/fileUtils");

const client = new Groq({
  apiKey: process.env.GROQ_API_TOKEN,
});

async function clearNoiseToParseJson(resultMessage) {
  const resultJson = resultMessage.split("```")[1];
  const removedNoise = resultJson.replace("json", "");
  const clearJson = removedNoise.replace(/(\r\n|\n|\r)/gm, "");
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
  console.log({
    messages: [
      { role: "system", content: systemPrompt },
      ...askToCategoriesChatHistory,
    ],
  });
  const chatCompletion = await client.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      ...askToCategoriesChatHistory,
    ],
    model: "llama3-70b-8192",
    temperature: 1,
  });
  logger.info(JSON.stringify({ chatCompletion }));
  askToCategoriesChatHistory.push(chatCompletion.choices[0].message);
  const resultChatCompletion = chatCompletion.choices[0].message.content;
  if (!resultChatCompletion.includes("SERVICES")) {
    return {
      resultMessage: resultChatCompletion,
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
  return {
    resultMessage: resultChatCompletion,
    categoryName,
    body: matchedService.requiredBody,
    endpoint: matchedService.apiEndpoint,
    description: matchedService.description,
  };
}

async function askToGenerateJson(message, jsonExpectation, description) {
  console.log({ message, jsonExpectation, description });
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
    model: "deepseek-r1-distill-qwen-32b",
    temperature: 0.8,
  });
  logger.info(JSON.stringify({ chatCompletion }));
  const resultChatCompletion = chatCompletion.choices[0].message.content;
  return clearNoiseToParseJson(resultChatCompletion);
}

async function askToAnalizeResponse(response) {
  const prompt = `analisa response dibawah ini, dan berikan penjelasan yang singkat, ramah, gunakan emoji untuk menggambarkan penjelasan kamu, untuk menjawab maksimal 50 kata.\n${JSON.stringify(
    response,
  )}`;
  logger.info(JSON.stringify({ prompt }));
  const chatCompletion = await client.chat.completions.create({
    temperature: 1.2,
    messages: [
      {
        role: "system",
        content:
          "Solvana, kamu adalah asisten IT yang ramah dan profesional. yang akan menganalisa kendala yang terjadi, kamu berasal dari indonesia, jadi gunakan bahasa indonesia untuk menjawab semua pertanyaan",
      },
      { role: "user", content: prompt },
    ],
    model: "llama-3.3-70b-versatile",
  });
  logger.info(JSON.stringify({ chatCompletion }));
  const resultAnalize = chatCompletion.choices[0].message.content;
  return resultAnalize;
}

module.exports = { askToCategories, askToAnalizeResponse, askToGenerateJson };
