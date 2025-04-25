const { createLogger, format, transports } = require("winston");
const { combine, printf, errors } = format;

function toWIBISOString(date = new Date()) {
  const offsetMs = 7 * 60 * 60 * 1000; // +7 jam
  const localDate = new Date(date.getTime() + offsetMs);
  return localDate.toISOString().replace("T", " ").slice(0, 19);
}

const logFormat = printf(({ level, message, timestamp, stack }) => {
  const wibTime = toWIBISOString(new Date(timestamp));
  return `${wibTime} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: "debug",
  format: combine(format.timestamp(), errors({ stack: true }), logFormat),
  transports: [
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: combine(
        format.colorize(),
        format.timestamp(),
        errors({ stack: true }),
        logFormat,
      ),
    }),
  );
}

module.exports = logger;
