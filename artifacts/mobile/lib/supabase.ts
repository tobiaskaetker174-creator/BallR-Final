import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_SUPABASE_URL) ||
  "https://hjybaxcryvtydktktmis.supabase.co";

const SUPABASE_ANON_KEY =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqeWJheGNyeXZ0eWRrdGt0bWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMjc4ODMsImV4cCI6MjA4OTcwMzg4M30.kip_J82vrZdz1ePB2-bhSzNs4npFKobOgSj3fBk3yZE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const API_BASE =
  "https://hjybaxcryvtydktktmis.supabase.co/functions/v1/ballr-api";

export const MAYA_CHEN_ID = "9fb9a9e0-7646-4af2-9782-ee8e03dc6d55";

export const CITY_IDS = {
  bangkok: "c1000000-0000-0000-0000-000000000001",
  bali: "c1000000-0000-0000-0000-000000000002",
};
