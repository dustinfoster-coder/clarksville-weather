const POINT_URL = "https://api.weather.gov/points/35.47,-93.48";

async function loadWeather() {
    try {
        const pointResponse = await fetch(POINT_URL);
        const pointData = await pointResponse.json();

        const forecastUrl = pointData.properties.forecast;
        const forecastHourlyUrl = pointData.properties.forecastHourly;

        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        const hourlyResponse = await fetch(forecastHourlyUrl);
        const hourlyData = await hourlyResponse.json();

        const current = hourlyData.properties.periods[0];

        document.getElementById("temperature").textContent =
            `${Math.round(current.temperature)}°`;

        document.getElementById("weatherIcon").src =
            current.icon;

        document.getElementById("forecast").textContent =
            current.shortForecast;

        // Approximate "Feels Like"
        const feelsLike =
            current.temperature +
            (current.relativeHumidity?.value > 60 ? 6 : 0);

        document.querySelector("#feelsLike span").textContent =
            `${Math.round(feelsLike)}°`;

        const updated = new Date(current.startTime);

        document.getElementById("updateTime").textContent =
            updated.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
            });

    } catch (error) {
        console.error("Weather load failed:", error);
    }
}

loadWeather();
setInterval(loadWeather, 300000); // Refresh every 5 minutes
