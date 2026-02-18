const { PrismaClient } = require("@prisma/client");
const { DateTime } = require("luxon");

const prisma = new PrismaClient();
const CHICAGO_ZONE = "America/Chicago";

async function run() {
  if (process.env.NODE_ENV === "production") {
    console.error("Seeding usage data is only allowed in dev.");
    process.exit(1);
  }

  await prisma.usageEvent.deleteMany({});
  const now = DateTime.now().setZone(CHICAGO_ZONE).startOf("day");
  const tokensPerHour = [1200, 900, 1100, 800];
  const models = ["openai-codex/gpt-5.1-codex-mini", "ollama/llama3.1:8b"];

  for (let dayIndex = 0; dayIndex < 14; dayIndex += 1) {
    const day = now.minus({ days: 13 - dayIndex });
    for (let hour = 0; hour < 24; hour += 1) {
      if (dayIndex === 13 && hour > DateTime.now().setZone(CHICAGO_ZONE).hour) break;
      const eventsCount = 1 + (hour % 3);
      for (let eventIndex = 0; eventIndex < eventsCount; eventIndex += 1) {
        const tsCst = day.plus({ hours: hour, minutes: eventIndex * 7 }).toJSDate();
        const inputTokens = tokensPerHour[(hour + eventIndex) % tokensPerHour.length];
        const outputTokens = Math.round(inputTokens * 0.35);
        const totalTokens = inputTokens + outputTokens;
        const estimatedCost = totalTokens * 0.00002;
        await prisma.usageEvent.create({
          data: {
            tsCst,
            model: models[(hour + eventIndex) % models.length],
            inputTokens,
            outputTokens,
            totalTokens,
            estimatedCost,
          },
        });
      }
    }
  }

  console.log("seeded usage events");
  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
