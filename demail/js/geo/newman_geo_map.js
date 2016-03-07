


/**
 * geo_map related reference
 */
var newman_geo_map = (function () {
  var debug_enabled = true;
  var map;
  var map_tile_layer;
  var map_tile_layer_url;
  var map_tile_layer_attribute;

  var south_west_max = L.latLng(-90, -180);
  var north_east_max = L.latLng(90, 180);
  var world_bounds = L.latLngBounds(south_west_max, north_east_max);

  var area_draw_control_layer;
  var area_caching_button;

  var area_select_id_list = [];

  var marker_list = [];
  var marker_icon_map = {};

  function markMap(new_marker_list) {
    if (map) {
      if (new_marker_list && new_marker_list.length > 0) {
        if (debug_enabled) {
          //console.log('marker_list:\n' + JSON.stringify(new_marker_list, null, 2));
        }
        _.each(new_marker_list, function(item) {
          //console.log('marker:\n' + JSON.stringify(item, null, 2));
          var latitude = parseFloat(item.lat);
          var longitude = parseFloat(item.lng);
          var email_outbound = item.email_outbound;
          var email_inbound = item.email_inbound;
          var attach_outbound = item.attach_outbound;

          var marker_icon = marker_icon_map['fa-envelope-o'];

          if (attach_outbound > 0) {
            marker_icon = marker_icon_map['fa-paperclip'];
          }
          else if (email_outbound > email_inbound) {
            marker_icon = marker_icon_map['fa-paper-plane-o'];
          }
          else if (email_outbound < email_inbound) {
            marker_icon = marker_icon_map['fa-inbox'];
          }

          if (latitude && longitude) {
            if (!marker_icon) {
              console.warn('no marker_icon defined!');
            }
            L.marker([latitude, longitude], {icon: marker_icon})
              .bindPopup('<a href="' + item.url + '" target="_blank">' + item.name + '</a>')
              .addTo(map);
          }
        });
      }
    }
  }

  function initMarkerIcon() {

    marker_icon_map = {

      "fa-envelope-o" : L.AwesomeMarkers.icon({
        prefix: 'fa',
        markerColor: 'blue', //colors 'red', 'darkred', 'orange', 'green', 'darkgreen', 'purple', 'darkpuple', 'blue', 'darkblue', 'cadetblue'
        icon: 'envelope-o'
      }),
      "fa-inbox" : L.AwesomeMarkers.icon({
        prefix: 'fa',
        markerColor: 'blue', //colors 'red', 'darkred', 'orange', 'green', 'darkgreen', 'purple', 'darkpuple', 'blue', 'darkblue', 'cadetblue'
        icon: 'inbox'
      }),
      "fa-paper-plane-o" : L.AwesomeMarkers.icon({
        prefix: 'fa',
        markerColor: 'blue', //colors 'red', 'darkred', 'orange', 'green', 'darkgreen', 'purple', 'darkpuple', 'blue', 'darkblue', 'cadetblue'
        icon: 'paper-plane-o'
      }),
      "fa-paperclip" : L.AwesomeMarkers.icon({
        prefix: 'fa',
        markerColor: 'blue', //colors 'red', 'darkred', 'orange', 'green', 'darkgreen', 'purple', 'darkpuple', 'blue', 'darkblue', 'cadetblue'
        icon: 'paperclip'
      })

    };

  }

  function initCacheSeeding() {
    if (map && map_tile_layer) {

      if (area_draw_control_layer && area_select_id_list.length > 0) {
        var target_layer_id = area_select_id_list[area_select_id_list.length -1];
        var target_layer;
        area_draw_control_layer.eachLayer(function (layer) {
          if (layer._leaflet_id == target_layer_id) {
            console.log('layer: ' + target_layer_id + ' selected for caching');
            target_layer = layer;
          }
        });

        if (target_layer) {

          // Seed the map-tile layer, for a given rectangular area, for zoom levels 0 through 4.
          //var bounds = L.latLngBounds(L.latLng(5,-165), L.latLng(65,-50));

          var bounds = target_layer.getBounds(), current_zoom_level = map.getZoom(), target_zoom_level = 8;
          console.log('current_zoom_level: ' + current_zoom_level + ' target_zoom_level: ' + target_zoom_level);
          if (current_zoom_level > target_zoom_level) {
            target_zoom_level = current_zoom_level;
          }

          map_tile_layer.seed(bounds, 0, target_zoom_level);

          // Display seeding progress on console
          map_tile_layer.on('seedprogress', function (seedData) {
            var percent = 100 - Math.floor(seedData.remainingLength / seedData.queueLength * 100);
            console.log('Cache-seeding-map-tiles : ' + percent + '% done');
          });

          map_tile_layer.on('seedstart', function (seedData) {
            console.log('Cache-seeding-map-tiles (' + seedData.queueLength + ') : Starting...');
          });

          map_tile_layer.on('seedend', function (seedData) {
            console.log('Cache-seeding-map-tiles : Completed!');

            map.fire('caching:end', {"seedData": seedData});
          });

        }

      }


    }
  }

  function initCacheSeedingButton() {

    if (map) {
      if (area_caching_button) {
        map.removeLayer( area_caching_button );
      }

      /*
      area_caching_button = L.easyButton('fa-cloud-download', function() {
        initCacheSeeding();
      });
      */
      area_caching_button = L.easyButton({
        states: [
          {
            stateName: 'init-tile-caching',
            icon: 'fa-cloud-download',
            title: 'Initiate tile caching',
            onClick: function(control) {
              initCacheSeeding();
              control.state('tile-caching');
              control._map.on('caching:end', function(e){
                //console.log('control._map.on("caching:end")');

                control.state('init-tile-caching');
              });
            }
          },
          {
            stateName: 'tile-caching',
            icon: 'fa-spinner fa-spin',
            title: 'Tile caching...'
          }
        ]
      });

      area_caching_button.addTo( map );
      area_caching_button.disable();

    }

    /*
    var _readyState = function(e){
      if (map) {
        map.addControl(new initCacheSeedingControl());
      }
    }
    window.addEventListener('DOMContentLoaded', _readyState);
    */
  }

  function initMapControlDraw() {
    if (map) {
      if (area_draw_control_layer) {
        area_draw_control_layer.clearLayers();
        map.removeLayer( area_draw_control_layer );
      }

      area_draw_control_layer = new L.FeatureGroup();
      map.addLayer(area_draw_control_layer);

      var draw_control = new L.Control.Draw({
        draw: {
          position: 'topleft',
          rectangle: {
            shapeOptions: {
              color: "#69ACFF",
              opacity: 0.5,
              weight: 1
            }
          },
          polyline: false,
          polygon: false,
          circle: false,
          marker: false
        },
        edit: {
          featureGroup: area_draw_control_layer,
          edit: {
            selectedPathOptions: {
              opacity: 0.5,
              weight: 1,
              dashArray: 'none',
              maintainColor: true
            }
          },
          remove: {}
        }
      });
      map.addControl(draw_control);

      map.on('draw:created', function (e) {
        if (debug_enabled) {
          console.log('draw:created');
        }

        var type = e.layerType, layer = e.layer;

        if (type === 'marker') {
          layer.bindPopup('A popup!');
        }

        if (type === 'rectangle') {
          var bounds = layer.getBounds();
          var sw_lat = bounds.getSouthWest().lat, sw_lng = bounds.getSouthWest().lng;
          var ne_lat = bounds.getNorthEast().lat, ne_lng = bounds.getNorthEast().lng;
          console.log('rectangle-bounds: SW[' + sw_lat + ', ' + sw_lng +  '], NE[' + ne_lat + ', ' + ne_lng + ']');


          var id = L.Util.stamp(layer);
          area_select_id_list.push( id );
          console.log('area_select_id_list[' + id + ']');

          area_caching_button.enable();
        }

        area_draw_control_layer.addLayer(layer);

        if (debug_enabled) {
          area_draw_control_layer.eachLayer(function (layer) {
            console.log('layer._leaflet_id: ' + layer._leaflet_id);
          });
        }
      });

      map.on('draw:edited', function (e) {
        if (debug_enabled) {
          console.log('draw:edited');
        }

        var layers = e.layers;
        layers.eachLayer(function (layer) {
          var layer_id = layer._leaflet_id;

          _.each(area_select_id_list, function(element) {
            if (element == layer_id) {
              console.log('layer_id: ' + layer_id);

              var bounds = layer.getBounds();
              var sw_lat = bounds.getSouthWest().lat, sw_lng = bounds.getSouthWest().lng;
              var ne_lat = bounds.getNorthEast().lat, ne_lng = bounds.getNorthEast().lng;
              console.log('rectangle-bounds: SW[' + sw_lat + ', ' + sw_lng +  '], NE[' + ne_lat + ', ' + ne_lng + ']');

              area_caching_button.enable();
            }
          });

        });
      });

      map.on('draw:deleted', function (e) {
        if (debug_enabled) {
          console.log('draw:deleted');
        }

        var layers = e.layers;
        layers.eachLayer(function (layer) {
          var layer_id = layer._leaflet_id;
          console.log('layer: ' + layer_id + ' removed!');

          var target_index = -1;
          _.each(area_select_id_list, function(element, index) {
            if (element == layer_id) {
              target_index = index;
            }
          });
          if (target_index > -1) {
            area_select_id_list.splice(target_index, 1);
            console.log('area_select_id_list[' + target_index + ']!');

            if (area_select_id_list.length == 0) {
              area_caching_button.disable();
            }
            else {
              area_caching_button.enable();
            }
          }

        });

      });

      map.on('draw:drawstart', function (e) {
        if (debug_enabled) {
          console.log('draw:drawstart');
        }

      });

      map.on('draw:drawstop', function (e) {
        if (debug_enabled) {
          console.log('draw:drawstop');
        }

      });

      /*
      map.on('click', function (e) {

      });

      map.on('moveend', function (e) {
        console.log('map:moveend');
      });

      map.on('dragend', function (e) {
        console.log('map:dragend');

      });
      */

    }
  }



  function initMap(new_marker_list) {
    if (debug_enabled) {
      console.log('initMap()');
    }

    if (new_marker_list && new_marker_list.length > 0) {
      // initialize markers
    }
    else {

      if (marker_list.length == 0) {
        loadJSON('js/sample_markers.json', function (response) {
          // Parse JSON string into object
          var json_object = JSON.parse(response);
          marker_list = json_object;
          //plot markers
          markMap( marker_list );
        });
      }
    }

    if (_.size(marker_icon_map) == 0) {
      initMarkerIcon();
    }

    if (!map) {
      map = L.map(
        'map',
        {
          worldCopyJump: true,
          maxBounds: world_bounds
        }
      ).setView(new L.LatLng(38.9047, -77.0164), 4);

      map.on('zoomend', function (e) {
        console.log('map_zoom_level: ' + map.getZoom());
      });

      initMapControlDraw();
      initCacheSeedingButton();
    }


    // create the tile layer with attribution
    if (!map_tile_layer) {
      map_tile_layer_url = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      map_tile_layer_attribute = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

      map_tile_layer = new L.TileLayer(
        map_tile_layer_url,
        {
          minZoom: 2, // absolute-min : 0
          maxZoom: 18, // absolute-max : 18
          bounds: world_bounds,
          attribution: map_tile_layer_attribute,
          detectRetina: true,
          reuseTiles: true,
          continuousWorld: true, // if true, the coordinates won't be wrapped by world width (-180, 180) or clamped to lie within (-90 to 90).
          noWrap: false, // if true, the tiles won't load outside the world width (-180, 180) instead of repeating.
          useCache: true, // plug-in:  to enable caching of tiles
          cacheMaxAge: 2419200000 // plug-in: Time, in milliseconds, for any given tile to be considered 'fresh'
        }
      );

      // Listen to cache hits and misses
      // Note: The cache hits/misses are only from this layer, not from the WMS layer.
      map_tile_layer.on('tilecachehit', function (event) {
        if (debug_enabled) {
          console.log('Cache hit: ', event.url);
        }
      });
      map_tile_layer.on('tilecachemiss', function (event) {
        if (debug_enabled) {
          console.log('Cache miss: ', event.url);
        }
      });

      map.addLayer(map_tile_layer);
      //map.fitBounds(bounds);

    }


/*
    // control that shows state info on hover
    var info = L.control();

    info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info');
      this.update();
      return this._div;
    };

    info.update = function (props) {
      this._div.innerHTML = '<h4>US Population Density</h4>' +  (props ?
        '<b>' + props.name + '</b><br />' + props.density + ' people / mi<sup>2</sup>'
          : 'Hover over a state');
    };

    info.addTo(map);


    // get color depending on population density value
    function getColor(d) {
      return d > 1000 ? '#800026' :
        d > 500  ? '#BD0026' :
          d > 200  ? '#E31A1C' :
            d > 100  ? '#FC4E2A' :
              d > 50   ? '#FD8D3C' :
                d > 20   ? '#FEB24C' :
                  d > 10   ? '#FED976' :
                    '#FFEDA0';
    }

    function style(feature) {
      return {
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7,
        fillColor: getColor(feature.properties.density)
      };
    }

    function highlightFeature(e) {
      var layer = e.target;

      layer.setStyle({
        weight: 2,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
      });

      if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
      }

      info.update(layer.feature.properties);
    }

    var geojson;

    function resetHighlight(e) {
      geojson.resetStyle(e.target);
      info.update();
    }

    function zoomToFeature(e) {
      map.fitBounds(e.target.getBounds());
    }

    function onEachFeature(feature, layer) {
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
      });
    }

    geojson = L.geoJson(statesData, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(map);

    map.attributionControl.addAttribution('Population data &copy; <a href="http://census.gov/">US Census Bureau</a>');


    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

      var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 10, 20, 50, 100, 200, 500, 1000],
        labels = [],
        from, to;

      for (var i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(
          '<i style="background:' + getColor(from + 1) + '"></i> ' +
          from + (to ? '&ndash;' + to : '+'));
      }

      div.innerHTML = labels.join('<br>');
      return div;
    };

    legend.addTo(map);
*/


  }


  function loadJSON(file_path, callback) {

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', file_path, true);
    xobj.onreadystatechange = function () {
      if (xobj.readyState == 4 && xobj.status == "200") {
        // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
        callback(xobj.responseText);
      }
    };
    xobj.send(null);
  }

  return {
    'initMap' : initMap,
    'initCacheSeeding' : initCacheSeeding
  }

}());


