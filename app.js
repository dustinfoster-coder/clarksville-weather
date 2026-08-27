const POINT_URL = "https://api.weather.gov/points/35.47,-93.48";

async function loadWeather() {
    try {
        const pointResponse = await fetch(POINT_URL, {
            cache: "no-store"
        });

        const pointData = await pointResponse.json();

        const hourlyResponse = await fetch(
            pointData.properties.forecastHourly,
            {
                cache: "no-store"
            }
        );

        const hourlyData = await hourlyResponse.json();

        const now = new Date();

        const current =
            hourlyData.properties.periods.find(period => {
                const start = new Date(period.startTime);
                const end = new Date(period.endTime);
                return now >= start && now < end;
            }) || hourlyData.properties.periods[0];

        // Temperature
        document.getElementById("temperature").textContent =
            `${Math.round(current.temperature)}°`;

        // Weather icon
        document.getElementById("weatherIcon").src = current.icon;

        // Forecast text
        document.getElementById("forecast").textContent =
            current.shortForecast;

        // Feels Like calculation
        const temp = current.temperature;
        const humidity = current.relativeHumidity?.value || 0;

        let feelsLike = temp;

        if (temp >= 80) {
            feelsLike = temp + ((humidity - 40) / 10);
        }

        document.querySelector("#feelsLike span").textContent =
            `${Math.round(feelsLike)}°`;

        // Last updated time
        document.getElementById("updateTime").textContent =
            new Date().toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
            });

        console.log("Weather Updated");
        console.log("Period:", current.name);
        console.log("Temp:", current.temperature);
        console.log("Humidity:", humidity);
        console.log("Feels Like:", Math.round(feelsLike));

    } catch (error) {
        console.error("Weather load failed:", error);
    }
}

// Initial load
loadWeather();

// Refresh every 5 minutes
setInterval(loadWeather, 300000);
