# FlowPilot

FlowPilot turns a messy list of tasks into a realistic day plan. It estimates duration, detects urgency, protects focused work, and gives every task a place on the timeline.

**Live app:** [flowpilot-day-planner.vercel.app](https://flowpilot-day-planner.vercel.app)

## Why I built it

The hardest part of a busy day is often deciding what to do first. Most task apps still make people organize every field by hand. FlowPilot is deliberately lighter: write tasks naturally, press one button, and start working.

## What it does

- Parses a brain dump into individual tasks
- Detects time hints such as `30m` or `2h`
- Infers urgency from words such as `urgent`, `today`, and `tomorrow`
- Groups deep work, creative work, admin, and personal tasks
- Builds a time-blocked schedule with breathing room
- Includes a built-in focus timer and completion tracking
- Saves the plan in the browser—no account or API key required

## Stack

- Next.js 16 and React 19
- TypeScript
- Tailwind CSS 4
- Lucide icons
- Local Storage for private, device-local persistence

## Run locally

```bash
npm install
npm run dev
```

Open the local address shown in the terminal.

## How the scheduling works

FlowPilot uses an explainable scoring system instead of a black box. Tasks are ranked by completion state, urgency, and energy level. High-priority deep work is scheduled first, duration hints are respected, and a ten-minute buffer is added after longer sessions.

## Privacy

Task data never leaves the browser. There is no sign-in, analytics tracker, or external AI request in the current version.

## License

MIT
