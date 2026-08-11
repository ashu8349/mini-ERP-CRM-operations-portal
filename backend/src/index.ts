import { createApp } from "./app";
import { config } from "./config";
import { prisma } from "./prisma";

const app = createApp();

async function main() {
  await prisma.$connect();
  app.listen(config.port, () => {
    console.log(`OpsFlow ERP API listening on http://localhost:${config.port} (${config.nodeEnv})`);
  });
}

main().catch(async (err) => {
  console.error("Failed to start server:", err);
  await prisma.$disconnect();
  process.exit(1);
});