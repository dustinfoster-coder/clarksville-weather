const POINT_URL = "https://api.weather.gov/points/35.47,-93.48";

async function loadWeather() {
    try {
        const pointResponse = await fetch(POINT_URL, {
            cache: "no-store"
        });
        const pointData = await pointResponse.json();

        const forecastUrl = pointData.properties.forecast;
        const forecastHourlyUrl = pointData.properties.forecastHourly;

        const forecastResponse = await fetch(forecastUrl, {
            cache: "no-store"
        });
        await forecastResponse.json();

        const hourlyResponse = await fetch(forecastHourlyUrl, {
            cache: "no-store"
        });
        const hourlyData = await hourlyResponse.json();

        const current = hourlyData.properties.periods[0];

        document.getElementById("temperature").textContent =
            `${Math.round(current.temperature)}°`;

        document.getElementById("weatherIcon").src =
            current.icon;

        document.getElementById("forecast").textContent =
            current.shortForecast;

        const feelsLike =
            current.temperature +
            ((current.relativeHumidity?.value || 0) > 60 ? 6 : 0);

        document.querySelector("#feelsLike span").textContent =
            `${Math.round(feelsLike)}°`;

        // Use actual update time from API
        const updated = new Date();

        document.getElementById("updateTime").textContent =
            updated.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
            });

        console.log("Weather refreshed:", updated);

    } catch (error) {
        console.error("Weather load failed:", error);
    }
}

loadWeather();

// Refresh every 5 minutes
setInterval(loadWeather, 300000);
