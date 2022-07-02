var apiKey = "53661fc62fb03d43161d6b8715167666";
var limit = 5;
// Can change the units to metric or imperial
var units = "metric";
// Change the tempUnits and windUnits based on the unit
var tempUnit = units === "metric" ? "\u00B0C" : "\u00B0F";
var windUnit = units === "metric" ? "KPH" : "MPH";
var humidityUnit = "%";
var cities = ["Austin", "Chicago", "New York", "Orlando", "San Francisco", "Seattle", "Denver", "Atlanta"];

async function getCooordFromCity(cityName) {
    // Returns an object for lat and lon based on the city name
    // Returns -1 if city was not found
    var cityCoord = await fetch("http://api.openweathermap.org/geo/1.0/direct?q=" + cityName + "&limit=" + limit + "&appid=" + apiKey)
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
    var forecast = await fetch("http://api.openweathermap.org/data/2.5/onecall?exclude=minutely,hourly,alerts&lat=" + lat + "&lon=" + lon + "&units=" + units + "&appid=" + apiKey)
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
    
    var heading = $("<h1>");
    heading.text(city + " " + currentDate);
    
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
    
    dashboard.append(heading, info);
}

function populateForecastDashboard(forecastWeather) {
    // Adds the 5 day forecast to the dashboard
    var dashboard = $("#5-day-forecast");
    // Keep track of the previous date
    var prevDate = "";
    
    dashboard.empty();
    
    for (var i = 0; i < 5; i++) {
        var weather = forecastWeather[i];
        
        var date = moment.unix(weather.dt, 'X').format('DD/MM/YYYY')
        
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
        
        var info = $("<p>");
        info.addClass("card-text")
        info.html("Temp: " + weather.temp.day + tempUnit + "<br />" +
                "Wind: " + weather.wind_speed + windUnit + "<br />" +
                "Humidity: " + weather.humidity + humidityUnit);
        
        card.append(title, info);
        dashboard.append(card);
    }
}

function addCityButtons() {
    // Adds all the city buttons on the side panel
    var sidePanel = $("#side-panel");
    
    for (var c = 0; c < cities.length; c++) {
        var currCity = cities[c];
        
        var cityBtn = $("<div>");
        cityBtn.addClass("btn btn-secondary col-12 custom-btn");
        cityBtn.text(currCity);
        
        // Event handler for the buttons
        cityBtn.on("click", function(event) {
            updateWeatherDashboardSearch(event.target.innerHTML);
        });
        
        sidePanel.append(cityBtn);
    }
}

function updateWeatherDashboardSearch(city) {
    // Updates the whole dashboard when a search is made
    getCooordFromCity(city).then(function(data) {
        get7DayWeather(data.lat, data.lon).then(function(data) {
            populateCurrentWeatherDashboard(city, data.current);
            populateForecastDashboard(data.daily);
        });
    });
}

// program start
addCityButtons();
updateWeatherDashboardSearch("San Diego");
// Event handler when searching
$("#search").on("click", function(event) {
    event.preventDefault();
    
    var city = $("#search-city").val();
    updateWeatherDashboardSearch(city);
});