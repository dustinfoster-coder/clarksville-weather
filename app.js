const POINT_URL = "https://api.weather.gov/points/35.47,-93.48";

async function loadWeather() {

    console.log("Loading weather...");

    try {

        // ---------------------------------------
        // GET NWS POINT INFORMATION
        // ---------------------------------------

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

        const forecastURL =
            pointData.properties.forecast;

        const hourlyURL =
            pointData.properties.forecastHourly;


        // ---------------------------------------
        // GET REGULAR POINT FORECAST
        // ---------------------------------------

        const forecastResponse = await fetch(
            forecastURL,
            {
                cache: "no-store",
                headers: {
                    "Accept": "application/geo+json"
                }
            }
        );

        if (!forecastResponse.ok) {
            throw new Error(
                `Forecast API error: ${forecastResponse.status}`
            );
        }

        const forecastData =
            await forecastResponse.json();


        // ---------------------------------------
        // GET HOURLY FORECAST
        // ---------------------------------------

        const hourlyResponse = await fetch(
            hourlyURL,
            {
                cache: "no-store",
                headers: {
                    "Accept": "application/geo+json"
                }
            }
        );

        if (!hourlyResponse.ok) {
            throw new Error(
                `Hourly API error: ${hourlyResponse.status}`
            );
        }

        const hourlyData =
            await hourlyResponse.json();


        const forecastPeriods =
            forecastData.properties.periods;

        const hourlyPeriods =
            hourlyData.properties.periods;


        if (!forecastPeriods || forecastPeriods.length === 0) {
            throw new Error("No forecast periods returned.");
        }

        if (!hourlyPeriods || hourlyPeriods.length === 0) {
            throw new Error("No hourly periods returned.");
        }


        // ---------------------------------------
        // FIND CURRENT HOURLY PERIOD
        // ---------------------------------------

        const now = new Date();

        let currentHourly =
            hourlyPeriods.find(period => {

                const start =
                    new Date(period.startTime);

                const end =
                    new Date(period.endTime);

                return now >= start && now < end;

            });


        // If the current period isn't found,
        // use the first available period.

        if (!currentHourly) {
            currentHourly =
                hourlyPeriods[0];
        }


        // ---------------------------------------
        // TEMPERATURE
        // ---------------------------------------

        const temperature =
            Number(currentHourly.temperature);

        document.getElementById("temperature").textContent =
            `${Math.round(temperature)}°`;


        // ---------------------------------------
        // WEATHER ICON
        // ---------------------------------------

        document.getElementById("weatherIcon").src =
            currentHourly.icon;


        // ---------------------------------------
        // WEATHER DESCRIPTION
        // ---------------------------------------

        document.getElementById("forecast").textContent =
            currentHourly.shortForecast;


        // ---------------------------------------
        // FEELS LIKE
        // ---------------------------------------

        let feelsLike =
            temperature;


        // Use NWS apparent temperature
        // if available.

        if (
            currentHourly.temperature != null &&
            currentHourly.relativeHumidity &&
            currentHourly.relativeHumidity.value != null
        ) {

            const humidity =
                Number(
                    currentHourly.relativeHumidity.value
                );

            if (
                temperature >= 80 &&
                humidity > 0
            ) {

                feelsLike =
                    temperature +
                    ((humidity - 40) / 10);

            }
        }


        document.querySelector(
            "#feelsLike span"
        ).textContent =
            `${Math.round(feelsLike)}°`;


        // ---------------------------------------
        // NWS FORECAST UPDATE TIME
        // ---------------------------------------

        const updated =
            hourlyData.properties.updated;


        if (updated) {

            document.getElementById(
                "updateTime"
            ).textContent =
                new Date(updated).toLocaleTimeString(
                    [],
                    {
                        hour: "numeric",
                        minute: "2-digit"
                    }
                );

        } else {

            document.getElementById(
                "updateTime"
            ).textContent =
                new Date().toLocaleTimeString(
                    [],
                    {
                        hour: "numeric",
                        minute: "2-digit"
                    }
                );
        }


        // ---------------------------------------
        // DEBUG INFORMATION
        // ---------------------------------------

        console.log(
            "NWS Point:",
            "35.47, -93.48"
        );

        console.log(
            "Current Hour:",
            currentHourly.name
        );

        console.log(
            "Temperature:",
            currentHourly.temperature
        );

        console.log(
            "Forecast:",
            currentHourly.shortForecast
        );

        console.log(
            "NWS Updated:",
            hourlyData.properties.updated
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


// ---------------------------------------
// LOAD IMMEDIATELY
// ---------------------------------------

loadWeather();


// ---------------------------------------
// REFRESH EVERY 5 MINUTES
// ---------------------------------------

setInterval(() => {

    console.log(
        "5 minute refresh"
    );

    loadWeather();

}, 5 * 60 * 1000);
