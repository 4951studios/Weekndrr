# Weekend Wanderer (“Weekender”)

A mobile-first web app that helps price-sensitive urban professionals find and book the
cheapest weekend getaway in under five minutes. No backend, no auth — everything runs
from local seed data plus `localStorage`.

## Setup

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # production bundle in dist/
npm run preview
```

## Accounts (Supabase)

Browsing stays public — an account only buys you saved trips and bookings that follow you
between devices.

**Why Supabase:** free tier covers a real Postgres database, 50k monthly active auth users,
email/password plus Google/Apple OAuth, and row-level security so a user can only ever read
their own rows. The JS SDK works unchanged in the browser and inside Capacitor.

Setup:

1. Create a free project at [supabase.com](https://supabase.com).
2. Run [supabase/schema.sql](supabase/schema.sql) in the SQL editor — it creates
   `saved_trips` and `bookings` and turns on owner-only RLS policies.
3. Put the project URL and anon key in `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

The anon key is designed to ship to clients; RLS is what protects the data, which is why
the policies in the schema matter more than hiding the key.

**Without keys the app still runs.** `authMode` falls back to a demo account stored on this
device: no password is collected and none is stored, and the sign-up screen says so
plainly rather than implying security it doesn't have. `/signin` and `/signup` show the
password field only when Supabase is configured.

Where things live: [src/api/auth.js](src/api/auth.js) (auth interface + both adapters),
[src/api/supabaseEntity.js](src/api/supabaseEntity.js) (table-backed entity),
[src/hooks/useAuth.jsx](src/hooks/useAuth.jsx) (session context),
[src/pages/AuthScreen.jsx](src/pages/AuthScreen.jsx) (sign in / sign up).
[src/api/client.js](src/api/client.js) routes `SavedTrip` and `Booking` to Supabase when a
user is signed in and to `localStorage` otherwise, so no screen knows the difference.

> Verified in demo mode end to end. With dummy Supabase keys the client builds the right
> requests and failures surface as readable errors — but sign-up, sign-in and RLS have not
> been run against a real project.

## Live pricing (optional)

Out of the box the app runs on bundled demo data. Add API keys and the same screens
reprice against real inventory — no code changes.

The app now calls a Supabase Edge Function, so provider keys are never bundled into the
browser or native app:

```bash
supabase functions deploy travel-pricing
supabase secrets set \
  ROUTESTACK_API_KEY=your-key \
  ROUTESTACK_API_SECRET=your-secret \
  AMADEUS_CLIENT_ID=your-id \
  AMADEUS_CLIENT_SECRET=your-secret \
  RAPIDAPI_KEY=your-key
```

Then set `VITE_LIVE_PRICING=true` in `.env` and restart the app. Keep it `false` until the
function has been deployed.

Pricing is intentionally a public function because Explore is public and should not force
an account. Before high-traffic launch, add an Edge Function rate limit keyed by IP or
session and validate the request origin; do not switch `verify_jwt` on unless pricing is
also made account-only.

