


/**
 * geo_map related reference
 */
var app_geo_map = (function () {
  var debug_enabled = false;

  var is_preview_modal_locked = false;
  var preview_modal_id = '#doc_preview_modal_left';
  var preview_modal_label_id = '#doc_preview_modal_left_label';
  var preview_modal_body_id = '#doc_preview_modal_left_body';

  var _is_initialized = false;

  var default_view_center = new L.LatLng(31.7964452, 35.1051469), default_view_zoom = 2;
  var min_zoom = 2, max_zoom = 16;

  var map;
  var map_tile_layer;
  var map_tile_layer_url;
  var map_tile_layer_attribute;
  var map_tile_exported = false, map_tile_imported = false;

  var south_west_max = L.latLng(-90, -180);
  var north_east_max = L.latLng(90, 180);
  var world_bounds = L.latLngBounds(south_west_max, north_east_max);

  var area_draw_control_layer;
  var map_tile_cache_toggle_button, map_tile_cache_import_button, map_tile_cache_export_button;

  var area_drawn_id_list = [];

  function containsAreaDrawn() {
    if (area_drawn_id_list && area_drawn_id_list.length > 0) {
      return true;
    }
    return false;
  }

  function clearAllAreaDrawn() {
    if (area_draw_control_layer) {
      area_draw_control_layer.clearLayers();
    }
    if (area_drawn_id_list) {
      area_drawn_id_list.length = 0;
    }
  }

  var marker_list = [];
  var marker_icon_map = {};
  var marker_init_sender_button, marker_init_attach_button;
  var map_marker_layer_all_sender, map_marker_layer_all_attach;




  function markMap(new_marker_list) {
    if (map) {
      if (new_marker_list && new_marker_list.length > 0) {
        if (debug_enabled) {
          //console.log('marker_list:\n' + JSON.stringify(new_marker_list, null, 2));
        }

        var sender_coord_marker_map = {}, attach_coord_marker_map = {};

        _.each(new_marker_list, function(item) {
          //console.log('marker:\n' + JSON.stringify(item, null, 2));

          var latitude = parseFloat( item.latitude ).toFixed(3); //adjust decimal places to cluster
          var longitude = parseFloat( item.longitude ).toFixed(3); //adjust decimal places to cluster

          if (latitude && longitude) {
            var coord_key = latitude + ',' + longitude, coord_content_list = [];

            if (item.coord_sent === true) {

              if (coord_key in sender_coord_marker_map) {
                coord_content_list = sender_coord_marker_map[coord_key];
              }
              coord_content_list.push(clone(item));
              sender_coord_marker_map[coord_key] = coord_content_list;
            }
            else if (item.coord_origin === true) {

              if (coord_key in attach_coord_marker_map) {
                coord_content_list = attach_coord_marker_map[coord_key];
              }
              coord_content_list.push(clone(item));
              attach_coord_marker_map[coord_key] = coord_content_list;
            }
          }
        });

        if (_.size(sender_coord_marker_map) > 0) {
          markAllSender(sender_coord_marker_map);
        }

        if (_.size(attach_coord_marker_map) > 0) {
          markAllAttachment(attach_coord_marker_map);
        }

      }
    }
  }

  function clearAllSender() {
    if (map_marker_layer_all_sender) {
      map_marker_layer_all_sender.clearLayers();
    }
  }

  function markAllSender(coord_marker_map) {

    if (map && coord_marker_map) {
      if (map_marker_layer_all_sender) {
        map_marker_layer_all_sender.clearLayers();
      }
      else {
        map_marker_layer_all_sender = new L.FeatureGroup();
      }

      _.each(coord_marker_map, function(marker_content_list, key) {
        //console.log('marker_content_list:\n' + JSON.stringify(marker_content_list, null, 2));
        var key_array = key.split(',');
        var latitude = parseFloat(key_array[0]).toFixed(5);
        var longitude = parseFloat(key_array[1]).toFixed(5);

        var marker_icon = marker_icon_map['fa-paper-plane-o'];
        //marker_icon = marker_icon_map['fa-paperclip'];
        //marker_icon = marker_icon_map['fa-envelope-o'];

        if (marker_content_list.length > 1) {
          marker_icon = newTextMarker( marker_content_list.length, 'blue' );
        }

        // Create popup container to all text and markup
        var popup_container = $('<div class="row-column-popup-content-container" style="width: 400px;" />');

        _.each(marker_content_list, function(marker_content, index) {
          //console.log('marker_content:\n' + JSON.stringify(marker_content, null, 2));

          var row = $('<div class="row" style="margin: 0; padding: 0;" />');
          var column_0 = $('<div class="col-xs-4" style="margin: 0; padding: 0; line-height: 26px; color: #0080AB;" />');
          var column_1 = $('<div class="col-xs-8" style="margin: 0; padding: 0; line-height: 22px;" />');
          row.append( column_0 );
          row.append( column_1 );

          var doc_id = marker_content.email_id;
          var marker_doc_id = 'marker-doc-' + doc_id;
          var datetime = marker_content.email_datetime;
          var subject = marker_content.email_subject;
          //var latitude = parseFloat(marker_content.email_lat);
          //var longitude = parseFloat(marker_content.email_lon);

          if (subject) {
            subject = subject.trim();
            if (subject) {
              subject = truncateString( subject, app_display_config.getTitleLengthMax() );
            }
            else {
              subject = '\<' + doc_id + '\>';
            }
          }
          else {
            subject = '\<' + doc_id + '\>';
          }

          if (datetime) {
            //datetime = datetime.substring(0, 10);
            datetime = datetime.replace('T', '  ');
          }
          else {
            datetime = '';
          }

          column_0.html( datetime );

          var button = $('<button />', {
            style: 'text-align: left; font-size: 95%',
            width: '100%',
            type: 'button',
            class: 'btn btn-small outline',
            html:  subject,
            value: marker_doc_id,
            id: marker_doc_id,
            on: {
              click: function () {
                if (debug_enabled) {
                  console.log('selected marker-doc-id : ' + doc_id + ', [' + latitude + ', ' + longitude + ']');
                }
                newman_email_doc_table.showEmailDocumentView( doc_id );

                clearAllAttachment();
                var geo_attach_obj = newman_geo_email_attach.getAttachDocGeoLocByEmail( doc_id );
                if (geo_attach_obj) {
                  if (debug_enabled) {
                    console.log('geo_attach_obj : ' + doc_id + '\n' + JSON.stringify(geo_attach_obj, null, 2));
                  }
                  var marker_map = [geo_attach_obj];
                  markMap( marker_map );
                }
              }
            }
          });

          column_1.append( button )

          popup_container.append( row );

        });

        //popup_container.html('<button type="button" class="btn btn-small outline" ">' + subject + '</button>');
        // Delegate all event handling for the popup container itself
        /*
         popup_container.on('click', function() {
         var doc_id = marker_content.doc_id;
         if (debug_enabled) {
         console.log('selected marker-doc-id : ' + doc_id);
         }
         newman_email_doc_table.showEmailDocumentView( doc_id );
         });
         */

        // specify customized popup options
        var popup_options = {
          'className' : 'row-column-popup-tip row-column-popup-content-wrapper row-column-popup-content'
        }

        L.marker([latitude, longitude], {icon: marker_icon})
          .bindPopup(popup_container[0], popup_options)
          .addTo(map_marker_layer_all_sender);

      });

      map.addLayer( map_marker_layer_all_sender );
    }
  }

  function clearAllAttachment() {
    if (map_marker_layer_all_attach) {
      map_marker_layer_all_attach.clearLayers();
    }
  }

  function markAllAttachment(coord_marker_map) {

    if (map && coord_marker_map) {
      if (map_marker_layer_all_attach) {
        map_marker_layer_all_attach.clearLayers();
      }
      else {
        map_marker_layer_all_attach = new L.FeatureGroup();
      }

      _.each(coord_marker_map, function(marker_content_list, key) {
        //console.log('marker_content_list:\n' + JSON.stringify(marker_content_list, null, 2));
        var key_array = key.split(',');
        var latitude = parseFloat(key_array[0]).toFixed(5);
        var adjusted_latitude = applyGeoOffset(latitude).toFixed(5);
        var longitude = parseFloat(key_array[1]).toFixed(5);
        var adjusted_longitude = applyGeoOffset(longitude).toFixed(5);

        var marker_icon = marker_icon_map['fa-paperclip'];
        if (marker_content_list.length > 1) {
          marker_icon = newTextMarker( marker_content_list.length, 'green' );
        }

        // Create popup container to all text and markup
        var popup_container = $('<div class="row-column-popup-content-container" style="width: 430px;" />');

        _.each(marker_content_list, function(marker_content, index) {
          //console.log('marker_content:\n' + JSON.stringify(marker_content, null, 2));

          var row = $('<div class="row" style="margin: 0; padding: 0;" />');
          var column_0 = $('<div class="col-xs-4" style="margin: 0; padding: 0; line-height: 26px; color: #0080AB;" />');
          var column_1 = $('<div class="col-xs-6" style="margin: 0; padding: 0; line-height: 22px;" />');
          var column_2 = $('<div class="col-xs-2" style="margin: 0; padding: 0; line-height: 26px; text-align: right;" />');
          row.append( column_0 );
          row.append( column_1 );
          row.append( column_2 );


          var doc_id = marker_content.email_id;
          var file_uid = marker_content.attach_id;
          var marker_doc_id = 'marker-doc-' + doc_id;
          var datetime = marker_content.email_datetime;
          var subject = marker_content.email_subject;

          var file_name = marker_content.attach_file;
          var content_type;
          var file_metadata = newman_geo_email_attach.getAttachDocMetadata( file_uid );
          if (file_metadata) {
            content_type = file_metadata.content_type;
          }

          var doc_type = getDocumentType( file_name, content_type );
          var image_icon = newman_email_attach_table.getImageHTML( file_uid, doc_type );



          if (subject) {
            subject = subject.trim();
            if (subject) {
              subject = truncateString( subject, app_display_config.getTitleLengthMax() );
            }
            else {
              subject = '\<' + doc_id + '\>';
            }
          }
          else {
            subject = '\<' + doc_id + '\>';
          }

          if (datetime) {
            //datetime = datetime.substring(0, 10);
            datetime = datetime.replace('T', '  ');
          }
          else {
            datetime = '';
          }
          column_0.html( datetime );
          column_0.on('mouseover', function (event) {
            // Ignore this event if preventDefault has been called.
            if (event.defaultPrevented) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            event.stopPropagation();

            onPreviewFile( false );

            /*
            var attr_id = $(this).attr('id');
            var attr_value = $(this).attr('value');
            if (attr_id && attr_value) {
              //console.log('id : "' + attr_id + '" value : "' + attr_value + '" clicked-expand-image!');

              var file_uid = attr_value;


            }
            */

          });


          var email_view_button_html = $('<button />', {
            style: 'text-align: left; font-size: 95%; min-height: 26px;',
            width: '100%',
            type: 'button',
            class: 'btn btn-small outline',
            html:  subject,
            value: marker_doc_id,
            id: marker_doc_id,
            on: {
              click: function () {
                if (debug_enabled) {
                  console.log('selected marker-doc-id : ' + doc_id + ', [' + latitude + ', ' + longitude + ']');
                  //console.log('adjusted coordinate [' + adjusted_latitude + ', ' + adjusted_longitude + ']');
                }
                newman_email_doc_table.showEmailDocumentView( doc_id );

                clearAllSender();
                var geo_email_obj = newman_geo_email_attach.getEmailDocGeoLoc( doc_id );
                if (geo_email_obj) {
                  if (debug_enabled) {
                    console.log('geo_email_obj : ' + doc_id + '\n' + JSON.stringify(geo_email_obj, null, 2));
                  }
                  var marker_map = [geo_email_obj];
                  markMap( marker_map );
                }
              },
              mouseover: function (e) {
                if (event.defaultPrevented) return;
                event.preventDefault();
                event.stopImmediatePropagation();
                event.stopPropagation();

                onPreviewFile( false );
              }
            }
          });
          column_1.append( email_view_button_html );


          if (doc_type == 'image') {

            var doc_view_button_html = $('<button />', {
              style: 'text-align: left;',
              type: 'button',
              class: 'btn btn-small outline',
              html: image_icon,
              value: file_uid,
              id: 'attach_image_expand_button_' + file_uid,
              on: {
                click: function (e) {
                  if (debug_enabled) {
                    console.log('clicked file-uid : ' + file_uid );
                  }

                  is_preview_modal_locked = true;
                  onPreviewFile( true, file_uid );
                  console.log('modal "' + preview_modal_id + '" opened, locked ' + is_preview_modal_locked);

                },
                mouseover: function (e) {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                  e.stopPropagation();

                  if (debug_enabled) {
                    console.log('mouse-over file-uid : ' + file_uid );
                  }

                  onPreviewFile( true, file_uid );
                }, /*
                mouseleave: function (e) {
                  e.preventDefault();
                  e.stopImmediatePropagation();
                  e.stopPropagation();

                  onPreviewFile( false );
                }*/
              }
            });


            column_2.append( doc_view_button_html );
          }
          else {


            var attach_image_url = 'email/attachment/' + encodeURIComponent( file_uid );
            attach_image_url = newman_data_source.appendDataSource( attach_image_url );

            var image_url_anchor = $('<a />').attr(
              { "target" : "_blank",
                "href" : attach_image_url,
                'data-toggle' : 'tooltip',
                'rel' : 'tooltip',
                'data-placement' : 'left',
                'data-original-title' : file_name,
                'title' : file_name
              }
            );
            image_url_anchor.append( image_icon );

            column_2.append( image_url_anchor );
          }

          popup_container.append( row );

        });

        // specify customized popup options
        var popup_options = {
          'className' : 'row-column-popup-tip row-column-popup-content-wrapper row-column-popup-content'
        }

        L.marker([latitude, longitude], {icon: marker_icon})
          .bindPopup(popup_container[0], popup_options)
          .addTo(map_marker_layer_all_attach);

      });

      map.addLayer( map_marker_layer_all_attach );
    }
  } // end-of markAllAttachment(...)

  function onPreviewFile( is_shown, file_uid ) {
    if (debug_enabled) {
      console.log('onPreviewFile( ' + is_shown + ', ' + file_uid + ' )');
    }

    if (is_shown === true) {
      if (file_uid) {

        var file_metadata = newman_geo_email_attach.getAttachDocMetadata(file_uid);
        if (file_metadata) {

          var file_name = file_metadata.filename;
          var content_type = file_metadata.content_type;

          var doc_type = getDocumentType(file_name, content_type);
          var image_icon = newman_email_attach_table.getImageHTML(
            file_uid,
            doc_type,
            newman_email_attach_table.getImageMaxWidth(),
            newman_email_attach_table.getImageMaxHeight()
          );

          var attach_url = 'email/attachment/' + encodeURIComponent(file_uid);
          attach_url = newman_data_source.appendDataSource(attach_url);

          var modal_label = $(preview_modal_label_id);
          var modal_body = $(preview_modal_body_id);

          modal_label.empty();
          modal_body.empty();

          var label_anchor =
            $('<a>',
              {
                'target': '_blank',
                'href': attach_url
              }
            ).html(file_name);

          modal_label.html(label_anchor);
          modal_body.append(image_icon);

          var modal_options = {
            "backdrop": false,
            "keyboard": true,
          };

          $(preview_modal_id).modal(modal_options);

          $('.modal-backdrop').appendTo('.modal-container');

        }
        else {
          console.warn("Expected document metadata not found '" + file_uid + "' !")
        }
      } // end-of if (file_uid)

    }
    else {

      if (!is_preview_modal_locked) {
        if (($(preview_modal_id).data('bs.modal') || {}).isShown) {
          $(preview_modal_id).modal('hide');
        }
      }
    }
  } // end-of onPreviewFile(...)

  function newTextMarker(text, color) {

    var icon = L.AwesomeMarkers.icon({
      text: text,
      /*textFormat: 'letter',*/
      markerColor: color //colors: 'red', 'darkred', 'orange', 'green', 'darkgreen', 'purple', 'darkpuple', 'blue', 'darkblue', 'cadetblue'
    });

    return icon;
  }

  function initMarkerIcon() {

    marker_icon_map = {

      "fa-envelope-o" : L.AwesomeMarkers.icon({
        prefix: 'fa',
        markerColor: 'blue', //colors: 'red', 'darkred', 'orange', 'green', 'darkgreen', 'purple', 'darkpuple', 'blue', 'darkblue', 'cadetblue'
        icon: 'envelope-o'
      }),
      "fa-user" : L.AwesomeMarkers.icon({
        prefix: 'fa',
        markerColor: 'blue', //colors: 'red', 'darkred', 'orange', 'green', 'darkgreen', 'purple', 'darkpuple', 'blue', 'darkblue', 'cadetblue'
        icon: 'inbox'
      }),
      "fa-paper-plane-o" : L.AwesomeMarkers.icon({
        prefix: 'fa',
        markerColor: 'blue', //colors: 'red', 'darkred', 'orange', 'green', 'darkgreen', 'purple', 'darkpuple', 'blue', 'darkblue', 'cadetblue'
        icon: 'paper-plane-o'
      }),
      "fa-paperclip" : L.AwesomeMarkers.icon({
        prefix: 'fa',
        markerColor: 'green', //colors: 'red', 'darkred', 'orange', 'green', 'darkgreen', 'purple', 'darkpuple', 'blue', 'darkblue', 'cadetblue'
        icon: 'paperclip'
      })

    };

  }

  function getAllMarker() {

    if (map) {
      var marker_obj_array = [];
      var marker_geo_json_array = [];

      _.each(map._layers, function(layer) {

        if (map._layers[layer].feature) {

          marker_obj_array.push( this );
          marker_geo_json_array.push( JSON.stringify( this.toGeoJSON() ));
        }

      });

      if (debug_enabled) {
        console.log('marker_geo_json_array['+marker_geo_json_array.length+']\n' + JSON.stringify(marker_geo_json_array));
      }
    }
  }

  function initCacheSeeding(new_zoom_level, world_map_enabled) {
    if (map && map_tile_layer) {

      if (area_draw_control_layer && area_drawn_id_list.length > 0) {
        var target_layer_id = area_drawn_id_list[area_drawn_id_list.length -1];
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

          var bounds = target_layer.getBounds(), current_zoom_level = map.getZoom(), target_zoom_level = 9;
          if (new_zoom_level && new_zoom_level >= min_zoom && new_zoom_level <= max_zoom ) {
            target_zoom_level = new_zoom_level;
          }
          if (current_zoom_level > target_zoom_level) {
            target_zoom_level = current_zoom_level;
          }
          console.log('current_zoom_level: ' + current_zoom_level + ' target_zoom_level: ' + target_zoom_level);

          if (world_map_enabled === true) {
            bounds = world_bounds;
          }

          map_tile_layer.seed(bounds, 0, target_zoom_level);


          // Display seeding progress on console
          map_tile_layer.on('seed:progress', function (seedData) {
            var percent = 100 - Math.floor(seedData.remainingLength / seedData.queueLength * 100);
            console.log('Cache-seeding-map-tiles : ' + percent + '% done');
          });
          map_tile_layer.on('seed:start', function (seedData) {
            console.log('Cache-seeding-map-tiles (' + seedData.queueLength + ') : Starting...');
          });
          map_tile_layer.on('seed:end', function (seedData) {
            console.log('Cache-seeding-map-tiles : Completed!');

            map.fire('caching:end', {"seedData": seedData});
          });

        }

      }


    }
  }

  function initMap() {
    if (!map) {
      map = L.map(
        'map',
        {
          worldCopyJump: true
        }
      ).setView(default_view_center, default_view_zoom);

      map.on('zoomend', function (e) {
        console.log('map_zoom_level: ' + map.getZoom());
      });

      map.on('contains:area_selected', function (e) {
        if (debug_enabled) {
          console.log('contains:area_selected');
        }
        setTileCloudDownloadEnabled( true );
      });

      map.on('contains:no_area_selected', function (e) {
        if (debug_enabled) {
          console.log('contains:no_area_selected');
        }
        setTileCloudDownloadEnabled( false );
      });

      // close any modal still open when mouse outside of any popup container
      $("#map").on('mouseleave', '.leaflet-popup', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();

        onPreviewFile( false );
      });

    }

  }

  function initMapTileLayer() {

    // create the tile layer with attribution
    if (!map_tile_layer) {

      map_tile_layer_url = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      map_tile_layer_attribute = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

      map_tile_layer = new L.TileLayer(
        map_tile_layer_url,
        {
          minZoom: 2, // absolute-min : 0
          maxZoom: 17, // absolute-max : 17
          bounds: world_bounds,
          attribution: map_tile_layer_attribute,
          detectRetina: true,
          reuseTiles: true,
          continuousWorld: false, // if true, the coordinates won't be wrapped by world width (-180, 180) or clamped to lie within (-90 to 90).
          noWrap: false, // if true, the tiles won't load outside the world width (-180, 180) instead of repeating.
          useCache: true, // plug-in:  to enable caching of tiles
          useOnlyCache: app_geo_config.enableOnlyTileCache()
        }
      );

      // Listen to cache hits and misses
      // Note: The cache hits/misses are only from this layer, not from the WMS layer.
      map_tile_layer.on('tile_cache:hit', function (event) {
        if (debug_enabled) {
          //console.log('Cache hit: ', event.url);
        }
      });

      map_tile_layer.on('tile_cache:miss', function (event) {
        if (debug_enabled) {
          console.log('Cache miss: ', event.url);
        }
      });

    }

    if (map) {
      map.addLayer(map_tile_layer);
    }

  }

  function initMapTileButtonGroup() {

    if (app_geo_config.enableAdvanceMode()) {
      // enable caching/replicating tiles only in debug mode

      if (map) {

        var button_group = [];

        if (!map_tile_cache_toggle_button) {

          if (!app_geo_config.enableOnlyTileCache()) {

            map_tile_cache_toggle_button = L.easyButton({
              states: [
                {
                  stateName: 'init-tile-caching',
                  icon: 'fa-cloud-download',
                  title: 'Initiate caching map tiles',
                  onClick: function (control) {

                    setTileImportEnabled(false);
                    setTileExportEnabled(false);
                    control.state('tile-caching');

                    initCacheSeeding(map.getZoom() + 4);

                    control._map.on('caching:end', function (e) {
                      //console.log('control._map.on("caching:end")');
                      setTileImportEnabled(true);
                      setTileExportEnabled(true);
                      control.state('init-tile-caching');
                    });
                  }
                },
                {
                  stateName: 'tile-caching',
                  icon: 'fa-spinner fa-spin',
                  title: 'Caching tiles...',
                  onClick: function (control) {
                    cancelTileCaching();
                    control.state('init-tile-caching');
                  }
                }
              ]
            });

            map_tile_cache_toggle_button.disable();
          }

        } // end-of if (!map_tile_cache_toggle_button)

        if (map_tile_cache_toggle_button) {
          button_group.push(map_tile_cache_toggle_button);
        }

        if (!map_tile_cache_import_button) {

          map_tile_cache_import_button = L.easyButton({
            states: [
              {
                stateName: 'init-tile-caching',
                icon: 'fa-download',
                title: 'Initiate downloading map tiles',
                onClick: function (control) {

                  setTileCloudDownloadEnabled(false);
                  setTileExportEnabled(false);
                  control.state('tile-caching');

                  map_tile_layer.downloadTileCache(map);

                  control._map.on('download:complete', function (e) {
                    //console.log('control._map.on("download:complete")');
                    setTileCloudDownloadEnabled(true);
                    setTileExportEnabled(true);
                    control.state('init-tile-caching');
                  });

                  control._map.on('download:error', function (e) {
                    //console.log('control._map.on("download:error")');
                    setTileCloudDownloadEnabled(true);
                    setTileExportEnabled(true);
                    control.state('init-tile-caching');
                  });
                }
              },
              {
                stateName: 'tile-caching',
                icon: 'fa-spinner fa-spin',
                title: 'Downloading tiles...',
                onClick: function (control) {
                  cancelAllDownload();
                  control.state('init-tile-caching');
                }
              }
            ]
          });

          map_tile_cache_import_button.enable();

        } // end-of if (!map_tile_cache_import_button)

        if (map_tile_cache_import_button) {
          button_group.push(map_tile_cache_import_button);
        }

        if (!map_tile_cache_export_button) {

          map_tile_cache_export_button = L.easyButton({
            states: [
              {
                stateName: 'init-tile-upload',
                icon: 'fa-upload',
                title: 'Initiate uploading map tiles',
                onClick: function (control) {

                  setTileCloudDownloadEnabled(false);
                  setTileImportEnabled(false);
                  control.state('tile-upload');

                  map_tile_layer.uploadTileCache(map);

                  control._map.on('upload:complete', function (e) {
                    //console.log('control._map.on("upload:complete")');
                    setTileCloudDownloadEnabled(true);
                    setTileImportEnabled(true);
                    control.state('init-tile-upload');
                  });

                  control._map.on('upload:error', function (e) {
                    //console.log('control._map.on("upload:error")');
                    setTileCloudDownloadEnabled(true);
                    setTileImportEnabled(true);
                    control.state('init-tile-upload');
                  });
                }
              },
              {
                stateName: 'tile-upload',
                icon: 'fa-spinner fa-spin',
                title: 'Uploading tiles...',
                onClick: function (control) {
                  cancelAllUpload();
                  control.state('init-tile-upload');
                }
              }
            ]
          });

          //map_tile_cache_export_button.disable();
          map_tile_cache_export_button.enable();

        } // end-of if (!map_tile_cache_export_button)

        if (map_tile_cache_export_button) {
          button_group.push(map_tile_cache_export_button);
        }

        if (button_group.length > 0) {

          // build a toolbar with the buttons
          L.easyBar(
            button_group,
            { position: 'bottomleft'}
          ).addTo(map);
        }

      } // end of if (map)
    } // end of if (app_geo_config.enableAdvanceMode())

  }

  function cancelTileCaching() {
    if (map_tile_layer) {
      map_tile_layer.cancelSeedTileCache()
    }
  }

  function cancelAllUpload() {
    if (map_tile_layer) {
      map_tile_layer.cancelUploadTileCache();
    }
  }

  function cancelAllDownload() {
    if (map_tile_layer) {
      map_tile_layer.cancelDownloadTileCache();
    }

  }

  function setTileCloudDownloadEnabled( enabled ) {
    if (!app_geo_config.enableOnlyTileCache()) {
      if (enabled === true && containsAreaDrawn()) {
        setTileCacheToggleEnabled( true );
      }
      else {
        setTileCacheToggleEnabled( false );
      }
    }
  }

  function setTileCacheToggleEnabled( enabled ) {
    if (map_tile_cache_toggle_button) {
      if (enabled === true) {
        map_tile_cache_toggle_button.enable();
      }
      else {
        map_tile_cache_toggle_button.disable();
      }
    }
  }

  function setTileImportEnabled( enabled ) {
    if (map_tile_cache_import_button) {
      if (enabled === true) {
        map_tile_cache_import_button.enable();
      }
      else {
        map_tile_cache_import_button.disable();
      }
    }
  }

  function setTileExportEnabled( enabled ) {
    if (map_tile_cache_export_button) {
      if (enabled === true) {
        map_tile_cache_export_button.enable();
      }
      else {
        map_tile_cache_export_button.disable();
      }
    }
  }

  function initCacheSeedingButton() {

    if (map) {
      if (!map_tile_cache_import_button) {

        /*
         area_caching_button = L.easyButton('fa-cloud-download', function() {
         initCacheSeeding();
         });
         */
        map_tile_cache_import_button = L.easyButton({
          states: [
            {
              stateName: 'init-tile-caching',
              icon: 'fa-cloud-download',
              title: 'Initiate tile caching',
              onClick: function (control) {
                initCacheSeeding(map.getZoom() + 4);
                control.state('tile-caching');
                control._map.on('caching:end', function (e) {
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

        map_tile_cache_import_button.disable();
        map_tile_cache_import_button.addTo(map);
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
  }

  function isMarkedForAllSender() {

    if (map && map_marker_layer_all_sender && map.hasLayer(map_marker_layer_all_sender)) {
      return true;
    }
    return false;
  }

  function unmarkAllSender() {
    if (map && map_marker_layer_all_sender && map.hasLayer(map_marker_layer_all_sender)) {
      map.removeLayer(map_marker_layer_all_sender);
    }
  }

  function isMarkedForAllAttachment() {

    if (map && map_marker_layer_all_attach && map.hasLayer(map_marker_layer_all_attach)) {
      return true;
    }
    return false;
  }

  function unmarkAllAttachment() {
    if (map && map_marker_layer_all_attach && map.hasLayer(map_marker_layer_all_attach)) {
      map.removeLayer(map_marker_layer_all_attach);
    }
  }

  /* deprecated
  function initAllEmailSenderButton() {

    if (map) {
      if (!marker_init_sender_button) {

        marker_init_sender_button = L.easyButton('fa-paper-plane-o', function () {

          if (isMarkedForAllSender()) {
            map.removeLayer(map_marker_layer_all_sender)
          }
          else {
            markMap(newman_geo_email_sender.getAllEmailDocGeoLoc());
          }

        });

        marker_init_sender_button.addTo(map);
      }
    }

  }

  function initAllEmailAttachButton() {

    if (map) {
      if (!marker_init_attach_button) {

        marker_init_attach_button = L.easyButton('fa-paperclip', function () {

          if (isMarkedForAllAttachment()) {
            map.removeLayer(map_marker_layer_all_sender)
          }
          else {
            markMap(newman_geo_email_attach.getAllAttachDocGeoLoc());
          }

        });

        marker_init_attach_button.addTo(map);
      }
    }

  }
  */

  function initMapMarkerButtonGroup() {

      if (map) {

        if (!marker_init_sender_button) {

          marker_init_sender_button = L.easyButton({
            states: [
              {
                stateName: 'mark-all-originating-coordinates',
                icon: 'fa-paper-plane-o',
                title: 'Mark all originating coordinates',
                onClick: function (control) {

                  if (isMarkedForAllSender()) {
                    unmarkAllSender();
                  }
                  else {
                    markMap(newman_geo_email_sender.getAllEmailDocGeoLoc());
                  }
                }
              }
            ]
          });

          marker_init_sender_button.enable();
        }

        if (!marker_init_attach_button) {

          marker_init_attach_button = L.easyButton({
            states: [
              {
                stateName: 'mark-all-attachment-coordinates',
                icon: 'fa-paperclip',
                title: 'Mark all attachment coordinates',
                onClick: function (control) {

                  if (isMarkedForAllAttachment()) {
                    unmarkAllAttachment();
                  }
                  else {

                    markMap(newman_geo_email_attach.getAllAttachDocGeoLoc());
                  }
                }
              }
            ]
          });

          marker_init_attach_button.enable();
        }


        var button_group = [
          marker_init_sender_button,
          marker_init_attach_button
        ];
        // build a toolbar with them
        L.easyBar( button_group, { position: 'topleft'} ).addTo(map);

      } // end of if (map)

  }


  function initMapControlDraw() {
    if (map) {
      if (!area_draw_control_layer) {

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
            /*polyline: {
             shapeOptions: {
             color: "#69ACFF",
             opacity: 0.8,
             weight: 2
             }
             },*/
            polygon: false,
            /* polygon: {
             shapeOptions: {
             color: "#69ACFF",
             opacity: 0.5,
             weight: 1
             }
             },*/
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
            console.log('rectangle-bounds: SW[' + sw_lat + ', ' + sw_lng + '], NE[' + ne_lat + ', ' + ne_lng + ']');


            var id = L.Util.stamp(layer);
            area_drawn_id_list.push(id);
            console.log('area_select_id_list[' + id + ']');

            fireEvent('contains:area_selected', {'area_select_id' : id});
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

            _.each(area_drawn_id_list, function (element) {
              if (element == layer_id) {
                console.log('layer_id: ' + layer_id);

                var bounds = layer.getBounds();
                var sw_lat = bounds.getSouthWest().lat, sw_lng = bounds.getSouthWest().lng;
                var ne_lat = bounds.getNorthEast().lat, ne_lng = bounds.getNorthEast().lng;
                console.log('rectangle-bounds: SW[' + sw_lat + ', ' + sw_lng + '], NE[' + ne_lat + ', ' + ne_lng + ']');

                fireEvent('contains:area_selected', {'area_select_id' : layer_id});
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
            _.each(area_drawn_id_list, function (element, index) {
              if (element == layer_id) {
                target_index = index;
              }
            });
            if (target_index > -1) {
              area_drawn_id_list.splice(target_index, 1);
              console.log('area_select_id_list[' + target_index + ']!');

              if (area_drawn_id_list.length == 0) {
                fireEvent('contains:no_area_selected', {'area_select_id_removed' : layer_id});
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
  }


  function init( is_visible ) {
    if (debug_enabled) {
      console.log('initMap()');
    }

    newman_geo_email_sender.initEmailDocGeoLoc();
    newman_geo_email_attach.initAttachDocGeoLoc();

    // dynamically set CSS when opening modal
    /*
    $(preview_modal_id).on('show.bs.modal', function(e) {
      var modal = $(this);
      modal.css('width', 'auto');
      return this;
    });
    */

    // reset flag after closing modal
    $(preview_modal_id).on("hidden.bs.modal", function () {
      is_preview_modal_locked = false;
      if (debug_enabled) {
        console.log('modal "' + preview_modal_id + '" closed, locked ' + is_preview_modal_locked);
      }
    });

    if (is_visible === true) {
       _is_initialized = true;
    }
    else if (!_is_initialized) {
      if (debug_enabled) {
        console.log('map not visible!');
      }
      return;
    }

    if (_.size(marker_icon_map) == 0) {
      initMarkerIcon();
    }

    if (!map) {

      initMap();
      initMapTileLayer();
    }

/*
    // create the tile layer with attribution
    if (!map_tile_layer) {
      map_tile_layer_url = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      map_tile_layer_attribute = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

      map_tile_layer = new L.TileLayer(
        map_tile_layer_url,
        {
          minZoom: 2, // absolute-min : 0
          maxZoom: 17, // absolute-max : 17
          bounds: world_bounds,
          attribution: map_tile_layer_attribute,
          detectRetina: true,
          reuseTiles: true,
          continuousWorld: false, // if true, the coordinates won't be wrapped by world width (-180, 180) or clamped to lie within (-90 to 90).
          noWrap: false, // if true, the tiles won't load outside the world width (-180, 180) instead of repeating.
          useCache: true, // plug-in:  to enable caching of tiles
          useOnlyCache: app_geo_config.getUseTileCacheOnly()
        }
      );

      // Listen to cache hits and misses
      // Note: The cache hits/misses are only from this layer, not from the WMS layer.
      map_tile_layer.on('tile_cache:hit', function (event) {
        if (debug_enabled) {
          //console.log('Cache hit: ', event.url);
        }
      });
      map_tile_layer.on('tile_cache:miss', function (event) {
        if (debug_enabled) {
          console.log('Cache miss: ', event.url);
        }
      });

      map.addLayer(map_tile_layer);
      //map.fitBounds(bounds);
    }
*/


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

    initMapControlDraw();
    initMapMarkerButtonGroup();
    initMapTileButtonGroup();


  }

  function applyMapFeatureGeoJSON( geojson_map_feature ) {


  }


  function initMapFeatureGeoJSON( geojson_map_feature ) {


  }



  /**
    USAGE:

   loadJSON('js/sample_markers.json', function (response) {
     // Parse JSON string into object
     var json_object = JSON.parse(response);
     marker_list = json_object;
     //plot markers
     markMap( marker_list );
   });

   **/
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

  function fireEvent(event_type, event_object) {
    if (debug_enabled) {
      console.log('fireEvent(' + event_type + ')\n' + JSON.stringify(event_object, null, 2));
    }
    if (map) {
      map.fire(event_type, event_object);
    }
  }

  function clearAll() {
    unmarkAllSender();
    unmarkAllAttachment();
    clearAllAreaDrawn();
    cancelTileCaching();
    cancelAllUpload();
    cancelAllDownload();
    setTileCloudDownloadEnabled( true );
    setTileExportEnabled( true );
  }

  function requestNewPage( max_per_page, start_index ) {


  }

  return {
    'init' : init,
    'clearAll' : clearAll,
    'initMap' : initMap,
    'initMapTileLayer' : initMapTileLayer,
    'initCacheSeeding' : initCacheSeeding,
    'isMarkedForAllSender' : isMarkedForAllSender,
    'unmarkAllSender' : unmarkAllSender,
    'isMarkedForAllAttachment' : isMarkedForAllAttachment,
    'unmarkAllAttachment' : unmarkAllAttachment,
    'markMap' : markMap,
    'fireEvent' : fireEvent,
    'requestNewPage' : requestNewPage
  }

}());


