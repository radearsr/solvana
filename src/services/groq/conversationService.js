require("dotenv").config();
const { Groq } = require("groq-sdk");
const logger = require("../../utils/winstonUtils");

const client = new Groq({
  apiKey: process.env.GROQ_API_TOKEN,
});

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

async function askToCategories(message) {
  const categoryListMessage = categoriConfig
    .map(
      (category, idx) => `${idx + 1}.${category.name}: ${category.description}`,
    )
    .join("\n");
  const prompt = `
  Anda adalah sistem cerdas yang akan mengklasifikasikan pesan pengguna berdasarkan kategori yang diberikan.
  Daftar kategori:
  ${categoryListMessage}
  Pesan pengguna: "${message}"
  Tentukan kategori mana pesan tersebut paling sesuai. Jika tidak jelas, pilih kategori yang paling relevan, tentukan juga kode agen dengan pola UTDxxx atau MPxxx.
  Jawab hanya dengan nama kategori dari daftar dan kode agen, contohnya KATEGORI|UTDxxx`;
  logger.info(JSON.stringify({ prompt }));
  const chatCompletion = await client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-70b-8192",
  });
  logger.info(JSON.stringify({ chatCompletion }));
  const resultCategory = chatCompletion.choices[0].message.content;
  return resultCategory;
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
