/*
  IMPORTANT:
  The only location input is the exact NWS point supplied by the user:
      https://api.weather.gov/points/35.47,-93.48

  We do NOT select an observation station.
  We do NOT use /observations/latest.
  We follow the "forecastHourly" URL returned by the exact point response.

  NWS documents /points as the method for translating a lat/lon into the
  correct current NWS forecast grid. The hourly forecast is then used for
  the temperature and condition at that grid location.
*/

const POINT_URL = "https://api.weather.gov/points/35.47,-93.48";

const HEADERS = {
  "Accept": "application/geo+json, application/json"
};

async function getJSON(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function roundF(value) {
  return value == null ? null : Math.round(value);
}

function heatIndexF(T, RH) {
  if (T == null || RH == null) return T;

  // NWS heat-index calculation. For cooler conditions, the apparent
  // temperature is simply the actual temperature.
  if (T < 80 || RH < 40) return T;

  const c1 = -42.379;
  const c2 = 2.04901523;
  const c3 = 10.14333127;
  const c4 = -0.22475541;
  const c5 = -0.00683783;
  const c6 = -0.05481717;
  const c7 = 0.00122874;
  const c8 = 0.00085282;
  const c9 = -0.00000199;

  let HI = c1 + c2*T + c3*RH + c4*T*RH +
           c5*T*T + c6*RH*RH + c7*T*T*RH +
           c8*T*RH*RH + c9*T*T*RH*RH;

  // NWS low-humidity adjustment
  if (RH < 13 && T >= 80 && T <= 112) {
    const adjustment = ((13-RH)/4) *
      Math.sqrt((17-Math.abs(T-95))/17);
    HI -= adjustment;
  }

  // NWS high-humidity adjustment
  if (RH > 85 && T >= 80 && T <= 87) {
    const adjustment = ((RH-85)/10) * ((87-T)/5);
    HI += adjustment;
  }

  return HI;
}

function symbol(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("thunder")) return "⚡";
  if (t.includes("snow") || t.includes("sleet") || t.includes("ice")) return "❄";
  if (t.includes("rain") || t.includes("shower")) return "☂";
  if (t.includes("cloud")) return "☁";
  if (t.includes("fog")) return "≋";
  return "☀";
}

function timeInZone(iso, zone) {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit"
  });
}

function chooseCurrentPeriod(periods, zone) {
  const now = new Date();

  // Prefer the hourly period that actually contains the current instant.
  const containing = periods.find(p => {
    const start = new Date(p.startTime);
    const end = new Date(p.endTime);
    return now >= start && now < end;
  });

  if (containing) return containing;

  // If there is a small timing mismatch, use the nearest current/future hour.
  return periods.reduce((best, p) => {
    const diff = Math.abs(new Date(p.startTime) - now);
    const bestDiff = Math.abs(new Date(best.startTime) - now);
    return diff < bestDiff ? p : best;
  }, periods[0]);
}

async function updateWeather() {
  try {
    // STEP 1: exact point supplied by the user.
    const point = await getJSON(POINT_URL);
    const props = point.properties;

    // STEP 2: follow the forecastHourly URL returned by that point.
    const hourly = await getJSON(props.forecastHourly);
    const periods = hourly.properties.periods;

    if (!periods?.length) throw new Error("NWS returned no hourly forecast periods.");

    // STEP 3: use the hourly period corresponding to NOW at this point.
    const current = chooseCurrentPeriod(periods, props.timeZone);

    const temperature = roundF(current.temperature);
    const humidity = current.relativeHumidity?.value ?? null;
    const feelsLike = roundF(heatIndexF(temperature, humidity));

    document.getElementById("temperature").textContent =
      temperature ?? "--";

    document.getElementById("feelsLike").textContent =
      (feelsLike ?? temperature ?? "--") + "°";

    document.getElementById("condition").textContent =
      current.shortForecast || "Clear";

    document.getElementById("weatherIcon").textContent =
      symbol(current.shortForecast);

    document.getElementById("updated").textContent =
      timeInZone(current.startTime, props.timeZone);

  } catch (error) {
    console.error("NWS widget error:", error);
    document.getElementById("condition").textContent = "Weather unavailable";
  }
}

updateWeather();
setInterval(updateWeather, 5 * 60 * 1000);
