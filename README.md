# Operant AI

An AI-powered workflow generator. Describe any business process in plain English and Operant AI instantly generates a structured automation workflow.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your API key

Open `.env.local` and replace the placeholder with your real key:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get a key at [console.anthropic.com](https://console.anthropic.com/).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How It Works

1. Type a business task in the chat panel (e.g. *"When a new Stripe payment arrives, email the customer and notify Slack"*)
2. Operant AI sends your message to Claude and parses the structured workflow response
3. The right panel shows your workflow as numbered step cards
4. Toggle **Code** to see the raw JSON · **Dashboard** for a stats overview

---

## Project Structure

```
app/
  page.tsx              Main layout and state
  layout.tsx            Root layout (Inter font, metadata)
  globals.css           Global styles + animations
  api/chat/route.ts     Claude API handler

components/
  TopBar.tsx            Header with logo and view toggles
  ChatPanel.tsx         Chat interface (messages + input)
  WorkflowPanel.tsx     Workflow / Code / Dashboard views
  StepCard.tsx          Individual step display card

lib/
  types.ts              TypeScript interfaces
```

---

## Build for Production

```bash
npm run build
npm start
```

---

## Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Claude API** — `claude-opus-4-5`
- **TypeScript**
- **Inter** (Google Fonts)
