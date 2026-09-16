import tripsSeed from "@/data/trips.json";
import { supabase, supabaseEnabled } from "@/api/supabase";
import { createSupabaseEntity } from "@/api/supabaseEntity";

/**
 * Generic entity interface backed by local seed JSON (read-only collections)
 * and localStorage (mutable collections). Swap the adapters below for
 * Supabase / Firebase / REST without touching any component.
 */

const STORAGE_PREFIX = "weekender:";

function readStore(key) {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(key, rows) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(rows));
  } catch {
    /* storage unavailable (private mode / quota) — keep the app usable */
  }
}

function newId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** "-field" sorts descending, "field" ascending. */
function sortRows(rows, sortField) {
  if (!sortField) return rows;
  const desc = sortField.startsWith("-");
  const field = desc ? sortField.slice(1) : sortField;
  return [...rows].sort((a, b) => {
    const av = a?.[field];
    const bv = b?.[field];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const result = av > bv ? 1 : -1;
    return desc ? -result : result;
  });
}

function createReadOnlyEntity(name, seed) {
  const notSupported = () => {
    throw new Error(`${name} is read-only in the local data layer.`);
  };
  return {
    async list(sortField) {
      return sortRows(seed, sortField);
    },
    async get(id) {
      return seed.find((row) => row.id === id) ?? null;
    },
    create: notSupported,
    update: notSupported,
    delete: notSupported,
  };
}

function createLocalEntity(key, defaults = {}) {
  return {
    async list(sortField) {
      return sortRows(readStore(key), sortField);
    },
    async get(id) {
      return readStore(key).find((row) => row.id === id) ?? null;
    },
    async create(data) {
      const rows = readStore(key);
      const row = {
        ...defaults,
        ...data,
        id: data?.id ?? newId(),
        created_date: new Date().toISOString(),
      };
      writeStore(key, [...rows, row]);
      return row;
    },
    async update(id, data) {
      const rows = readStore(key);
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) return null;
      const row = { ...rows[index], ...data, id };
      rows[index] = row;
      writeStore(key, rows);
      return row;
    },
    async delete(id) {
      writeStore(
        key,
        readStore(key).filter((row) => row.id !== id)
      );
      return { id };
    },
  };
}

const localEntities = {
  SavedTrip: createLocalEntity("saved_trips"),
  Booking: createLocalEntity("bookings", { guests: 2, status: "pending" }),
};

let currentUserId = null;

/** Signed-in users read and write Supabase; everyone else stays on this device. */
export function setActiveUser(userId) {
  currentUserId = supabaseEnabled ? (userId ?? null) : null;
}

function resolve(name) {
  if (currentUserId) {
    return createSupabaseEntity(
      name === "SavedTrip" ? "saved_trips" : "bookings",
      currentUserId
    );
  }
  return localEntities[name];
}

function delegate(name) {
  return {
    list: (sortField) => resolve(name).list(sortField),
    get: (id) => resolve(name).get(id),
    create: (data) => resolve(name).create(data),
    update: (id, data) => resolve(name).update(id, data),
    delete: (id) => resolve(name).delete(id),
  };
}

export const entities = {
  Trip: createReadOnlyEntity("Trip", tripsSeed),
  SavedTrip: delegate("SavedTrip"),
  Booking: delegate("Booking"),
};

/**
 * Moves trips saved and bookings made as a guest into the account on sign-in.
 * Idempotent (upserts by primary key) and only clears the device copy once the
 * rows are safely stored, so a failed migration loses nothing.
 */
export async function migrateLocalDataToUser(userId, client = supabase) {
  const moved = { savedTrips: 0, bookings: 0 };
  if (!client || !userId) return moved;

  const localSaved = readStore("saved_trips");
  const localBookings = readStore("bookings");
  if (!localSaved.length && !localBookings.length) return moved;

  if (localSaved.length) {
    const { error } = await client.from("saved_trips").upsert(
      localSaved.map((row) => ({ user_id: userId, trip_id: row.trip_id })),
      { onConflict: "user_id,trip_id", ignoreDuplicates: true }
    );
    if (error) throw new Error(error.message);
    writeStore("saved_trips", []);
    moved.savedTrips = localSaved.length;
  }

  if (localBookings.length) {
    const { error } = await client.from("bookings").upsert(
      localBookings.map((row) => ({
        id: row.id,
        user_id: userId,
        trip_id: row.trip_id,
        departure_city: row.departure_city,
        travel_dates: row.travel_dates,
        guests: row.guests,
        guest_info: row.guest_info,
        booking_site: row.booking_site,
        total_paid: row.total_paid,
        status: row.status,
        confirmation_code: row.confirmation_code,
        created_date: row.created_date,
      })),
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (error) throw new Error(error.message);
    writeStore("bookings", []);
    moved.bookings = localBookings.length;
  }

  return moved;
}

export default { entities };
