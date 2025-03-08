require("dotenv").config();
const { Groq } = require("groq-sdk");
const logger = require("../../utils/winstonUtils");

const client = new Groq({
  apiKey: process.env.GROQ_API_TOKEN,
});

const askToCategoriesChatHistory = [];

const categoriConfig = [
  {
    name: "COMMON_CHAT",
    description:
      "Percakapan biasa yang tidak memiliki arti dalam kasus yang diberikan diatas",
    responseTemplate: `Pesan: {{message}} \nBalasan: Terima kasih telah menghubungi kami. Apakah ada yang bisa kami bantu?`,
  },
  {
    name: "API_TRX_ERROR",
    description: "Masalah terkait error dalam proses transaksi API",
    responseTemplate: `Pesan: {{message}} \nBalasan: Terdapat masalah pada transaksi API. Mohon pastikan koneksi Anda stabil dan coba lagi. Jika masalah berlanjut, hubungi tim pengembangan.`,
  },
  {
    name: "OPEN_KYC_IMAGE",
    description:
      "Permintaan terkait verifikasi dokumen atau data (KYC) dan aset gambar yang berada dibackoffice (BO)",
    responseTemplate: `Pesan: "{{message}}" \nBalasan: "Dokumen sedang dalam proses penanganan. Harap tunggu sebentar\ncc @radea_surya"`,
  },
  {
    name: "ENABLE_USER_NON_ACTIVE",
    description:
      "Permintaan untuk mengaktifkan kembali pengguna yang nonaktif, dan pengguna yang pernah hapus akun",
    responseTemplate: `Pesan: "{{message}}" \nBalasan: "Akun akan segera diaktifkan kembali. Mohon tunggu beberapa saat untuk proses lebih lanjut".`,
  },
];

const availableService = [
  {
    name: "ENABLE_USER_NON_ACTIVE",
    description:
      "Permintaan untuk mengaktifkan kembali pengguna yang nonaktif, dan pengguna yang pernah hapus akun",
    apiEndpoint: "http://localhost:3000/api/v1/unitedpay/enable-user-nonactive",
    requiredBody: {
      kode_agen: "string",
    },
  },
  {
    name: "CREATE_SCHEDULE",
    description: "Permintaan untuk membuat jadwal",
    apiEndpoint: "https://api.solvana.id/create-schedule",
    requiredBody: {
      schedule: "string",
      task: "string",
    },
  },
  {
    name: "COMMON_CHAT",
    description:
      "Percakapan biasa yang tidak memiliki arti dalam kasus yang diberikan diatas",
    apiEndpoint: "https://api.solvana.id/common-chat",
    requiredBody: {
      message: "string",
    },
  },
];

async function askToCategories(message) {
  console.log({ message });
  const serviceListMessage = availableService
    .map(
      (service, idx) =>
        `${idx + 1}.${service.name}: ${service.description}\nAPI Endpoint: ${service.apiEndpoint}\nBody: ${JSON.stringify(service.requiredBody)}`,
    )
    .join("\n");
  const systemPrompt = `
  Kamu adalah solvana, asisten IT yang ramah dan profesional, dan dibawah ini adalah layanan yang bisa kamu berikan:
  ${serviceListMessage}
  gunakan bahasa indonesia untuk menjawab semua pertanyaan jawab dengan ramah, singkat, gunakan sedikit emoji, jawab dengan format <answer> SERVICES [<endpoint>|<body>] jika layanan disebutkan diatas, sedikit catatan <answer> tidak boleh mengandung api endpoint, body, dan nama service dan SERVICES [<endpoint>|<body>] harus berada dipaling belakang setelah <answer>
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
  const [resultChat] = resultChatCompletion.split("SERVICES");
  const [endpoint, body] = resultChatCompletion
    .split("SERVICES")[1]
    .replace("[", "")
    .replace("]", "")
    .split("|");
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
