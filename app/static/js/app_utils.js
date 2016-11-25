/**
 * loads JSON formatted data from file referenced by the file-path, and pass the data into the argument callback function
 * @param file_path
 * @param callback
 *
 * USAGE:
 *
 * loadJSON('js/sample_markers.json', function (response) {
 *   // Parse JSON string into object
 *   var json_object = JSON.parse(response);
 *   //do something with markers
 *   doSomething( json_object );
 * });
 */
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


/**
 * returns all permutations of an argument array using Heap's Permutation Algorithm
 * @param array
 * @param optional map to store all resulting permutations
 * @returns each permutation of the array elements
 */
function getAllPermutationArray( input_array, output_map ) {

  function swap(array, pos1, pos2) {
    var temp = array[pos1];
    array[pos1] = array[pos2];
    array[pos2] = temp;
  }

  function heapsPermute(array, output, n) {
    n = n || array.length; // set n default to array.length
    if (n === 1) {
      output(array);
    }
    else {
      for (var i = 1; i <= n; i += 1) {
        heapsPermute(array, output, n - 1);
        if (n % 2) {
          var j = 1;
        }
        else {
          var j = i;
        }
        swap(array, j - 1, n - 1); // -1 to account for javascript zero-indexing
      }
    }
  }


  // callback - save each output
  function onResult(output_array) {
    //console.log(JSON.stringify(output_array, null, 2));

    if (output_map) {
      var permutation_as_text = arrayToString( output_array );
      if (permutation_as_text) {
        output_map[ permutation_as_text ] = true;
      }
    }

  }


  heapsPermute(input_array, onResult);
  //example: heapsPermute(['a', 'b', 'c', 'd'])
}

/**
 * returns text/string representation of elements in an array
 * @param array
 * @param optional element separator in the text representation
 * @returns an string representing the elements in the array
 */
function arrayToString( array, separator ) {
  var array_as_text = '', array_separator = ','
  if (array && array.constructor === Array && array.length > 0) {
    if (separator) {
      array_separator = separator;
    }
    _.each(array, function (value, index) {
      array_as_text += (value.trim() + ' ');
    });
    array_as_text = array_as_text.trim();
    array_as_text = array_as_text.replace(/\s/g, array_separator);
    //console.log('array_as_text : ' + array_as_text);
  }
  return array_as_text;
}

/**
 * returns all permutations of a string characters
 * @param text string
 * @returns an array of all permutations of string characters
 */
function getAllPermutationString( text ) {
  //Enclosed data to be used by the internal recursive function permutate():
  var permutation_array = [],  //generated permutations stored here
    nextWord = [],      //next word builds up in here
    chars = []          //collection for each recursion level
    ;

  //split words or numbers into an array of characters
  if (typeof text === 'string') chars = text.split('');
  else if (typeof text === 'number') {
    text = text + ""; //convert number to string
    chars = text.split('');//convert string into char array
  }

  //============TWO Declaratives========
  permutate(chars);
  return permutation_array;

  //===========UNDER THE HOOD===========
  function permutate(chars) { //recursive: generates the permutations
    if(chars.length === 0) {
      permutation_array.push(nextWord.join(''));
    }

    for (var i=0; i < chars.length; i++){
      chars.push(chars.shift());  //rotate the characters
      nextWord.push(chars[0]);    //use the first char in the array
      permutate(chars.slice(1));  //Recurse: array-less-one-char
      nextWord.pop();             //clear for nextWord (multiple pops)
    }
  }
}// end-of getAllPermutationString( text )


/**
 * rounds a numeric value to the precision provided
 * @param value
 * @param precision
 * @returns rounded numeric value
 * usage :
 * round(12345.6789, 2) // 12345.68
 * round(12345.6789, 1) // 12345.7
 * round(12345.6789) // 12346
 * round(12345.6789, -1) // 12350
 * round(12345.6789, -2) // 12300
 * round(-123.45, 1) // -123.4
 * round(123.45, 1) // 123.5
 * round(456.7, 2).toFixed(2) // "456.70"
 */
