"use client";

import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Coffee,
  Command,
  Focus,
  Inbox,
  LayoutList,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Trash2,
  WandSparkles,
  Zap,
} from "lucide-react";
import { KeyboardEvent, useEffect, useMemo, useState } from "react";

type Priority = "high" | "medium" | "low";
type Energy = "deep" | "light";

type Task = {
  id: string;
  title: string;
  minutes: number;
  priority: Priority;
  energy: Energy;
  category: string;
  done: boolean;
};

const SAMPLE_TASKS: Task[] = [
  { id: "sample-1", title: "Finish the product proposal", minutes: 75, priority: "high", energy: "deep", category: "Deep work", done: false },
  { id: "sample-2", title: "Reply to important emails", minutes: 25, priority: "medium", energy: "light", category: "Admin", done: false },
  { id: "sample-3", title: "Prepare slides for tomorrow", minutes: 50, priority: "high", energy: "deep", category: "Creative", done: false },
  { id: "sample-4", title: "Book a dentist appointment", minutes: 15, priority: "low", energy: "light", category: "Personal", done: false },
];

const priorityWeight: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

function inferMinutes(text: string) {
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hour)s?/i);
  if (hourMatch) return Math.max(10, Math.round(Number(hourMatch[1]) * 60));
  const minuteMatch = text.match(/(\d+)\s*(?:m|min|minute)s?/i);
  if (minuteMatch) return Math.max(10, Number(minuteMatch[1]));
  if (/email|reply|call|book|order|pay|message/i.test(text)) return 20;
  if (/write|design|build|prepare|proposal|report|study|research/i.test(text)) return 60;
  return 35;
}

function inferPriority(text: string): Priority {
  if (/urgent|asap|today|deadline|important|due/i.test(text)) return "high";
  if (/tomorrow|review|prepare|finish|submit/i.test(text)) return "medium";
  return "low";
}

function inferTaskDetails(text: string) {
  if (/email|reply|invoice|admin|form|pay/i.test(text)) return { category: "Admin", energy: "light" as Energy };
  if (/call|book|appointment|order|grocery|personal/i.test(text)) return { category: "Personal", energy: "light" as Energy };
  if (/design|write|slides|creative|draft/i.test(text)) return { category: "Creative", energy: "deep" as Energy };
  return { category: "Deep work", energy: "deep" as Energy };
}

