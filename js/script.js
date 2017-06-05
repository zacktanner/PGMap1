 // Vars
var geojson;
var map;
var info;
var legend;

window.onload = function() {

  // Initialize the map frame
  map = L.map('map').setView([40.4451, -80.0088], 10.49);

  // Add the actual map overlay
  // NOTE:  This tileLayer, including the key, is copied from the leaflet.js tutorial
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.light'
	}).addTo(map);

  // Add municipality geography
  $.getJSON("/geo/municipal.geojson", function(result) {

    // Get the liens data
    $.getJSON("/geo/liens.json", function(result2) {
      result.features.forEach(function(municipality) {

        // Combine the two JSON files
        municipality.properties.LIENS = result2[municipality.properties.OBJECTID].NUM;
        municipality.properties.LIENSTOTAL = result2[municipality.properties.OBJECTID].TOTAL;
        municipality.properties.LIENSAVG = result2[municipality.properties.OBJECTID].AVG;
      });

      // Add the data
      geojson = L.geoJson(result, {style: getStyle, onEachFeature: onEachFeature}).addTo(map);
    });
  });

  // Initialize the information
  info = L.control();
  info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
  };

  // Add the liens info on update
  info.update = function (props) {
  this._div.innerHTML = '<h4>2014 Allegheny County Municipal Tax Liens</h4>' +  (props ?
      '<b>' + props.NAME + '</b><br />' + props.LIENS + ' total liens'
      + '<br />' + props.LIENSTOTAL + ' total lien amount'
      + '<br />' + props.LIENSAVG + ' average lien amount'
      : 'Click a municipality');
  };

  // Add the info to the map
  info.addTo(map);

  // Add a legend
  legend = L.control({position: 'bottomright'});

  legend.onAdd = function (map) {

      var div = L.DomUtil.create('div', 'info legend'),
          grades = [0, 100, 200, 300, 400, 500, 1000, 5000],
          labels = [];

      // Title
      div.innerHTML += "<h5>Avg Liens ($)</h5>";

      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < grades.length; i++) {
          div.innerHTML +=
              '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
              '<p style="margin: 1px;">' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] : '+') + '</p>';
      }

      return div;
    };

  legend.addTo(map);
};

// Return color based on value
function getColor(val) {
  return val > 5000 ? '#800026' :
         val > 1000 ? '#BD0026' :
         val > 500  ? '#E31A1C' :
         val > 400  ? '#FC4E2A' :
         val > 300  ? '#FD8D3C' :
         val > 200  ? '#FEB24C' :
         val > 100  ? '#FED976' :
                      '#FFEDA0' ;
}

// Return the correct style for a tile
function getStyle(feature) {
  return {
        fillColor: getColor(feature.properties.LIENSAVG),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
  };
}

// Highlight a municipality
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

// Unhighlight a municipality
function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

// Zoom in to a municipality
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

// Events
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}
