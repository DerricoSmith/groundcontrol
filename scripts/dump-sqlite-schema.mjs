import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const prisma = new PrismaClient();

const rows = await prisma.$queryRawUnsafe(
  "SELECT sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY type, name"
);

const out = rows.map((r) => `${r.sql};`).join("\n\n") + "\n";
writeFileSync(process.argv[2], out, "utf8");
console.log(`Wrote ${rows.length} schema statements to ${process.argv[2]}`);

await prisma.$disconnect();