| Data | Provider | Edge Function secret |
| --- | --- | --- |
| Flights (round-trip) | [Amadeus Self-Service](https://developers.amadeus.com/self-service) Flight Offers Search | `AMADEUS_CLIENT_ID` / `AMADEUS_CLIENT_SECRET` |
| Hotels (2 nights) | [RouteStack MCP API](https://www.routestack.ai/docs) with Amadeus fallback | `ROUTESTACK_API_KEY` / `ROUTESTACK_API_SECRET` |
| Car rental | [Booking.com on RapidAPI](https://rapidapi.com/DataCrawler/api/booking-com15) | `RAPIDAPI_KEY` |

How it behaves:

- **Per-trip, per-source fallback.** Each lookup is independent; anything that errors or
  returns nothing keeps its demo price, so the list is never empty or half-broken.
- **RouteStack rollout.** When both RouteStack secrets are configured, hotel searches use
  RouteStack's live destination and hotel endpoints. If RouteStack is unavailable or returns
  no priced hotels, the existing Amadeus hotel lookup is used automatically.
- **Honest labelling.** The results header shows `Live prices` only when at least one trip
  actually came back priced, `Demo prices` otherwise, and `Updating…` while fetching.
- **CORS and secrets.** The browser/native client calls
  [supabase/functions/travel-pricing/index.ts](supabase/functions/travel-pricing/index.ts).
  Only Supabase's public URL, anon key, trip metadata and dates reach the client. The
  provider secrets stay in Supabase Edge Function secrets.
- One OAuth token is shared across all trips in a search rather than one per trip.

> The Edge Function has not been deployed or exercised with live provider credentials in
> this workspace. Until that deployment is complete, the app intentionally shows demo data.

## Booking handoff

Weekender doesn't take supplier payments — it hands you off to the site you choose.
[src/lib/bookingSites.js](src/lib/bookingSites.js) holds the catalogue (Booking.com,
Expedia, Airbnb, Hotels.com, Kayak) with each site's real public search URL, pre-filled
with destination, dates and guest count. Airbnb only appears for rentals, Hotels.com only
for hotels.

- **Trip details** → “Where to book” opens any site's search directly, plus
  “Compare flights” / “Rental cars” deep links.
- **Checkout** → a required “Book through” choice stored on the booking.
- **Confirmation** → shows the chosen site and an “Open on …” button.

Links open in the system browser on device (`@capacitor/browser`) and a new tab on the web.

## Mobile (iOS & Android)

The same codebase ships as a native app via [Capacitor](https://capacitorjs.com). The
`ios/` and `android/` projects are committed; `dist/` is copied into them on every sync.

```bash
npm run sync          # vite build + cap sync (run after every web change)
npm run ios           # open Xcode
npm run android       # open Android Studio
npm run ios:run       # build + run on a simulator/device
npm run android:run   # build + run on an emulator/device
```

App ID `app.weekender.wanderer`, display name **Weekender**.

### Splash screen & icons

`npm run assets` regenerates everything from code:
[scripts/generate-assets.mjs](scripts/generate-assets.mjs) draws the wordmark artwork with
sharp, then `@capacitor/assets` emits all iOS, Android and PWA icon/splash densities.

The native splash hands off to a matching in-app screen
([src/components/SplashGate.jsx](src/components/SplashGate.jsx)) that uses the same indigo
gradient and mark, so there is no white flash between the OS splash and the first render.
The native splash is hidden only once the web splash is painted.

### Requirements

- **iOS:** Xcode 15+. Capacitor 8 uses Swift Package Manager, so no CocoaPods step.
- **Android:** Android SDK plus **JDK 21 or 17** — Gradle cannot run on JDK 25+
  (`Unsupported class file major version 69`). If your default `java` is newer:
  ```bash
  export JAVA_HOME=$(/usr/libexec/java_home -v 21)
  export ANDROID_HOME=$HOME/Library/Android/sdk
  ```

### Command-line builds

```bash
# Android debug APK -> android/app/build/outputs/apk/debug/app-debug.apk
cd android && ./gradlew assembleDebug
# Android release bundle for Play (needs a signing config in android/app/build.gradle)
cd android && ./gradlew bundleRelease

# iOS simulator build
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' build
```

For the App Store, open the Xcode project, set a development team and bundle ID under
Signing & Capabilities, then Product ▸ Archive. For Play, generate an upload keystore and
add a `signingConfigs` block before running `bundleRelease`.

### Native integration

[src/lib/native.js](src/lib/native.js) is the only file that knows about Capacitor. It
detects the platform and picks the right implementation, so the web build is unchanged:

| Concern | Web | Native |
| --- | --- | --- |
| Location | `navigator.geolocation` | `@capacitor/geolocation` + runtime permission request |
| Share | `navigator.share`, clipboard fallback | `@capacitor/share` |
| Status bar / splash | n/a | `@capacitor/status-bar`, `@capacitor/splash-screen` |
| Haptics | n/a | `@capacitor/haptics` |

Every location path is bounded by a 10s race so a device that never gets a GPS fix still
falls back to “Los Angeles” instead of hanging on “Detecting location…”.

Safe areas are handled with the `pt-safe` / `pb-safe` utilities on iOS, and on Android via
`adjustMarginsForEdgeToEdge: "force"` in [capacitor.config.json](capacitor.config.json),
so the header clears the status bar and the tab bar clears the gesture pill.

Permissions declared: `NSLocationWhenInUseUsageDescription` in
[ios/App/App/Info.plist](ios/App/App/Info.plist), and `ACCESS_FINE_LOCATION` /
`ACCESS_COARSE_LOCATION` in
[android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml).

## Stack

- Vite + React 18 (JavaScript, `.jsx`)
- Tailwind CSS + shadcn/ui primitives (new-york, base color neutral, CSS variables)
- react-router-dom, @tanstack/react-query
- framer-motion, lucide-react, date-fns, canvas-confetti

Path aliases (`vite.config.js` + `jsconfig.json`): `@/components`, `@/components/ui`,
`@/lib`, `@/hooks`, `@/utils` — all resolved from `@` → `src`.

## Folder structure

```
src/
  api/client.js              entities.Trip | SavedTrip | Booking (list/get/create/update/delete)
  api/auth.js                auth interface: Supabase adapter + device-only demo adapter
  api/supabase.js            Supabase client (null when unconfigured)
  api/supabaseEntity.js      entity adapter backed by a Supabase table
  api/providers/             live pricing: http.js (CORS strategy), amadeus.js, cars.js, index.js
  data/trips.json            8 seed trips (landmark hero images, IATA codes, coordinates)
  data/cities.json           departure cities with IATA codes and coordinates
  components/
    ui/                      shadcn primitives (button, input, label, card, sheet, slider, skeleton)
    search/                  LocationPicker, WeekendPicker, BudgetSlider, FilterChips
    trips/                   TripCard, TripsList, LodgingGallery, PriceBreakdown
    checkout/                GuestForm, PaymentForm
    booking/                 BookingSitePicker
    SafeImage.jsx            <img> with gradient fallback on error
    SplashGate.jsx           branded loading screen matching the native splash
  hooks/
    useEntities.js           react-query wrappers around the data layer
    useAuth.jsx              session context, swaps the data layer on sign in/out
    useSearch.jsx            search state + one-shot geolocation detection
  lib/
    utils.js                 cn()
    weekends.js              next 4 Fri–Sun weekends
    bookingSites.js          booking site catalogue + deep links
    native.js                Capacitor-aware location, share, browser, splash, haptics
  pages/                     Home, TripDetails, Checkout, Confirmation, SavedTrips, Profile, NotFound
  Layout.jsx                 max-w-lg shell + bottom tab bar
  App.jsx                    providers + routes
scripts/generate-assets.mjs  icon + splash artwork generator
```

## Routes

| Route | Screen | Bottom nav |
| --- | --- | --- |
| `/` | Home / Explore | visible |
| `/trip/:id` | Trip details | visible |
| `/checkout?trip=:id` | Checkout | hidden |
| `/confirmation/:bookingId` | Confirmation | hidden |
| `/saved` | Saved trips | visible |
| `/profile` | Profile / account | visible |
| `/signin`, `/signup` | Sign in / create account | hidden |

## Swap the data layer

Every component talks to the app only through `src/api/client.js`, which exports
`entities.Trip`, `entities.SavedTrip`, and `entities.Booking`. Each entity implements the
same async interface:

```js
list(sortField?)   // "field" ascending, "-field" descending
get(id)
create(data)
update(id, data)
delete(id)
```

To move to a real backend, reimplement those five methods and leave everything else
untouched. Example with Supabase:

```js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

function table(name) {
  return {
    async list(sortField) {
      let query = supabase.from(name).select("*");
      if (sortField) {
        const desc = sortField.startsWith("-");
        query = query.order(desc ? sortField.slice(1) : sortField, { ascending: !desc });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async get(id) { /* .eq("id", id).single() */ },
    async create(data) { /* .insert(data).select().single() */ },
    async update(id, data) { /* .update(data).eq("id", id) */ },
    async delete(id) { /* .delete().eq("id", id) */ },
  };
}

export const entities = { Trip: table("trips"), SavedTrip: table("saved_trips"), Booking: table("bookings") };
```

The same shape works for Firebase or a REST API. React Query cache keys live in
`src/hooks/useEntities.js` — no other file needs to change.

## Choices made where the spec was silent

- **Prices.** `total_price` is treated as *per person* everywhere. The card reads
  “total per person” and the detail page reads “per person”, so the two never disagree.
  Checkout multiplies it by the guest count.
- **Search state** (departure city, weekend, budget, filters) lives in a React context
  (`useSearch`) rather than the URL. Trip detail and checkout also accept a `?weekend=`
  query param so a shared link keeps its dates; they fall back to the selected weekend,
  then to this weekend.
- **Geolocation** runs once on first launch, guarded by a ref, and the resulting city is
  remembered in `localStorage` — later launches land on the user's own city instantly with
  no “Detecting location…” flash and no geolocation prompt. A detected place is snapped to
  the nearest city in [src/data/cities.json](src/data/cities.json) (haversine), so the
  departure always has an airport code for live flight pricing — Santa Monica resolves to
  Los Angeles. Any denial, error, timeout (10s) or missing API falls back to Los Angeles.
  Picking a city manually also persists, and “Use my current location” in the picker
  re-runs detection. Results render immediately from local data and never wait on it.
- **Checkout is a supplier handoff, not payment.** Weekender collects guest details,
  saves a `pending` trip plan, and sends the traveler to the selected booking site. It
  does not collect card data, take payment, or claim a supplier reservation. The
  confirmation screen shows an estimated total and a clear “Continue on …” action.
- **Images** are royalty-free Unsplash URLs (all verified to resolve). Each hero is the top
  result of a landmark-specific Unsplash search — Ocean Drive, Jackson Square, the Texas
  State Capitol, Coronado, Joshua Tree NP, Broadway, Bixby Creek Bridge, Camelback Mountain
  — and the landmark is named on the detail page. `SafeImage` renders an accessible neutral
  gradient block if a URL ever dies, so a broken-image icon never appears.
- **Budget** accepts any custom amount: tap the price (or the Custom chip) to type one.
  Values are clamped to $50–$100,000 and the slider's max grows to fit.
- **Guests** are capped at 1–8 in the checkout stepper.
- **`entities.Trip` is read-only** in the local adapter (seed JSON); `create`/`update`/
  `delete` throw. A real backend implementation can support all five.
- A `NotFound` route was added for unmatched paths.

## Accessibility

Semantic `button`/`nav`/`main` elements, `aria-label` on every icon-only control,
`aria-pressed` on toggles, visible focus rings via `:focus-visible`, form errors wired up
with `aria-invalid` / `aria-describedby`, and a gradient overlay guaranteeing contrast for
text set over hero images.
