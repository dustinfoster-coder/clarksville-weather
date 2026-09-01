const POINT_URL = "https://api.weather.gov/points/35.47,-93.48";

async function loadWeather() {

    console.log("Loading weather...");

    try {

        // Get point data
        const pointResponse = await fetch(POINT_URL, {
            cache: "no-store",
            headers: {
                "Accept": "application/geo+json"
            }
        });

        if (!pointResponse.ok) {
            throw new Error(`Point API error: ${pointResponse.status}`);
        }

        const pointData = await pointResponse.json();

        // Get hourly forecast
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
            throw new Error(`Hourly API error: ${hourlyResponse.status}`);
        }

        const hourlyData = await hourlyResponse.json();

        // Get observation stations
        const stationResponse = await fetch(
            pointData.properties.observationStations,
            {
                cache: "no-store",
                headers: {
                    "Accept": "application/geo+json"
                }
            }
        );

        if (!stationResponse.ok) {
            throw new Error(`Station API error: ${stationResponse.status}`);
        }

        const stationData = await stationResponse.json();

        const stationId = stationData.features[0].id;

        // Get latest observation
        const observationResponse = await fetch(
            `${stationId}/observations/latest`,
            {
                cache: "no-store",
                headers: {
                    "Accept": "application/geo+json"
                }
            }
        );

        if (!observationResponse.ok) {
            throw new Error(
                `Observation API error: ${observationResponse.status}`
            );
        }

        const observationData = await observationResponse.json();

        const periods = hourlyData.properties.periods;

        if (!periods || periods.length === 0) {
            throw new Error("No hourly forecast periods returned.");
        }

        const currentForecast = periods[0];

        // Current observed temperature
        const tempC =
            observationData.properties.temperature.value;

        const tempF =
            tempC != null
                ? (tempC * 9 / 5) + 32
                : currentForecast.temperature;

        document.getElementById("temperature").textContent =
            `${Math.round(tempF)}°`;

        // Forecast text
        document.getElementById("forecast").textContent =
            currentForecast.shortForecast;

        // Weather icon
        document.getElementById("weatherIcon").src =
            currentForecast.icon + "&t=" + Date.now();

        // Feels Like
        const heatIndexC =
            observationData.properties.heatIndex?.value;

        const windChillC =
            observationData.properties.windChill?.value;

        let feelsLikeF = tempF;

        if (heatIndexC != null) {
            feelsLikeF = (heatIndexC * 9 / 5) + 32;
        } else if (windChillC != null) {
            feelsLikeF = (windChillC * 9 / 5) + 32;
        }

        document.querySelector("#feelsLike span").textContent =
            `${Math.round(feelsLikeF)}°`;

        // NOAA update time
        document.getElementById("updateTime").textContent =
            new Date(
                observationData.properties.timestamp
            ).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
            });

        console.log(
            "Observation Temp:",
            Math.round(tempF)
        );

        console.log(
            "Forecast:",
            currentForecast.shortForecast
        );

        console.log(
            "Observation Updated:",
            observationData.properties.timestamp
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
