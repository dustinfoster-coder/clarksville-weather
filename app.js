const POINT_URL = "https://api.weather.gov/points/35.47,-93.48";

async function loadWeather() {

    console.log("Loading weather...");

    try {

        // Get NWS point information
        const pointResponse = await fetch(POINT_URL, {
            cache: "no-store",
            headers: {
                "Accept": "application/geo+json"
            }
        });

        if (!pointResponse.ok) {
            throw new Error(
                `Point API error: ${pointResponse.status}`
            );
        }

        const pointData = await pointResponse.json();

        const hourlyURL =
            pointData.properties.forecastHourly;

        // Get hourly forecast
        const hourlyResponse = await fetch(hourlyURL, {
            cache: "no-store",
            headers: {
                "Accept": "application/geo+json"
            }
        });

        if (!hourlyResponse.ok) {
            throw new Error(
                `Hourly API error: ${hourlyResponse.status}`
            );
        }

        const hourlyData = await hourlyResponse.json();

        const periods = hourlyData.properties.periods;

        if (!periods || periods.length === 0) {
            throw new Error("No forecast periods returned.");
        }

        const now = new Date();

        // Find the current forecast period
        let current = periods.find(period => {

            const start = new Date(period.startTime);
            const end = new Date(period.endTime);

            return now >= start && now < end;

        });

        // If current period isn't found, use first period
        if (!current) {
            current = periods[0];
        }

        console.log("Current period:", current.name);
        console.log("Temperature:", current.temperature);
        console.log("Forecast:", current.shortForecast);

        // -----------------------------
        // TEMPERATURE
        // -----------------------------

        document.getElementById("temperature").textContent =
            `${Math.round(current.temperature)}°`;

        // -----------------------------
        // WEATHER ICON
        // -----------------------------

        document.getElementById("weatherIcon").src =
            current.icon;

        // -----------------------------
        // FORECAST
        // -----------------------------

        document.getElementById("forecast").textContent =
            current.shortForecast;

        // -----------------------------
        // FEELS LIKE
        // -----------------------------

        const temp = Number(current.temperature);

        const humidity =
            current.relativeHumidity &&
            current.relativeHumidity.value != null
                ? Number(current.relativeHumidity.value)
                : 0;

        let feelsLike = temp;

        if (temp >= 80 && humidity > 0) {

            feelsLike =
                temp + ((humidity - 40) / 10);

        }

        document.querySelector("#feelsLike span").textContent =
            `${Math.round(feelsLike)}°`;

        // -----------------------------
        // UPDATED TIME
        // -----------------------------

        document.getElementById("updateTime").textContent =
            new Date().toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit"
            });

        console.log(
            "Weather successfully updated:",
            new Date().toLocaleTimeString()
        );

    } catch (error) {

        console.error("Weather load failed:", error);

        document.getElementById("forecast").textContent =
            "Unable to load weather";

    }
}


// Load immediately
loadWeather();


// Refresh every 5 minutes
setInterval(() => {

    console.log("5 minute refresh");

    loadWeather();

}, 5 * 60 * 1000);
