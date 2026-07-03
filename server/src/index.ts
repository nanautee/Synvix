import dotenv from "dotenv";

const envPath = process.env.DOTENV_CONFIG_PATH;
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

import { createApp } from "./app";

const PORT = Number(process.env.PORT) || 3001;
const { port } = createApp(PORT);

console.log(`Server running on http://localhost:${port}`);
console.log(`WebSocket available at ws://localhost:${port}/ws`);
