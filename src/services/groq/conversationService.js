require("dotenv").config();
const { Groq } = require("groq-sdk");
const logger = require("../../utils/winstonUtils");
const fileUtils = require("../../utils/fileUtils");

const client = new Groq({
  apiKey: process.env.GROQ_API_TOKEN,
});

async function askToCategories(message) {
  const askToCategoriesChatHistory = fileUtils.readJsonFile(
    "./src/config/askToCategoriesChatHistory.json",
  );
  const availableService = fileUtils.readJsonFile(
    "./src/config/availableService.json",
  );
  const serviceListMessage = availableService
    .map(
      (service, idx) =>
        `${idx + 1}.${service.name}: ${service.description}\nAPI Endpoint: ${service.apiEndpoint}\nBody: ${JSON.stringify(service.requiredBody)}`,
    )
    .join("\n");
  const systemPrompt = `
  Kamu adalah solvana, asisten IT yang ramah dan profesional, dan dibawah ini adalah layanan yang bisa kamu berikan:
  ${serviceListMessage}
  Petunjuk:  
  - Gunakan bahasa Indonesia dengan nada ramah, singkat, dan sisipkan sedikit emoji.  
  - Jika terdapat layanan yang relevan (permintaan layanan terkait), sertakan informasi layanan pada output dengan format:  
    '<answer> SERVICES [<endpoint>|<body>]'
  - Pada bagian '<answer>', jangan menyertakan nama layanan, API endpoint, ataupun body.
  - emoji yang digunakan harus relevan dengan jawaban yang diberikan.
  - jangan berikan emoji dibagian endpoint dan body. 
  - Jika tidak ada layanan terkait, output tidak wajib menggunakan format tersebut.
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
    temperature: 1.4,
  });
  logger.info(JSON.stringify({ chatCompletion }));
  askToCategoriesChatHistory.push(chatCompletion.choices[0].message);
  const resultChatCompletion = chatCompletion.choices[0].message.content;
  if (!resultChatCompletion.includes("SERVICES")) {
    return {
      resultMessage: resultChatCompletion,
      endpoint: null,
      body: null,
    };
  }
  fileUtils.writeJsonFile(
    "./src/config/askToCategoriesChatHistory.json",
    askToCategoriesChatHistory,
  );
  const [resultChat] = resultChatCompletion.split("SERVICES");
  const [endpoint, body] = resultChatCompletion
    .split("SERVICES")[1]
    .replace("[", "")
    .replace("]", "")
    .split("|");
  console.log({ resultChat, endpoint, body });
  logger.info(JSON.stringify({ resultChat, endpoint, body }));
  return {
    resultMessage: resultChat,
    endpoint,
    body,
  };
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

module.exports = { askToCategories, askToAnalizeResponse };
