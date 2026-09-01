```javascript
const POINT_URL = "https://api.weather.gov/points/35.47,-93.48";
const KRUE_OBSERVATION_URL =
    "https://api.weather.gov/stations/KRUE/observations/latest";

async function loadWeather() {

    console.log("Loading weather...");

    try {

        // ==========================================
        // GET CLARKSVILLE POINT INFORMATION
        // ==========================================

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


        // ==========================================
        // GET CLARKSVILLE HOURLY FORECAST
        // ==========================================

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

        const periods =
            hourlyData.properties.periods;

        if (!periods || periods.length === 0) {
            throw new Error(
                "No forecast periods returned."
            );
        }


        // ==========================================
        // GET CURRENT CONDITIONS FROM KRUE
        // ==========================================

        const observationResponse =
            await fetch(KRUE_OBSERVATION_URL, {
                cache: "no-store",
                headers: {
                    "Accept": "application/geo+json"
                }
            });

        if (!observationResponse.ok) {
            throw new Error(
                `Observation API error: ${observationResponse.status}`
            );
        }

        const observationData =
            await observationResponse.json();

        const observation =
            observationData.properties;


        // ==========================================
        // CURRENT TEMPERATURE
        // ==========================================

        let temperatureF;

        if (observation.temperature.value !== null) {

            const temperatureC =
                Number(observation.temperature.value);

            temperatureF =
                (temperatureC * 9 / 5) + 32;

        } else {

            // Fall back to Clarksville forecast
            temperatureF =
                Number(periods[0].temperature);
        }


        document.getElementById("temperature").textContent =
            `${Math.round(temperatureF)}°`;


        // ==========================================
        // FIND CURRENT CLARKSVILLE FORECAST PERIOD
        // ==========================================

        const now = new Date();

        let currentForecast =
            periods.find(period => {

                const start =
                    new Date(period.startTime);

                const end =
                    new Date(period.endTime);

                return now >= start && now < end;

            });

        if (!currentForecast) {
            currentForecast = periods[0];
        }


        // ==========================================
        // WEATHER ICON
        // ==========================================

        document.getElementById("weatherIcon").src =
            currentForecast.icon;


        // ==========================================
        // FORECAST DESCRIPTION
        // ==========================================

        document.getElementById("forecast").textContent =
            currentForecast.shortForecast;


        // ==========================================
        // FEELS LIKE
        // ==========================================

        let feelsLikeF = temperatureF;


        // Heat index
        if (observation.heatIndex?.value !== null &&
            observation.heatIndex?.value !== undefined) {

            const heatIndexC =
                Number(observation.heatIndex.value);

            feelsLikeF =
                (heatIndexC * 9 / 5) + 32;

        }

        // Wind chill
        else if (
            observation.windChill?.value !== null &&
            observation.windChill?.value !== undefined
        ) {

            const windChillC =
                Number(observation.windChill.value);

            feelsLikeF =
                (windChillC * 9 / 5) + 32;
        }


        document.querySelector(
            "#feelsLike span"
        ).textContent =
            `${Math.round(feelsLikeF)}°`;


        // ==========================================
        // UPDATE TIME
        // ==========================================

        if (observation.timestamp) {

            document.getElementById(
                "updateTime"
            ).textContent =
                new Date(
                    observation.timestamp
                ).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit"
                });

        } else {

            document.getElementById(
                "updateTime"
            ).textContent =
                new Date().toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit"
                });
        }


        // ==========================================
        // DEBUG INFORMATION
        // ==========================================

        console.log(
            "================================"
        );

        console.log(
            "NWS Clarksville Point:",
            "35.47, -93.48"
        );

        console.log(
            "Current Station:",
            "Russellville Regional Airport (KRUE)"
        );

        console.log(
            "Current Temperature:",
            Math.round(temperatureF) + "°F"
        );

        console.log(
            "Feels Like:",
            Math.round(feelsLikeF) + "°F"
        );

        console.log(
            "Clarksville Forecast:",
            currentForecast.shortForecast
        );

        console.log(
            "Observation Time:",
            observation.timestamp
        );

        console.log(
            "================================"
        );


    } catch (error) {

        console.error(
            "Weather load failed:",
            error
        );

        document.getElementById(
            "forecast"
        ).textContent =
            "Unable to load weather";
    }
}


// ==========================================
// LOAD WEATHER IMMEDIATELY
// ==========================================

loadWeather();


// ==========================================
// REFRESH EVERY 5 MINUTES
// ==========================================

setInterval(() => {

    console.log("5 minute refresh");

    loadWeather();

}, 5 * 60 * 1000);
```
