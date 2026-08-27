const POINT = "https://api.weather.gov/points/35.47,-93.48";
const HEADERS = {
  "Accept": "application/geo+json, application/json",
  "User-Agent": "ClarksvilleSchoolDistrictWeatherWidget/1.0"
};

async function getJSON(url){
  const response = await fetch(url, {headers: HEADERS});
  if(!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function degrees(value){
  return value == null ? "--" : Math.round(value);
}

function timeString(dateString){
  if(!dateString) return "--";
  return new Date(dateString).toLocaleTimeString("en-US",{
    timeZone:"America/Chicago",
    hour:"numeric",
    minute:"2-digit"
  });
}

async function loadWeather(){
  try{
    const point = await getJSON(POINT);
    const props = point.properties;

    const stations = await getJSON(props.observationStations);
    const stationUrl = stations.features?.[0]?.id;
    if(!stationUrl) throw new Error("No observation station found.");

    const latest = await getJSON(stationUrl + "/observations/latest");
    const p = latest.properties;

    document.getElementById("temp").textContent = degrees(p.temperature?.value);

    // NWS supplies heatIndex when available. If not, use wind chill,
    // then apparent temperature, then the actual temperature.
    const feelsValue =
      p.heatIndex?.value ??
      p.windChill?.value ??
      p.apparentTemperature?.value ??
      p.temperature?.value;

    document.getElementById("feels").textContent =
      degrees(feelsValue) + "°";

    document.getElementById("condition").textContent =
      p.textDescription || "Clear";

    document.getElementById("updated").textContent =
      timeString(p.timestamp);

  }catch(error){
    console.error(error);
    document.getElementById("condition").textContent = "Weather unavailable";
  }
}

loadWeather();
setInterval(loadWeather, 5 * 60 * 1000);
