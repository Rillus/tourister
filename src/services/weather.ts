/** Days ahead that Open-Meteo forecast covers reliably */
export const FORECAST_HORIZON_DAYS = 16;

/** Years of historical data to average for climate projections */
const CLIMATE_LOOKBACK_YEARS = 10;

export type WeatherKind = "forecast" | "average";

export interface DayWeather {
  date: string;
  kind: WeatherKind;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  weatherCode: number;
  summary: string;
}

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  95: "Thunderstorm",
};

export function summariseWeatherCode(code: number): string {
  return WEATHER_CODE_LABELS[code] ?? "Mixed conditions";
}

function daysBetween(from: Date, toIso: string): number {
  const to = new Date(toIso + "T12:00:00Z");
  const fromNoon = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 12)
  );
  return Math.round((to.getTime() - fromNoon.getTime()) / (24 * 60 * 60 * 1000));
}

export function classifyWeatherKind(
  dateIso: string,
  today: Date = new Date()
): WeatherKind {
  const delta = daysBetween(today, dateIso);
  if (delta >= 0 && delta <= FORECAST_HORIZON_DAYS) return "forecast";
  return "average";
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function mode(nums: number[]): number {
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
  let best = nums[0] ?? 0;
  let bestCount = 0;
  for (const [n, c] of counts) {
    if (c > bestCount) {
      best = n;
      bestCount = c;
    }
  }
  return best;
}

interface DailyBundle {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  weathercode: number[];
}

async function fetchJson(url: string): Promise<{ daily?: DailyBundle }> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  } as RequestInit);
  if (!res.ok) throw new Error(`Weather API error ${res.status}`);
  return res.json();
}

function parseDaily(
  daily: DailyBundle,
  date: string,
  kind: WeatherKind
): DayWeather | null {
  const i = daily.time.indexOf(date);
  if (i < 0) return null;
  const weatherCode = daily.weathercode[i] ?? 0;
  return {
    date,
    kind,
    tempMaxC: round1(daily.temperature_2m_max[i]),
    tempMinC: round1(daily.temperature_2m_min[i]),
    precipitationMm: round1(daily.precipitation_sum[i] ?? 0),
    weatherCode,
    summary: summariseWeatherCode(weatherCode),
  };
}

async function fetchForecast(
  latitude: number,
  longitude: number,
  dates: string[]
): Promise<DayWeather[]> {
  if (dates.length === 0) return [];
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(FORECAST_HORIZON_DAYS));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode"
  );

  const data = await fetchJson(url.toString());
  if (!data.daily) return [];

  return dates
    .map((d) => parseDaily(data.daily!, d, "forecast"))
    .filter((d): d is DayWeather => d != null);
}

/**
 * Climate-style average: mean of the same calendar day across recent past years.
 */
async function fetchClimateAverages(
  latitude: number,
  longitude: number,
  dates: string[],
  today: Date
): Promise<DayWeather[]> {
  if (dates.length === 0) return [];

  const yearNow = today.getUTCFullYear();
  const startYear = yearNow - CLIMATE_LOOKBACK_YEARS;
  const endYear = yearNow - 1;

  // Cover all requested month-days with one archive window spanning lookback years
  const monthDays = [...new Set(dates.map((d) => d.slice(5)))]; // MM-DD
  const months = monthDays.map((md) => Number(md.slice(0, 2)));
  const minMonth = Math.min(...months);
  const maxMonth = Math.max(...months);

  const startDate = `${startYear}-${String(minMonth).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(endYear, maxMonth, 0)).getUTCDate();
  const endDate = `${endYear}-${String(maxMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("timezone", "auto");
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode"
  );

  const data = await fetchJson(url.toString());
  if (!data.daily) return [];

  const byMonthDay = new Map<
    string,
    { max: number[]; min: number[]; precip: number[]; codes: number[] }
  >();

  for (let i = 0; i < data.daily.time.length; i++) {
    const md = data.daily.time[i].slice(5);
    if (!monthDays.includes(md)) continue;
    let bucket = byMonthDay.get(md);
    if (!bucket) {
      bucket = { max: [], min: [], precip: [], codes: [] };
      byMonthDay.set(md, bucket);
    }
    bucket.max.push(data.daily.temperature_2m_max[i]);
    bucket.min.push(data.daily.temperature_2m_min[i]);
    bucket.precip.push(data.daily.precipitation_sum[i] ?? 0);
    bucket.codes.push(data.daily.weathercode[i] ?? 0);
  }

  const avg = (xs: number[]) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

  return dates.map((date) => {
    const md = date.slice(5);
    const bucket = byMonthDay.get(md);
    if (!bucket || bucket.max.length === 0) {
      return {
        date,
        kind: "average" as const,
        tempMaxC: 0,
        tempMinC: 0,
        precipitationMm: 0,
        weatherCode: 0,
        summary: "No climate data",
      };
    }
    const weatherCode = mode(bucket.codes);
    return {
      date,
      kind: "average" as const,
      tempMaxC: round1(avg(bucket.max)),
      tempMinC: round1(avg(bucket.min)),
      precipitationMm: round1(avg(bucket.precip)),
      weatherCode,
      summary: summariseWeatherCode(weatherCode),
    };
  });
}

export async function fetchDayWeather(options: {
  latitude: number;
  longitude: number;
  dates: string[];
  today?: Date;
}): Promise<DayWeather[]> {
  const today = options.today ?? new Date();
  const uniqueDates = [...new Set(options.dates)].sort();

  const forecastDates = uniqueDates.filter(
    (d) => classifyWeatherKind(d, today) === "forecast"
  );
  const averageDates = uniqueDates.filter(
    (d) => classifyWeatherKind(d, today) === "average"
  );

  const [forecast, averages] = await Promise.all([
    fetchForecast(options.latitude, options.longitude, forecastDates),
    fetchClimateAverages(
      options.latitude,
      options.longitude,
      averageDates,
      today
    ),
  ]);

  const byDate = new Map<string, DayWeather>();
  for (const w of [...forecast, ...averages]) byDate.set(w.date, w);
  return uniqueDates.map((d) => byDate.get(d)).filter((w): w is DayWeather => !!w);
}