function roundNumber(value, precision) {
  var multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * converts a string to an unicode-string
 * @param string
 * @returns unicode-string
 */
function toUnicode(theString) {
  var unicodeString = '';
  for (var i=0; i < theString.length; i++) {
    var theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
    while (theUnicode.length < 4) {
      theUnicode = '0' + theUnicode;
    }
    theUnicode = '\\u' + theUnicode;
    unicodeString += theUnicode;
  }
  return unicodeString;
}

/**
 * returns true if the element is visible or false otherwise
 * @param element-id
 * @returns true if the element (referenced by id) is visible
 */
function isElementVisible(element_id) {
  var element = document.getElementById( element_id );
  if (element) {
    var rect = element.getBoundingClientRect();
    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
  }
  return false;
}

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

/**
 * return a separated-string representation of the argument object keys
 * @param map
 * @param separator
 * @returns a separated-string representation of the argument object keys
 */
function getObjectKeysAsString(map, separator) {
  if (_.isEmpty(map)) {
    return '';
  }

  //console.log('getObjectKeysAsString(...)\n' + JSON.stringify(map, null, 2) + '\nseparator "' + separator + '"');

  var key_list = '';
  _.each(map, function (value, key) {
    key_list += (key + ' ');
  });
  key_list = key_list.trim();

  if (separator) {
    key_list = key_list.replace(/[ \u00A0]/g, separator);
  }
  else {
    key_list = key_list.replace(/[ \u00A0]/g, ',');
  }

  return key_list;
}

/**
 * return a truncated string within max-length and ending with '..'
 * @param string
 * @returns truncated string within max-length and ending with '..'
 */
function truncateString( text, max_length, is_descending ) {
  if (text) {
    if (text.length > max_length) {
      if (is_descending === true) {
        text = '..' + text.substring(text.length - max_length + 2);
      }
      else {
        text = text.substring(0, (max_length - 2)) + '..';
      }
    }
  }
  return text;
}

/**
 * return sanitized string with JQuery special characters escaped with '\'
 * @param text
 * @returns sanitized string by escaping the characters (e.g. !"#$%&'()*+,./:;<=>?@[\]^`{|}~ )  with '\'
 */
function escapeJQueryExpression( expression_text ) {
  if (expression_text) {
    return expression_text.replace(/[!"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, '\\$&');
  }
  return expression_text;
}

/**
 * return a document file-type category
 * @param file-name
 * @param MIME-content-type
 * @returns file-type category of 'image', 'pdf', 'powerpoint', 'word', 'excel', or 'other'
 */
function getDocumentType(file_name, content_type) {
  var file_type;

  if (content_type && content_type.startsWith('image')) {
    file_type = 'image';
  }
  else if (file_name) {
    var file_ext;
    //var file_ext = file_name.split('.')[1];
    var index = file_name.lastIndexOf(".");
    if (index > 0) {
      file_ext = file_name.substr(index + 1);
    }
    file_type = getDocumentTypeByExt( file_ext );
  }

  return file_type;
}

/**
 * return a document file-type category
 * @param file-extension
 * @returns file-type category of 'image', 'pdf', 'powerpoint', 'word', 'excel', or 'other'
 */
function getDocumentTypeByExt( extension ) {

  var contains = (function(ext, file_ext_list) {
    return _.any(file_ext_list, function(file_ext) {
      return ext.localeCompare(file_ext) === 0;
    });
  });

  if (extension) {
    var lower_case_ext = extension.toLowerCase();
    //img
    if (contains(lower_case_ext, ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'png'])) {
      return "image";
    }

    //pdf
    if (contains(lower_case_ext, ['pdf'])) {
      return "pdf";
    }

    //ppt
    if (contains(lower_case_ext, ['ppt', 'pptx'])) {
      return "powerpoint";
    }

    //word
    if (contains(lower_case_ext, ['doc', 'docx'])) {
      return "word";
    }

    //excel
    if (contains(lower_case_ext, ['xls', 'xlx', 'xlsx'])) {
      return "excel";
    }

    //text
    if (contains(lower_case_ext, ['txt', 'text'])) {
      return "text";
    }

    //html
    if (contains(lower_case_ext, ['html', 'htm'])) {
      return "html";
    }

    return "other";
  }
  return "other";
}

/**
 * check for whitespace
 * @param text
 * @returns true if the argument contains any whitespace, false otherwise
 */
function containsWhitespace(text) {
  if(text) {
    var regex = /\s/g;
    return regex.test(text);
  }
  return false;
}

/**
 * remove all empty space from text
 * @param text
 * @returns text string without any empty space
 */
function removeAllWhitespace(text) {
  if(text) {
    text = text.replace(/\s/g, "").trim();
  }
  return text;
}

/**
 * sort predicate based on property in descending order
 */
function descendingPredicatByProperty(property){
  return function (a, b) {

    if (a[property] > b[property]) {
      return -1;
    }

    if (a[property] < b[property]) {
      return 1;
    }

    return 0;
  }
}

/**
 * sort predicate based on property in ascending order
 */
function ascendingPredicatByProperty(property){
  return function (a, b) {

    if (a[property] > b[property]) {
      return 1;
    }

    if (a[property] < b[property]) {
      return -1;
    }

    return 0;
  }
}

/**
 * sort predicate based on index in descending order
 */
function descendingPredicatByIndex(index){
  return function(a, b) {

    if( a[index] > b[index]){
      return -1;
    }

    if( a[index] < b[index] ){
      return 1;
    }

    return 0;
  }
}

/**
 * sort predicate based on index in ascending order
 */
function ascendingPredicatByIndex(index){
  return function(a, b) {

    if( a[index] > b[index]){
      return -1;
    }

    if( a[index] < b[index] ){
      return 1;
    }

    return 0;
  }
}

/**
 * sort predicate based on value in descending order
 */
function descendingPredicatByValue(){
  return function(a, b) {
    return b - a;
  }
}

/**
 * sort predicate based on value in ascending order
 */
function ascendingPredicatByValue(){
  return function(a, b) {
    return a - b;
  }
}

/**
 *
 * @param from, floor int value
 * @param to, ceiling int value
 * @returns {number}
 */
function generateRandomInt( from, to ) {
  return Math.floor(Math.random() * (to - from + 1) + from);
}

/**
 * return a deep-copy of the argument
 * @param source to be cloned
 * @returns deep-copy
 */
function clone( source ) {
  if (source) {
    var copy;
    if (jQuery.isArray(source)) {
      copy = jQuery.extend(true, [], source);
    }
    else {
      copy = jQuery.extend(true, {}, source);
    }
    return copy;
  }
  return source;
}

/**
 * return a parameter-value from a valid url
 * @param a valid url
 * @param a parameter key
 * @returns parameter value
 */
function getURLParameter( url, parameter_key ) {
  //console.log('getURLParameter(' + url + ', ' + parameter_key + ')');
  var parameter_value;
  if (url && parameter_key) {
    var url_parameter_list = url.split('&');
    for (var i = 0; i < url_parameter_list.length; i++) {
      var parameter_name_list = url_parameter_list[i].split('=');
      var key = parameter_name_list[0];
      var value = parameter_name_list[1];
      //console.log('\tkey: ' + key + ' value: ' + value );
      if (key.endsWith( parameter_key )) {
        parameter_value = value;
      }
    }
  }
  return parameter_value;
}

/**
 * return a path-value from a valid url
 * @param a valid url
 * @param a path index
 * @returns path value
 */
function getURLPathByIndex( url, index ) {
  if (url && index >= 0) {
    var url_path = getURLPathName(url);
    if (url_path) {
      url_path = trimURLPath( url_path );

      var path_list = url_path.split('/');
      return path_list[index];
    }
  }
}

function trimURLPath( url_path ) {
  if (url_path.startsWith('/')) {
    url_path = url_path.substring(1);
  }

  if (url_path.endsWith('/')) {
    url_path = url_path.substring(0, url_path.length - 1);
  }

  return url_path;
}

function getURLParser( url ) {
  var anchor = document.createElement("a");
  anchor.href = url;
  return anchor;
}

function getURLPathName( url ) {
  var link = getURLParser( url );
  return link.pathname;
}

function getURLHost( url ) {
  var link = getURLObject( url );
  return link.host;
}

function newDateTimeInstance(datetime_as_string) {
  var _datetime;
  if (datetime_as_string) {
    //console.log('newDateTimeInstance(' + datetime_as_string + ')');
    var _datetime_string_array = datetime_as_string.split('-');
    _datetime= new Date(_datetime_string_array[0], (parseInt(_datetime_string_array[1]) - 1), _datetime_string_array[2], 0, 0, 0, 0);
  }
  else {
    _datetime= new Date();
  }
  //console.log('\tdatetime-object ' + _datetime.toISOString() + '');
  return _datetime;
}

function tokenize( text ) {
  var tokens = [];
  if (text) {
    var separators = [';', ','];
    var token_array = text.split(new RegExp(separators.join('|'), 'g'));
    _.each(token_array, function(element) {
      if (element) {
        tokens.push(element.trim())
      }
    });
  }
  return tokens;
}

function extractEmailAddress( text ) {
  var address = '';
  if (text && text.indexOf('@') >= 0) {
    if (text.indexOf('<') >= 0) {
      var matches = text.match(/\<(.*?)\>/);
      if (matches) {
        if (validateEmailAddress(matches[1])) {
          address = matches[1];
        }
        else {
          console.log('email matched invalid ' + matches[1] );
        }
      }
    }
    else if (text.indexOf('(') >= 0) {
      var matches = text.match(/\((.*?)\)/);
      if (matches) {
        if (validateEmailAddress(matches[1])) {
          address = matches[1];
        }
        else {
          console.log('email matched invalid ' + matches[1] );
        }
      }
    }
    else {
      address = text;
    }
  }
  return address;
}


