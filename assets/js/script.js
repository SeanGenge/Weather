var apiKey = "53661fc62fb03d43161d6b8715167666";
var limit = 5;
// Can change the units to metric or imperial
var units = "metric";
// Change the tempUnits and windUnits based on the unit
var tempUnit = units === "metric" ? "\u00B0C" : "\u00B0F";
var windUnit = units === "metric" ? "KPH" : "MPH";
var humidityUnit = "%";
var cities = [];

async function getCooordFromCity(cityName) {
    // Returns an object for lat and lon based on the city name
    // Returns -1 if city was not found
    var cityCoord = await fetch("https://api.openweathermap.org/geo/1.0/direct?q=" + cityName + "&limit=" + limit + "&appid=" + apiKey)
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].name.toLowerCase() === cityName.toLowerCase()) {
                return { "city": cityName.toLowerCase(), "lat": data[i].lat, "lon": data[i].lon };
            }
        }
        
        return -1;
    });
    
    return cityCoord;
}

async function get7DayWeather(lat, lon) {
    // Returns the current weather over 7 days based on the latitude and longitude
    var forecast = await fetch("https://api.openweathermap.org/data/2.5/onecall?exclude=minutely,hourly,alerts&lat=" + lat + "&lon=" + lon + "&units=" + units + "&appid=" + apiKey)
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        // Retrieve the specific data needed
        return data;
    });
    
    return forecast;
}

function populateCurrentWeatherDashboard(city, currentWeather) {
    // Adds the current weather to the dashboard
    var dashboard = $("#current-weather");
    var currentDate = moment(currentWeather.dt, 'X').format('DD/MM/YYYY');
    
    dashboard.empty();
    
    var heading = $("<div>");
    heading.text(city + " " + currentDate);
    heading.addClass("h2");
    
    var weatherIcon = $("<img>");
    weatherIcon.attr('src', getWeatherIconUrl(currentWeather.weather));
    weatherIcon.addClass("custom-icon-sm");
    
    // Do the uvi separately so you can change the background colour based on the uvi
    var uvi = $("<span>");
    uvi.text(currentWeather.uvi);
    uvi.addClass("uvi");
    
    // Colours based on this site: http://www.bom.gov.au/uv/about_uv_index.shtml#:~:text=The%20UV%20Index%20is%20a,square%20metre%20of%20UV%20radiation.
    if (currentWeather.uvi <= 2) {
        uvi.addClass("green");
    }
    else if (currentWeather.uvi <= 5) {
        uvi.addClass("yellow");
    }
    else if (currentWeather.uvi <= 7) {
        uvi.addClass("orange");
    }
    else if (currentWeather.uvi <= 10) {
        uvi.addClass("red");
    }
    else {
        uvi.addClass("purple");
    }
    
    var info = $("<div>");
    info.html("Temp: " + currentWeather.temp + tempUnit + "<br />" +
              "Wind: " + currentWeather.wind_speed + windUnit + "<br />" +
              "Humidity: " + currentWeather.humidity + humidityUnit + "<br />" + 
              "UV Index: ");
    info.addClass("info");
              
    info.append(uvi);
    
    heading.append(weatherIcon);
    dashboard.append(heading, info);
}

function populateForecastDashboard(forecastWeather) {
    // Adds the 5 day forecast to the dashboard
    var dashboard = $("#forecast");
    // Keep track of the previous date
    var prevDate = "";
    
    dashboard.empty();
    
    for (var i = 1; i <= 5; i++) {
        var weather = forecastWeather[i];
        
        var date = moment.unix(weather.dt, 'X').format('DD/MM/YYYY');
        
        // Checks if the current date matches the prevDate. If it does then skip that date until the date is the next day
        if (date === prevDate) {
            continue;
        }
        else {
            prevDate = date;
        }
    
        var card = $("<div>");
        card.addClass("card custom-card");
        
        var cardBody = $("<div>");
        cardBody.addClass("card-body")
        
        var title = $("<h3>");
        title.addClass("card-title")
        title.text(date);
        
        var weatherIcon = $("<img>");
        weatherIcon.attr('src', getWeatherIconUrl(weather.weather));
        weatherIcon.addClass("custom-icon-lg");
        
        var info = $("<p>");
        info.addClass("card-text")
        info.html("Temp: " + weather.temp.day + tempUnit + "<br />" +
                "Wind: " + weather.wind_speed + windUnit + "<br />" +
                "Humidity: " + weather.humidity + humidityUnit);
        
        card.append(title, weatherIcon, info);
        dashboard.append(card);
    }
}

function getWeatherIconUrl(weather) {
    // Returns the weather icon class based on the weather
    return "https://openweathermap.org/img/wn/" + weather[0].icon + "@2x.png";
}

function populateCityButtons() {
    // Adds all the city buttons on the side panel
    var sidePanel = $("#side-panel");
    
    // Remove all the elements in the side panel first
    $("div.city-btn").remove();
    
    for (var c = 0; c < cities.length; c++) {
        var currCity = cities[c];
        
        var cityBtn = $("<div>");
        cityBtn.addClass("btn btn-secondary col-12 custom-btn city-btn");
        cityBtn.text(currCity);
        
        // Event handler for the buttons
        cityBtn.on("click", function(event) {
            updateWeatherDashboardSearch(event.target.innerHTML);
        });
        
        // Append the button to the side panel
        sidePanel.append(cityBtn);
    }
}

function updateWeatherDashboardSearch(city) {
    var currDate = moment().format('DD/MM/YYYY');
    var key = city + "_" + currDate;
    var history = localStorage.getItem(key);
    
    if (history !== null) {
        // Convert object to json again
        var storedData = JSON.parse(history);
        // Updates the whole dashboard when a search is made
        populateCurrentWeatherDashboard(city, storedData.current);
        populateForecastDashboard(storedData.daily);
    }
    else {
        // Get the data from the API
        getCooordFromCity(city).then(function(data) {
            if (data !== -1) {
                get7DayWeather(data.lat, data.lon).then(function(data) {
                    // Save the data in local storage
                    localStorage.setItem(key, JSON.stringify(data));
                    
                    // Updates the whole dashboard when a search is made
                    populateCurrentWeatherDashboard(city, data.current);
                    populateForecastDashboard(data.daily);
                });
            }
        });
    }
    
    // Add the city to the button
    if (!cities.includes(city))
        cities.push(city);
    populateCityButtons();
}

// program start
updateWeatherDashboardSearch("Melbourne");
// Event handler when searching
$("#search").on("click", function(event) {
    event.preventDefault();
    
    var city = $("#search-city").val();
    updateWeatherDashboardSearch(city);
    
    // Clear the text box
    $("#search-city").val('');
});