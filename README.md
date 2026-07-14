# Synvix — Open-Source AI Interview Assistant

Desktop AI assistant for interviews — real-time transcription, multi-LLM answers, **stealth mode** (invisible during screen sharing).

## Quick Start (Development)

```bash
npm install
cp server/.env.example server/.env   # add API keys
npm run dev:electron
```

## Production Build (.exe)

```bash
npm test
npm run dist
```

Output: `release/Synvix-Setup-1.0.0.exe`

Portable: `npm run dist:dir` → `release/win-unpacked/`

## Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run dev` | Dev mode (server + client web) |
| `npm run dev:electron` | Dev mode (server + client + electron) |
| `npm run dev:site` | Public site (site + site-api) |
| `npm run build:prod` | Production build |
| `npm run dist` | Build Windows installer (.exe) |
| `npm run dist:dir` | Build unpacked app |

## Architecture

```
Synvix.exe
├── Electron UI (client/dist)
├── Embedded server (server/dist/bundle.js) — spawned on launch
├── Stealth mode (setContentProtection + window opacity)
└── System audio loopback capture (mic + system)
```

## Features

- **Stealth mode** — visible to you, hidden in screen share (`WDA_EXCLUDEFROMCAPTURE`)
- **Full audio** — mic + system audio (Zoom/Meet/Teams)
- **Multi-LLM** — Gemini, Groq, Claude, OpenAI (streaming)
- **Fast STT** — Groq Whisper (2.5s chunks)

## API Keys

| Provider | Env Variable | Role |
|----------|-------------|------|
| Gemini | `GEMINI_API_KEY` | LLM (default) |
| Groq | `GROQ_API_KEY` | STT + LLM |
| Claude | `ANTHROPIC_API_KEY` | LLM |
| OpenAI | `OPENAI_API_KEY` | LLM + STT |

## Project Structure

```
/electron       Desktop shell, stealth, server manager
/client         React UI
/server         STT, LLM providers, WebSocket API
/shared         TypeScript types
/site           Public website
/site-api       Public site API
/release        Built installers (gitignored)
```

## Notes

- Installer is unsigned. Windows may show SmartScreen — click "More info" → "Run anyway"
- Set `CSC_LINK` / `CSC_KEY_PASSWORD` for code signing
- Stealth mode requires Windows 10 2004+ or macOS
