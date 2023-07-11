const apikey = "535242788daa00a8212fcdbe720472da";
// let city = "abuja";
const DAYS_OF_THE_WEEK = ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];
let selectedCityText;
let selectedCity;
const getCurrentWeatherData = async ({lat, lon, name: city}) => {
  const url =
    lat && lon
      ? `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apikey}&units=metric`
      : `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apikey}&units=metric`;
  const response = await fetch(url);
  return response.json();
};

const getCitiesUsingGeoLocation = async (searchText) => {
  const response = await fetch(
    `http://api.openweathermap.org/geo/1.0/direct?q=${searchText}&limit=5&appid=${apikey}`
  );
  return response.json();
};

const getHourlyForcast = async ({ name: city }) => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apikey}&units=metric`
  );
  const data = await response.json();
  // console.log(data)
  return data.list.map((forecast) => {
    const {
      main: { temp, temp_max, temp_min },
      dt,
      dt_txt,
      weather: [{ description, icon }],
    } = forecast;
    return { temp, temp_max, temp_min, dt, dt_txt, description, icon };
  });
};

const getFeelsLike = async () => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apikey}&units=metric`
  );
  const data = await response.json();
};

const calculateDayWiseForecast = (hourlyforecast) => {
  let dayWiseForecast = new Map();
  for (let forecast of hourlyforecast) {
    const [date] = forecast.dt_txt.split(" ");
    const dayOfTheWeek = DAYS_OF_THE_WEEK[new Date(date).getDay()];
    // console.log(dayOfTheWeek);
    if (dayWiseForecast.has(dayOfTheWeek)) {
      let forecastForTheDay = dayWiseForecast.get(dayOfTheWeek);
      forecastForTheDay.push(forecast);
      dayWiseForecast.set(dayOfTheWeek, forecastForTheDay);
    } else {
      dayWiseForecast.set(dayOfTheWeek, [forecast]);
    }
  }
  for (let [key, value] of dayWiseForecast) {
    let temp_min = Math.min(...Array.from(value, (val) => val.temp_min));
    let temp_max = Math.max(...Array.from(value, (val) => val.temp_max));
    dayWiseForecast.set(key, {
      temp_min,
      temp_max,
      icon: value.find((v) => v.icon).icon,
    });
  }
  console.log(dayWiseForecast);
  return dayWiseForecast;
};

const loadFiveDaysForecast = async (hourlyforecast) => {
  // console.log(hourlyforecast);

  const dayWiseForecast = calculateDayWiseForecast(hourlyforecast);
  const container = document.querySelector(".five-dayforecast-container");
  let dayWiseInfo = "";
  Array.from(dayWiseForecast).map(
    ([day, { temp_max, temp_min, icon }], index) => {
      if (index < 5) {
        dayWiseInfo += `
          <article class="five-wise-forecast">
              <h3 class="day">${index === 0 ? "Today" : day}</h3>
              <img class="icon" src="${createIconUrl(icon)}" alt="weather-icon">
              <p class="min-temp">${formatTemp(temp_min)}</p>
              <p class="max-temp">${formatTemp(temp_max)}</p>
          </article>
      `;
      }
    }
  );

  container.innerHTML = dayWiseInfo;
};

const loadHourlyForecast = (
  { main: { temp: tempNow }, weather: [{ icon: iconNow }] },
  hourlyForecast
) => {
  // console.log(hourlyForecast);
  const timeFormatter = Intl.DateTimeFormat("en", {
    hour12: true,
    hour: "numeric",
  });
  let dataFor12Hours = hourlyForecast.slice(1, 13);
  const hourlyContainer = document.querySelector(".hourly-container");
  let innerHTMLString = `
      <article>
            <h3 class="time">Now</h3>
            <img class="icon" src="${createIconUrl(iconNow)}" alt="" />
            <p class="hourly-temp">${formatTemp(tempNow)}</p>
      </article>
  `;

  for (let { temp, icon, dt_txt } of dataFor12Hours) {
    innerHTMLString += `
      <article>
            <h3 class="time">${timeFormatter.format(new Date(dt_txt))}</h3>
            <img class="icon" src="${createIconUrl(icon)}" alt="" />
            <p class="hourly-temp">${formatTemp(temp)}</p>
      </article>
    `;
  }
  hourlyContainer.innerHTML = innerHTMLString;
};