function cleanTaskTitle(text: string) {
  return text
    .replace(/^[-*•\d.)\s]+/, "")
    .replace(/\(?\d+(?:\.\d+)?\s*(?:h|hr|hour|m|min|minute)s?\)?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseTasks(value: string): Task[] {
  return value
    .split(/\n|;|,(?=\s*[A-Z])/) 
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const details = inferTaskDetails(line);
      return {
        id: `${Date.now()}-${index}`,
        title: cleanTaskTitle(line),
        minutes: inferMinutes(line),
        priority: inferPriority(line),
        energy: details.energy,
        category: details.category,
        done: false,
      };
    });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatClock(minutes: number) {
  const normalized = minutes % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function createSchedule(tasks: Task[]) {
  let cursor = 9 * 60;
  return [...tasks]
    .sort((a, b) => {
      const completionDifference = Number(a.done) - Number(b.done);
      if (completionDifference !== 0) return completionDifference;
      const priorityDifference = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDifference !== 0) return priorityDifference;
      return Number(b.energy === "deep") - Number(a.energy === "deep");
    })
    .map((task) => {
      if (cursor < 13 * 60 && cursor + task.minutes > 12 * 60 + 30) cursor = 13 * 60;
      const start = cursor;
      cursor += task.minutes;
      if (task.minutes >= 45) cursor += 10;
      return { ...task, start, end: start + task.minutes };
    });
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [brainDump, setBrainDump] = useState("");
  const [friendlyDate, setFriendlyDate] = useState("Today");
  const [hydrated, setHydrated] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedTasks = window.localStorage.getItem("flowpilot-tasks");
      if (storedTasks) {
        try {
          setTasks(JSON.parse(storedTasks) as Task[]);
        } catch {
          window.localStorage.removeItem("flowpilot-tasks");
        }
      }
      setFriendlyDate(new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date()));
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("flowpilot-tasks", JSON.stringify(tasks));
  }, [hydrated, tasks]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setTimerSeconds((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const schedule = useMemo(() => createSchedule(tasks), [tasks]);

  const completed = tasks.filter((task) => task.done).length;
  const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const plannedMinutes = tasks.reduce((total, task) => total + task.minutes, 0);
  const deepMinutes = tasks.filter((task) => task.energy === "deep").reduce((total, task) => total + task.minutes, 0);
  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? null;

  function buildDay() {
    const nextTasks = parseTasks(brainDump);
    if (!nextTasks.length) return;
    setTasks((current) => [...current.filter((task) => !task.done), ...nextTasks]);
    setBrainDump("");
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      buildDay();
    }
  }

  function toggleTask(id: string) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  }

  function removeTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
    if (activeTaskId === id) {
      setActiveTaskId(null);
      setTimerRunning(false);
      setTimerSeconds(25 * 60);
    }
  }

  function startFocus(task: Task) {
    setActiveTaskId(task.id);
    setTimerSeconds(Math.min(task.minutes, 25) * 60);
    setTimerRunning(true);
  }

  function resetDay() {
    setTasks([]);
    setActiveTaskId(null);
    setTimerRunning(false);
    setTimerSeconds(25 * 60);
  }

  const timerLabel = `${String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`;

  return (
    <main className="app-shell">
      <aside className="side-rail" aria-label="FlowPilot navigation">
        <a className="brand" href="#top" aria-label="FlowPilot home">
          <span className="brand-mark"><Zap size={18} strokeWidth={2.4} /></span>
          <span>FlowPilot</span>
        </a>
        <nav className="nav-list" aria-label="Sections">
          <a className="nav-item active" href="#plan"><LayoutList size={18} /> <span>My day</span></a>
          <a className="nav-item" href="#focus"><Focus size={18} /> <span>Focus</span></a>
          <a className="nav-item" href="#method"><BrainCircuit size={18} /> <span>How it works</span></a>
        </nav>
        <div className="privacy-card">
          <span className="privacy-icon"><ShieldCheck size={18} /></span>
          <div><strong>Private by design</strong><p>Your plan stays in this browser.</p></div>
        </div>
      </aside>

      <section className="workspace" id="top">
        <header className="topbar">
          <div>
            <p className="eyebrow"><CalendarDays size={15} /> {friendlyDate}</p>
            <h1>Make today feel lighter.</h1>
          </div>
          <div className="top-actions">
            <button className="button button-ghost" onClick={() => setTasks(SAMPLE_TASKS)} type="button"><RefreshCcw size={16} /> Load example</button>
            <button className="icon-button" onClick={resetDay} type="button" aria-label="Clear day" title="Clear day"><Trash2 size={18} /></button>
          </div>
        </header>

        <section className="composer-card" aria-labelledby="composer-title">
          <div className="composer-copy">
            <span className="spark-icon"><WandSparkles size={20} /></span>
            <div>
              <p className="section-kicker">AUTOMATIC DAY PLANNER</p>
              <h2 id="composer-title">Drop the mental load here.</h2>
              <p>Write one task per line. FlowPilot estimates time, spots urgency, and puts everything in a sensible order.</p>
            </div>
          </div>
          <div className="composer-input-wrap">
            <textarea
              value={brainDump}
              onChange={(event) => setBrainDump(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={"Finish urgent project report (1h)\nReply to emails\nBook a dentist appointment"}
              aria-label="Tasks to organize"
            />
            <div className="composer-footer">
              <span><Command size={14} /> Ctrl + Enter to plan</span>
              <button className="button button-primary" onClick={buildDay} type="button" disabled={!brainDump.trim()}>Build my day <ArrowRight size={17} /></button>
            </div>
          </div>
        </section>

        <section className="metric-grid" aria-label="Plan overview">
          <article className="metric-card"><span className="metric-icon orange"><Inbox size={19} /></span><div><strong>{tasks.length}</strong><span>tasks planned</span></div></article>
          <article className="metric-card"><span className="metric-icon purple"><BrainCircuit size={19} /></span><div><strong>{formatDuration(deepMinutes)}</strong><span>deep work</span></div></article>
          <article className="metric-card"><span className="metric-icon green"><Clock3 size={19} /></span><div><strong>{formatDuration(plannedMinutes)}</strong><span>total focus</span></div></article>
          <article className="metric-card progress-card">
            <div className="progress-ring" style={{ "--progress": `${completion * 3.6}deg` } as React.CSSProperties}><span>{completion}%</span></div>
            <div><strong>{completed}/{tasks.length}</strong><span>completed</span></div>
          </article>
        </section>

        <div className="content-grid">
          <section className="plan-panel" id="plan" aria-labelledby="plan-title">
            <div className="panel-heading">
              <div><p className="section-kicker">YOUR SMART SCHEDULE</p><h2 id="plan-title">A clear path through the day</h2></div>
              <span className="automation-chip"><Sparkles size={14} /> Auto-sorted</span>
            </div>
            {schedule.length ? (
              <div className="timeline">
                {schedule.map((task, index) => (
                  <article className={`task-row ${task.done ? "is-done" : ""}`} key={task.id}>
                    <div className="time-column"><strong>{formatClock(task.start)}</strong><span>{formatClock(task.end)}</span>{index < schedule.length - 1 && <i aria-hidden="true" />}</div>
                    <div className="task-card">
                      <button className="check-button" onClick={() => toggleTask(task.id)} type="button" aria-label={`${task.done ? "Mark incomplete" : "Complete"} ${task.title}`}>{task.done ? <Check size={16} /> : <Circle size={17} />}</button>
                      <div className="task-main">
                        <div className="task-title-line"><h3>{task.title}</h3><span className={`priority-dot ${task.priority}`} title={`${task.priority} priority`} /></div>
                        <div className="task-meta"><span>{task.category}</span><span><Clock3 size={13} /> {formatDuration(task.minutes)}</span><span>{task.energy === "deep" ? "High focus" : "Light lift"}</span></div>
                      </div>
                      {!task.done && <button className="focus-button" onClick={() => startFocus(task)} type="button"><Play size={14} fill="currentColor" /> Focus</button>}
                      <button className="remove-button" onClick={() => removeTask(task.id)} type="button" aria-label={`Remove ${task.title}`}><Trash2 size={15} /></button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><span><Plus size={22} /></span><h3>Your day is wide open</h3><p>Add a few tasks above and FlowPilot will turn them into a workable plan.</p></div>
            )}
          </section>

          <aside className="right-column">
            <section className="focus-card" id="focus" aria-labelledby="focus-title">
              <div className="focus-topline"><span><Focus size={17} /> Focus session</span><button type="button" onClick={() => { setTimerSeconds(25 * 60); setTimerRunning(false); }} aria-label="Reset timer"><RotateCcw size={15} /></button></div>
              <p className="focus-task" id="focus-title">{activeTask?.title ?? "Choose a task to begin"}</p>
              <div className="timer-display">{timerLabel}</div>
              <div className="timer-track"><span style={{ width: `${100 - (timerSeconds / (25 * 60)) * 100}%` }} /></div>
              <button className="button timer-button" type="button" disabled={!activeTask} onClick={() => setTimerRunning((current) => !current)}>
                {timerRunning ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
                {timerRunning ? "Pause session" : activeTask ? "Start session" : "Pick a task first"}
              </button>
              <p className="timer-note"><Coffee size={14} /> A short break follows each deep-work block.</p>
            </section>

            <section className="method-card" id="method" aria-labelledby="method-title">
              <div className="panel-heading compact"><div><p className="section-kicker">BEHIND THE PLAN</p><h2 id="method-title">Simple, explainable automation</h2></div></div>
              <ol className="method-list">
                <li><span>1</span><div><strong>Understand</strong><p>Detects duration, urgency, and task type from your words.</p></div></li>
                <li><span>2</span><div><strong>Prioritize</strong><p>Urgent, high-energy work gets your freshest hours.</p></div></li>
                <li><span>3</span><div><strong>Protect focus</strong><p>Adds breathing room so the schedule stays realistic.</p></div></li>
              </ol>
            </section>

            <section className="tip-card">
              <span><TimerReset size={18} /></span>
              <div><strong>Helpful shorthand</strong><p>Add “urgent”, “tomorrow”, “30m”, or “2h” for a sharper plan.</p></div>
              <ChevronRight size={17} />
            </section>
          </aside>
        </div>
        <footer><span>FlowPilot</span><p>Less juggling. More finishing.</p></footer>
      </section>
    </main>
  );
}
