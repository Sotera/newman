/**
 * generate an id based on a geo bounding-box
 * defined by a sw-coordinate (lower-left corner) and a ne-coordinate (upper-right corner)
 * @param geo-value
 * @returns geo-id as string
 */
function generateBoundingBoxGeoID( sw_lat, sw_lon, ne_lat, ne_lon ) {
  var bounding_box_geo_id;
  if (sw_lat && sw_lon && ne_lat && ne_lon) {
    bounding_box_geo_id = 'SW(' + sw_lat + ',' + sw_lon + '),NE(' + ne_lat + ',' + ne_lon + ')';
  }
  return bounding_box_geo_id ;
}

/**
 * apply offset value to a coordinate value
 * @param geo-value
 * @returns geo-value with offset added
 */
function applyGeoOffset( geo_value ) {
  var new_geo_value;
  if (geo_value) {
    //var offset = (Math.random() -.5) / 750; // ~ 50-meter
    var offset = (Math.random() -.5) / 1500; // ~ 100-meter
    //var offset = (Math.random() -.5) / 3000; // ~ 200-meter
    //var offset = (Math.random() -.5) / 6000; // ~ 400-meter
    new_geo_value = parseFloat(geo_value) + offset;
  }
  return new_geo_value;
}