const loadFeelsLike = ({ main: { feels_like } }) => {
  let container = document.querySelector("#feels-like");
  container.querySelector(".feels-like-temp").textContent =
    formatTemp(feels_like);
};

const loadHumidity = ({ main: { humidity } }) => {
  let container = document.querySelector("#humidity");
  container.querySelector(".humidity_value").textContent = `${humidity} %`;
};

// format decimal numbers (helper function)
const createIconUrl = (icon) => `http://openweathermap.org/img/w/${icon}.png`;
const formatTemp = (temp) => `${temp?.toFixed(1)}`;

const loadCurrentForecast = ({
  name,
  main: { temp, temp_max, temp_min },
  weather: [{ description, icon }],
}) => {
  const currentForecastElement = document.querySelector("#current-forecast");
  currentForecastElement.querySelector(".city").textContent = name;
  currentForecastElement.querySelector(".temp").textContent = formatTemp(temp);
  currentForecastElement.querySelector(".description").textContent =
    description;
  currentForecastElement.querySelector(
    ".min-max-temp"
  ).textContent = `H: ${formatTemp(temp_max)} L: ${formatTemp(temp_min)}`;
};

const loadData = async () => {
  const currentWheather = await getCurrentWeatherData(selectedCity);
  loadCurrentForecast(currentWheather);
  loadFeelsLike(currentWheather);
  loadHumidity(currentWheather);
  // End of current Weather Data
  const hourlyForecast = await getHourlyForcast(currentWheather);
  loadHourlyForecast(currentWheather, hourlyForecast);
  loadFiveDaysForecast(hourlyForecast);
  
}

const loadForecastUsingGeoLaoction = () => {
  // location from your ISP(lon, lat)
  navigator.geolocation.getCurrentPosition(({coords}) => {
    const {latitude:lat, longitude: lon} = coords;
    selectedCity = {lat, lon};
    loadData(selectedCity)
  }, error => console.log(error))
}

function debounce(func) {
  let timer;
  return (...args) => {
    clearTimeout(timer); //clear existing timer
    // create a new time till the user finished typing;
    timer = setTimeout(() => {
      console.log("debounce")
      func.apply(this, args);
    }, 500);
  };
}

// Has to do with user search
const onSearchChange = async (e) => {
  const { value } = e.target;
  if(!value){
    selectedCity = null;
    selectedCityText = '';
  }
  if (value && (selectedCityText !== value)) {
    let listOfCities = await getCitiesUsingGeoLocation(value);
    let options = "";
    for (let { lon, lat, country, name, state } of listOfCities) {
      options += `<option data-city-details='${JSON.stringify({
        lon,
        name,
        lon,
      })}' value="${name}, ${state}"></option>`;
    }
    document.getElementById("cities").innerHTML = options;
  
  }  
 
};

// option which has been selected by user
const handleCitySelection = (event) => {
  selectedCityText = event.target.value;
  let options = document.querySelectorAll("#cities > options");
  console.log(options);
  if(options?.length){
    let selectedOption = Array.from(options).find(opt => opt.value === selectedCityText);
    selectedCity = JSON.parse(selectedOption.getAttribute("data-city-details"));
    console.log(selectedCity);
    loadData();
  }
};

const debounceSearch = debounce((event) => onSearchChange(event));

document.addEventListener("DOMContentLoaded", async () => {
  loadForecastUsingGeoLaoction()
  const searchInput = document.querySelector("#search");
  searchInput.addEventListener("input", debounceSearch);
  searchInput.addEventListener("change", handleCitySelection);
  
});
