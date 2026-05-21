# WadeCoin Booking UI

A booking platform for a software development consultant who gets paid in their own ERC-20 token. The flow: pick a session type, grab a time slot from a live calendar feed, fill out contact info, connect MetaMask, pay Wade in WADE tokens. No payment processor, no redirect, no third-party checkout page.

Built in Angular 17. The blockchain payment flow works on real Ethereum testnet (mainnet for consulting to be deployed, testnet is available for discovery calls), and calendar availability comes from a live Google Calendar integration on the backend.

## Quick Start

```bash
npm install
npm run dev       # ng build --watch + Vite dev server → http://localhost:4200
npm run build     # production build → dist/browser/
npm run typecheck # tsc --noEmit
```

Requires Node 18+, backend API on `:8080`, MetaMask for payment flows.

---

## Stack

> Angular 17.3, standalone components, strict TypeScript 5.4
> Angular Signals + RxJS 7.8 
> `ng build --watch` + Vite 5, orchestrated via `start.mjs`
> CSS custom properties, no preprocessor
> MetaMask (`window.ethereum`), manual ERC-20 ABI encoding for testnet

---

## Angular Features

The app uses Angular 17's standalone components, signals, the `@if`/`@for` template syntax. No `NgModule`, no `BehaviorSubject` chains, no `*ngIf`.

**Standalone components** mean each component declares its own imports. You can understand a component's dependencies without hunting through a module file. The tree-shaker only bundles what's actually used, and lazy loading is trivial.

**OnPush change detection** is on every component. Angular skips re-rendering a component unless its inputs changed, an event fired, or an observable emitted. The catch: when you write to a signal inside an RxJS `subscribe()` callback, you have to call `cdr.markForCheck()` manually — OnPush doesn't know the async result came in. It's a small tax that pays off across the whole tree.

**Signals for state, computed for derived state.** Component state that would have been a `BehaviorSubject` is now a `signal()`. Where you'd have written `.pipe(combineLatest, map)` chains, you write `computed()` — memoized, automatically tracked, much easier to follow.


---

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/config` | Chain IDs, contract addresses, package pricing |
| `POST` | `/api/bookings` | Create booking with optional tx hash and slot |
| `GET` | `/api/availability` | Available slots for a date range and duration |
| `POST` | `/api/faucet` | Request testnet WADE tokens |
| `GET` | `/api/exchange/rate` | Current WADE/ETH rate |
| `POST` | `/api/exchange/simulate` | Simulate an exchange transaction |
| `GET` | `/api/logs` | Transaction and booking history |

All requests and responses are typed via `src/app/models/booking.models.ts`.

---

## The Interesting Parts

### The timeslot picker as a derived state showcase

The slot picker fetches a list of available times from the backend and displays them grouped by day. Rather than maintaining separate "which days exist" and "which slots are in the selected day" state manually, both are derived:

```typescript
allSlots     = signal<Slot[]>([]);
selectedDate = signal<string | null>(null);

days = computed((): SlotDay[] => {
  const byDate = new Map<string, Slot[]>();
  for (const s of this.allSlots()) {
    const arr = byDate.get(s.date) ?? [];
    arr.push(s);
    byDate.set(s.date, arr);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, slots]) => ({
      date,
      label: new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
      }),
      slots,
    }));
});

slotsForDay = computed(() =>
  this.allSlots().filter(s => s.date === this.selectedDate())
);
```

When the API response arrives, you set `allSlots` once. `days` and `slotsForDay` recompute automatically. No synchronization, no risk of them getting out of step.

The component also takes `durationMinutes` as an input, which is 30 for discovery calls, `package.hours * 60` for consulting sessions. When the user switches packages, the parent passes a new value and the component re-fetches availability for that duration. `ngOnChanges` handles it, with a `firstChange` guard to avoid double-loading on init since `ngOnInit` already calls `load()`:

```typescript
ngOnChanges(changes: SimpleChanges) {
  if (changes['durationMinutes'] && !changes['durationMinutes'].firstChange) {
    this.reset();  // clears selection, emits null to parent
    this.load();   // re-fetches for new duration
  }
}
```

### The submit button as a single source of truth

The submit button is disabled until the whole booking is valid: name and email filled in, payment done, time slot selected. Rather than tracking a `canSubmit` boolean and updating it in every event handler that might affect it, it's a computed signal:

```typescript
canSubmitDiscovery = computed(() => {
  if (!this.discTxHash()) return false;
  const f = this.form();
  if (!f.name.trim() || !f.email.includes('@')) return false;
  if (this.calendarConfigured() && !this.selectedSlot()) return false;
  return true;
});
```

Template: `[disabled]="!canSubmitDiscovery() || submitting()"`. Any signal it reads — `discTxHash`, `form`, `selectedSlot` — changing will recompute it. You can't forget to update it.


### Custom build script

`ng serve` wasn't the right tool here. I wanted Angular CLI's compilation (it handles Angular-specific transforms, strict type checking, and build budgets) combined with Vite's fast HMR. So `start.mjs` spawns both as separate processes, but gates Vite startup on Angular's first successful build:


## Decisions and tradeoffs

| Decision | Rationale | Tradeoff |
|---|---|---|
| Standalone components | No `NgModule` boilerplate; tree-shakeable; readable dependency list per component | Requires Angular 14+ |
| OnPush everywhere | No wasted render cycles across the component tree | Requires manual `markForCheck()` after async signal writes |
| Signals over BehaviorSubject | No subscription management; derived state with `computed()` is simpler than pipe chains | Newer API, less ecosystem tooling |
| Manual ABI encoding | Zero blockchain library dependencies, small bundle | Have to know ERC-20 function selector encoding |
| CSS custom properties, no SCSS | Runtime theming, no build step, component styles don't conflict | No nesting, mixins, or functions |
| Vite + `ng build --watch` | Angular's compiler maturity + Vite's HMR speed | Custom process orchestration, not standard `ng serve` |
