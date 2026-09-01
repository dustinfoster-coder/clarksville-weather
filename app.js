const POINT_URL = "https://api.weather.gov/points/35.47,-93.48";
const KRUE_URL = "https://api.weather.gov/stations/KRUE/observations/latest";

async function loadWeather() {
    console.log("Loading weather...");

    try {
        // Get Clarksville point information
        const pointResponse = await fetch(POINT_URL, {
            cache: "no-store",
            headers: {
                "Accept": "application/geo+json"
            }
        });

        if (!pointResponse.ok) {
            throw new Error("Point API error: " + pointResponse.status);
        }

        const pointData = await pointResponse.json();

        // Get Clarksville hourly forecast
        const hourlyResponse = await fetch(
            pointData.properties.forecastHourly,
            {
                cache: "no-store",
                headers: {
                    "Accept": "application/geo+json"
                }
            }
        );

        if (!hourlyResponse.ok) {
            throw new Error("Hourly API error: " + hourlyResponse.status);
        }

        const hourlyData = await hourlyResponse.json();
        const periods = hourlyData.properties.periods;

        if (!periods || periods.length === 0) {
            throw new Error("No forecast periods returned.");
        }

        // Get current observation from KRUE
        const observationResponse = await fetch(KRUE_URL, {
            cache: "no-store",
            headers: {
                "Accept": "application/geo+json"
            }
        });

        if (!observationResponse.ok) {
            throw new Error(
                "Observation API error: " +
                observationResponse.status
            );
        }

        const observationData =
            await observationResponse.json();

        const observation =
            observationData.properties;

        // Find the current Clarksville forecast period
        const now = new Date();

        let currentForecast = periods.find(period => {
            const start = new Date(period.startTime);
            const end = new Date(period.endTime);

            return now >= start && now < end;
        });

        if (!currentForecast) {
            currentForecast = periods[0];
        }

        // Current temperature from KRUE
        let temperatureF;

        if (observation.temperature.value !== null) {
            const temperatureC =
                Number(observation.temperature.value);

            temperatureF =
                (temperatureC * 9 / 5) + 32;
        } else {
            temperatureF =
                Number(currentForecast.temperature);
        }

        // Temperature
        document.getElementById("temperature").textContent =
            Math.round(temperatureF) + "°";

        // Weather icon
        document.getElementById("weatherIcon").src =
            currentForecast.icon;

        // Forecast description
        document.getElementById("forecast").textContent =
            currentForecast.shortForecast;

        // Feels like
        let feelsLikeF = temperatureF;

        if (
            observation.heatIndex &&
            observation.heatIndex.value !== null
        ) {
            const heatIndexC =
                Number(observation.heatIndex.value);

            feelsLikeF =
                (heatIndexC * 9 / 5) + 32;

        } else if (
            observation.windChill &&
            observation.windChill.value !== null
        ) {
            const windChillC =
                Number(observation.windChill.value);

            feelsLikeF =
                (windChillC * 9 / 5) + 32;
        }

        document.querySelector(
            "#feelsLike span"
        ).textContent =
            Math.round(feelsLikeF) + "°";

        // NOAA observation update time
        if (observation.timestamp) {
            document.getElementById("updateTime").textContent =
                new Date(
                    observation.timestamp
                ).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit"
                });
        }

        // Console information
        console.log("------------------------------");
        console.log(
            "Station: Russellville Regional Airport (KRUE)"
        );
        console.log(
            "Temperature:",
            Math.round(temperatureF) + "°F"
        );
        console.log(
            "Feels Like:",
            Math.round(feelsLikeF) + "°F"
        );
        console.log(
            "Forecast:",
            currentForecast.shortForecast
        );
        console.log(
            "Observation Time:",
            observation.timestamp
        );
        console.log("------------------------------");

    } catch (error) {
        console.error("Weather load failed:", error);

        document.getElementById("forecast").textContent =
            "Unable to load weather";
    }
}

// Load immediately
loadWeather();

// Refresh every 5 minutes
setInterval(function () {
    console.log("5 minute refresh");
    loadWeather();
}, 5 * 60 * 1000);
