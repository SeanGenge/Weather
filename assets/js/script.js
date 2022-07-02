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
    var forecast = await fetch("http://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&units=" + units + "&appid=" + apiKey)
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
    var currentDate = moment(currentWeather.dt_txt).format("MM/DD/YYYY");
    
    var heading = $("<h1>");
    heading.text(city + " " + currentDate);
    
    var info = $("<div>");
    info.html("Temp: " + currentWeather.main.temp + tempUnit + "<br />" +
              "Wind: " + currentWeather.wind.speed + windUnit + "<br />" +
              "Humidity: " + currentWeather.main.humidity + humidityUnit + "<br />" + 
              "UV Index: ");
    
    dashboard.append(heading, info);
}

function populateForecastDashboard(forecastWeather) {
    // Adds the 5 day forecast to the dashboard
    var dashboard = $("#5-day-forecast");
    // Keep track of the previous date
    var prevDate = moment(forecastWeather[0].dt_txt).format("MM/DD/YYYY");
    
    for (var i = 1; i < forecastWeather.length; i++) {
        var weather = forecastWeather[i];
        
        var date = moment(weather.dt_txt).format("MM/DD/YYYY");
        
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
        info.html("Temp: " + weather.main.temp + tempUnit + "<br />" +
                "Wind: " + weather.wind.speed + windUnit + "<br />" +
                "Humidity: " + weather.main.humidity + humidityUnit);
        
        card.append(title, info);
        dashboard.append(card);
    }
}

getCooordFromCity("London").then(function(data) {
    get7DayWeather(data.lat, data.lon).then(function(data) {
        console.log(data);
        populateCurrentWeatherDashboard(data.city.name, data.list[0]);
        populateForecastDashboard(data.list);
    });
});