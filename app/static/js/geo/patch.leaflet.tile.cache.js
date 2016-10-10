
L.TileLayer.prototype.local_cache_db_connected = false;
L.TileLayer.prototype.remote_cache_db_connected = false;
L.TileLayer.prototype.options.useCache     = true;
L.TileLayer.prototype.options.saveToCache  = true;
L.TileLayer.prototype.options.useOnlyCache = false;
L.TileLayer.prototype.options.advance_mode_on = true;
L.TileLayer.prototype.options.cacheFormat = 'image/png';
L.TileLayer.prototype.options.cacheMaxAge  = 12*30*(24*3600*1000); // 12*30-days

L.TileLayer.addInitHook(function() {

	//initialize from external config
	this.options.debug_mode_on = app_geo_config.enableDebugMode();
	this.options.advance_mode_on = app_geo_config.enableAdvanceMode();
	this.options.can_override_remote_cache_db = app_geo_config.canOverrideRemoteTileDB();
	this.options.disable_override_remote_cache_db = app_geo_config.disableOverrideRemoteTileDB();
	this.options.useOnlyCache = app_geo_config.enableOnlyTileCache();
	this.local_cache_db_url = app_geo_config.getLocalTileDBName();
	this.remote_cache_db_url = app_geo_config.getRemoteTileDBName();

	this._local_cache_db = null;
	this._remote_cache_db = null;
	this._cache_db = null;
	this._canvas = null;

	if (!this.options.useCache) {
		return;
	}

	//PouchDB.debug.enable('*');

	this._local_cache_db = new PouchDB( this.local_cache_db_url, {revs_limit: 1} );
	this._remote_cache_db = new PouchDB( this.remote_cache_db_url, {adapter: "http", revs_limit: 1} );

	// initialize local cache_db
	this._local_cache_db.info(function(db_error, db_info) {
		if (db_error) {
			//console.log(JSON.stringify(db_error, null, 2));
			this.local_cache_db_connected = false;

			console.warn( db_error )
		}

		if (db_info) {
			console.log(JSON.stringify(db_info, null, 2));
			if (db_info.error) {
				this.local_cache_db_connected = false;
			}
			else {
				this.local_cache_db_connected = true;
			}
		}

		if (this.local_cache_db_connected) {
			console.log("local tile_cache database '" + this.local_cache_db_url + "' connected!");

			if (this.options.useOnlyCache) {
				this._cache_db = this._remote_cache_db;
				console.log("tile_cache database : " + this.remote_cache_db_url);
			}
			else if (this.options.can_override_remote_cache_db) {
				this._cache_db = this._remote_cache_db;
				console.log("tile_cache database : " + this.remote_cache_db_url);
			}
			else {
				this._cache_db = this._local_cache_db;
				console.log("tile_cache database : " + this.local_cache_db_url);
			}

		}
		else {
			console.log("local tile_cache database '" + this.local_cache_db_url + "' NOT connected!");
		}
	}.bind(this));


	// initialize remote cache_db
	this._remote_cache_db.info(function(db_error, db_info) {
		if (db_error) {
			//console.log(JSON.stringify(db_error, null, 2));
			this.remote_cache_db_connected = false;

			console.warn( db_error )
		}

		if (db_info) {
			console.log(JSON.stringify(db_info, null, 2));
			if (db_info.error) {
				this.remote_cache_db_connected = false;
			}
			else {
				this.remote_cache_db_connected = true;
			}
		}

		if (this.remote_cache_db_connected) {
			console.log("remote tile_cache database '" + this.remote_cache_db_url + "' connected!");

			if (this.options.useOnlyCache) {
				this._cache_db = this._remote_cache_db;
				console.log("tile_cache database : " + this.remote_cache_db_url);
			}
			else if (this.options.can_override_remote_cache_db) {
				this._cache_db = this._remote_cache_db;
				console.log("tile_cache database : " + this.remote_cache_db_url);
			}
			else {
				this._cache_db = this._local_cache_db;
				console.log("tile_cache database : " + this.local_cache_db_url);
			}


		}
		else {
			console.log("remote tile_cache database '" + this.remote_cache_db_url + "' NOT connected!");
		}
		app_geo_config.setRemoteTileDBConnected( this.remote_cache_db_connected );
	}.bind(this));


	this._seed_cache_handler = {"is_cancelled" : false};
	this._download_handler = null;
	this._upload_handler = null;
	this._canvas = document.createElement('canvas');

	if (!(this._canvas.getContext && this._canvas.getContext('2d'))) {
		// HTML5 canvas is needed to pack the tiles as base64 data. If
		//   the browser doesn't support canvas, the code will forcefully
		//   skip caching the tiles.
		this._canvas = null;
	}
});


L.TileLayer.include({

	// Overwrites L.TileLayer.prototype.createTile
	createTile: function(coords, done) {
		var tile = document.createElement('img');

		tile.onerror = L.bind(this._tileOnError, this, done, tile);

		if (this.options.crossOrigin) {
			tile.crossOrigin = '';
		}

		/*
		 Alt tag is *set to empty string to keep screen readers from reading URL and for compliance reasons
		 http://www.w3.org/TR/WCAG20-TECHS/H67
		 */
		tile.alt = '';

		var tileUrl = this.getTileUrl(coords);

		if (this.options.useCache && this._canvas) {

			if (!this._cache_db) {
				console.warn("_cache_db undefined!");
				return;
			}

			//this._cache_db.get( tileUrl, {revs_info: true} ).then(
			this._cache_db.get( tileUrl ).then( function(doc) {

				if (doc) {
					// tile found in cache
					if (this.options.debug_mode_on) {
						console.log('tile_cache found: ' + tileUrl);
						//console.log('doc :\n' + JSON.stringify(doc, null, 2));
					}
					this.fire('tile_cache:hit', {tile: tile, url: tileUrl});

					if (Date.now() > doc.timestamp + this.options.cacheMaxAge && !this.options.useOnlyCache) {
						// Tile is too old, try to refresh it
						console.log("tile '" + tileUrl + "' is too old, updating...");

						if (this._cache_db === this._remote_cache_db && this.options.disable_override_remote_cache_db) {
							console.log("\tremote tile_cache override disabled at this time!");
							// Serve tile from cached data
							tile.onload = L.bind(this._tileOnLoad, this, done, tile);
							tile.src = doc.dataUrl;
						}
						else {

							if (this.options.saveToCache) {
								//tile.onload = L.bind(this._saveTile, this, tile, tileUrl, data._revs_info[0].rev, done);
								tile.onload = L.bind(this._saveTile, this, tile, tileUrl, doc._rev, done);
							}

							tile.crossOrigin = 'Anonymous';
							tile.src = tileUrl;
							tile.onerror = function (ev) {
								console.log("tile.onerror()");
								// If the tile is too old but couldn't be fetched from the network,
								// serve the one still in cache.
								this.src = doc.dataUrl;
							}.bind(this);

						}
					}
					else {
						// Serve tile from cached data
						//console.log('tile is cached : ' + tileUrl);
						//console.log('data.dataUrl : ' + data.dataUrl);
						tile.onload = L.bind(this._tileOnLoad, this, done, tile);
						tile.src = doc.dataUrl;    // data.dataUrl is already a base64-encoded PNG image.
					}

				}
				else {
					this._onCacheNotFound(tile, tileUrl, done);
				}

				//this._onCacheLookup(tile, tileUrl, done)

			}.bind(this)).catch(function (err) {
				if (err) {
					if (err.name == "not_found" || err.status == 404) {
						//data not found, perfectly normal...
					}
					else if (err.name == "unknown_error" || err.status == 500) {
						//database offline most likely, ok...
					}
					else {
						console.log("tile_cache '" + tileUrl + "' lookup : " + err.name + " (" + err.status + ")");
						//console.warn(JSON.stringify(err, null, 2));
					}
				}

				this._onCacheNotFound(tile, tileUrl, done);

			}.bind(this));
		}
		else {
			// Fall back to standard behaviour
			tile.onload = L.bind(this._tileOnLoad, this, done, tile);
		}

		tile.src = tileUrl;
		return tile;
	},

	/*
	 * Returns a callback (closure over tile/key/originalSrc) to be run
	 * when the DB-backend is finished with a fetch operation.
	 */
	/*
	_onCacheLookup: function(tile, tileUrl, done) {
		this.options.useOnlyCache = app_geo_config.enableOnlyTileCache();

		return function(data) {

			if (data) {
				// tile found in cache
				console.log('tile_cache found: ' + tileUrl);
				this.fire('tile_cache:hit', {tile: tile, url: tileUrl});

				if (Date.now() > data.timestamp + this.options.cacheMaxAge && !this.options.useOnlyCache) {
					// Tile is too old, try to refresh it
					console.log('tile is too old: ' + tileUrl);

					if (this.options.saveToCache) {
						//tile.onload = L.bind(this._saveTile, this, tile, tileUrl, data._revs_info[0].rev, done);
						tile.onload = L.bind(this._saveTile, this, tile, tileUrl, data._rev, done);
					}

					tile.crossOrigin = 'Anonymous';
					tile.src = tileUrl;
					tile.onerror = function (ev) {
						// If the tile is too old but couldn't be fetched from the network,
						// serve the one still in cache.
						this.src = data.dataUrl;
					}
				}
				else {
					// Serve tile from cached data
					console.log('tile is cached: ', tileUrl);
					tile.onload = L.bind(this._tileOnLoad, this, done, tile);
					tile.src = data.dataUrl;    // data.dataUrl is already a base64-encoded PNG image.
				}

			}
			else {
				this._onCacheNotFound(tile, tileUrl, done);
			}

		}
		//}.bind(this);
	},
  */

	_onCacheNotFound: function (tile, tileUrl, done) {
		this.options.useOnlyCache = app_geo_config.enableOnlyTileCache();

		if (this.options.debug_mode_on) {
			console.log('tile_cache not found: ' + tileUrl);
		}
		this.fire( 'tile_cache:miss', { tile: tile, url: tileUrl } );

		if (this.options.useOnlyCache) {
			// Offline, not cached
			//console.log('Tile not in cache', tileUrl);
			tile.onload = L.Util.falseFn;
			tile.src = L.Util.emptyImageUrl;
		}
		else {
			//Online, not cached, request the tile normally
			//console.log('Requesting tile normally', tileUrl);

			if (this.options.saveToCache) {
				tile.onload = L.bind(this._saveTile, this, tile, tileUrl, null, done);
			}
			else {
				tile.onload = L.bind(this._tileOnLoad, this, done, tile);
			}

			tile.crossOrigin = 'Anonymous';
			tile.src = tileUrl;
		}
	},

	/*
	 * Returns an event handler (closure over DB key), which runs when the tile (which is an <img>) is ready.
	 * The handler will delete the document from pouchDB if an existing revision is passed.
	 * This will keep just the latest valid copy of the image in the cache.
	 */
	_saveTile: function(tile, tileUrl, existingRevision, done, cachingSeed) {
		if (this._cache_db) {
			if (this._cache_db === this._remote_cache_db && this.options.disable_override_remote_cache_db) {
				console.log("\tremote tile_cache override disabled at this time!");
				if (done) { done(); }
				return;
			}
		}
		else {
			console.warn("_cache_db undefined!");
			if (done) { done(); }
			return;
		}

		if (this._canvas === null) return;
		this._canvas.width  = tile.naturalWidth  || tile.width;
		this._canvas.height = tile.naturalHeight || tile.height;

		var context = this._canvas.getContext('2d');
		context.drawImage(tile, 0, 0);

		var dataUrl = this._canvas.toDataURL(this.options.cacheFormat);

		if (existingRevision) {
			if (this.options.debug_mode_on) {
				console.log("saveTile(" + tileUrl + "), existingRevision : " + existingRevision);
			}

			var doc = {
				_id : tileUrl,
				_rev : existingRevision,
				dataUrl : dataUrl,
				timestamp : Date.now()
			};

			this._cache_db.put( doc ).then( function (response) {

				if (response) {
					//console.log(JSON.stringify(response, null, 2));
					if (response.ok === true) {
						if (this.options.debug_mode_on) {
							console.log('cached tile "' + response.id + ' rev "' + response.rev + '", OK');
						}
					}
					else {
						console.log(JSON.stringify(response, null, 2));
					}
				}
			}.bind(this)).catch(function (err) {

				if (err.name === 'conflict' || err.status == 409) {
					console.log("attempting to resolve conflict ...");

					this._cache_db.upsert(tileUrl, function (doc) {

						return doc;

					}).then(function (response) {
						//console.log(JSON.stringify(response, null, 2));
						console.log('up-sert('+tileUrl+', '+existingRevision+') success!');

					}).catch(function (err) {
						console.log('up-sert('+tileUrl+', '+existingRevision+') failed!');
						console.warn(err);

						if (cachingSeed) {
							this.fire('seed:error', {bounding_box_label: cachingSeed.bounding_box_label, message: err});
						}
					});
				}
				else {
					console.log('put('+tileUrl+', '+existingRevision+') failed!');
					console.log(err);

					if (cachingSeed) {
						this.fire('seed:error', {bounding_box_label: cachingSeed.bounding_box_label, message: err});
					}
				}

			}.bind(this));

		}
		else {// no existing revision

			var doc = {
				_id : tileUrl,
				dataUrl : dataUrl,
				timestamp : Date.now()
			};

			this._cache_db.put( doc ).then( function(response) {

				if (response) {
					//console.log(JSON.stringify(response, null, 2));
					if (response.ok === true) {
						if (this.options.debug_mode_on) {
							console.log('cached tile "' + response.id + '", OK');
						}
					}
					else {
						console.log(JSON.stringify(response, null, 2));
					}
				}
			}.bind(this)).catch( function(err) {

				if (err.name === 'conflict' || err.status == 409) {
					console.log("attempting to resolve conflict ...");

					this._cache_db.upsert(tileUrl, function (doc) {

							return doc;
					}).then(function (response) {
						//console.log(JSON.stringify(response, null, 2));
						console.log('up-sert('+tileUrl+') success!');

					}).catch(function (err) {
						console.log('up-sert('+tileUrl+') failed!');
						console.warn(err);

						if (cachingSeed) {
							this.fire('seed:error', {bounding_box_label: cachingSeed.bounding_box_label, message: err});
						}
					});
				}
				else {
					console.log('up-sert('+tileUrl+') failed!');
					console.log(JSON.stringify(err, null, 2));

					if (cachingSeed) {
						this.fire('seed:error', {bounding_box_label: cachingSeed.bounding_box_label, message: err});
					}
				}

			}.bind(this));

		} // end-of no existing revision

		if (done) { done(); }
	},


	/*
	 * Seeds the cache given a bounding box (latLngBounds), and
	 *  the minimum and maximum zoom levels.
	 *  Use with care! This can spawn thousands of requests and flood tile-server!
	 */
	seed: function(bounding_box, minZoom, maxZoom, box_label) {
		if (!bounding_box) {
			var error_message = 'argument "bounding_box" cannot be null!'
			console.log(error_message);
			this.fire('seed:error', {bounding_box_label : 'unknown bounding_box', message: error_message});
			return;
		}

		var sw_lat = bounding_box.sw_latitude, sw_lon = bounding_box.sw_longitude;
		var ne_lat = bounding_box.ne_latitude, ne_lon = bounding_box.ne_longitude;

		/*
		 // backward-support multiple formats, bounding box object under Leaflet lib
		 // var bounding_box = new L.LatLngBounds( new L.LatLng(sw_lat, sw_lon), new L.LatLng(ne_lat, ne_lon) );

		if (bounding_box instanceof L.LatLngBounds) {
			sw_lat = bounding_box.getSouthWest().lat, sw_lon = bounding_box.getSouthWest().lng;
			ne_lat = bounding_box.getNorthEast().lat, ne_lon = bounding_box.getNorthEast().lng;
		}
		*/

		var bounding_box_geo_id = generateBoundingBoxGeoID( sw_lat, sw_lon, ne_lat, ne_lon );
		var label = bounding_box_geo_id;
		if (box_label) {
			label = box_label;
		}

		if (!app_geo_config.enableAdvanceMode()) {
			console.log('Must enable advance mode!');
			this.fire('seed:error', {bounding_box_label : label, message: "advance mode not enabled!"});
			return;
		}

		if (!this.options.useCache) return;
		if (minZoom > maxZoom) return;
		if (!this._map) return;

		this._seed_cache_handler.is_cancelled = false;

		var queue = [];

		for (var z = minZoom; z<=maxZoom; z++) {

			var northEastPoint = this._map.project(new L.LatLng(ne_lat, ne_lon),z);
			var southWestPoint = this._map.project(new L.LatLng(sw_lat, sw_lon),z);

			// Calculate tile indexes as per L.TileLayer._update and
			//   L.TileLayer._addTilesFromCenterOut
			var tileSize = this.getTileSize();
			var tileBounds = L.bounds(
				L.point(Math.floor(northEastPoint.x / tileSize.x), Math.floor(northEastPoint.y / tileSize.y)),
				L.point(Math.floor(southWestPoint.x / tileSize.x), Math.floor(southWestPoint.y / tileSize.y)));

			for (var j = tileBounds.min.y; j <= tileBounds.max.y; j++) {
				for (var i = tileBounds.min.x; i <= tileBounds.max.x; i++) {
					point = new L.Point(i, j);
					point.z = z;
					queue.push(this._getTileUrl(point));
				}
			}
		}

		var cachingSeed = {
			bounding_box: bounding_box,
			minZoom: minZoom,
			maxZoom: maxZoom,
			queueLength: queue.length,
			bounding_box_geo_id: bounding_box_geo_id,
			bounding_box_label : label
		}

		this.fire('seed:start', cachingSeed);

		var tile = this._createTile();
		tile._layer = this;
		this._seedOneTile(tile, queue, cachingSeed);
	},

	cancelSeedTileCache : function() {
		if (this._seed_cache_handler) {
			console.log('cancelSeedTileCache()');
			this._seed_cache_handler.is_cancelled = true;
		}
	},

	_createTile: function () {
		return document.createElement('img');
	},

	/*
	 * Modified L.TileLayer.getTileUrl, this will use the zoom given by the parameter coords
	 * instead of the maps current zoomlevel.
	 */
	_getTileUrl: function (coords) {
		var zoom = coords.z;
		if (this.options.zoomReverse) {
			zoom = this.options.maxZoom - zoom;
		}
		zoom += this.options.zoomOffset;
		return L.Util.template(this._url, L.extend({
			r: this.options.detectRetina && L.Browser.retina && this.options.maxZoom > 0 ? '@2x' : '',
			s: this._getSubdomain(coords),
			x: coords.x,
			y: this.options.tms ? this._globalTileRange.max.y - coords.y : coords.y,
			z: this.options.maxNativeZoom ? Math.min(zoom, this.options.maxNativeZoom) : zoom
		}, this.options));
	},

	/*
	 * Uses a defined tile to eat through one item in the queue and
	 * asynchronously recursively call itself when the tile has finished loading.
	 */
	_seedOneTile: function(tile, remaining, cachingSeed) {
		if (this._seed_cache_handler.is_cancelled) {
			this.fire('seed:cancel', cachingSeed);
			return;
		}

		if (!remaining.length) {
			this.fire('seed:end', cachingSeed);
			return;
		}

		if (!this._cache_db) {
			console.warn("_cache_db undefined!");
			this.fire('seed:cancel', cachingSeed);
			return;
		}

		this.fire('seed:progress', {
			bounding_box:    cachingSeed.bounding_box,
			minZoom: cachingSeed.minZoom,
			maxZoom: cachingSeed.maxZoom,
			queueLength: cachingSeed.queueLength,
			bounding_box_geo_id: cachingSeed.bounding_box_geo_id,
			bounding_box_label : cachingSeed.bounding_box_label,
			remainingLength: remaining.length
		});

		var url = remaining.pop();


		this._cache_db.get(url, function(err, doc) {
			if (!doc) {
				/// FIXME: Do something on tile error!!
				tile.onload = function(ev) {
					this._saveTile(tile, url, null, null, cachingSeed); //(ev)
					this._seedOneTile(tile, remaining, cachingSeed);
				}.bind(this);
				tile.crossOrigin = 'Anonymous';
				tile.src = url;
			}
			else {
				this._seedOneTile(tile, remaining, cachingSeed);
			}
		}.bind(this));

	},

	_fireMapEvent :	function(event_type, event_obj) {
			//console.log('_fireMapEvent(' + event_type + ')');
			//console.log('\n' + JSON.stringify(event_obj, null, 2));
			this.fire(event_type, event_obj);
	},

	uploadTileCache : function( map ) {
		this.options.useOnlyCache = app_geo_config.enableOnlyTileCache();
		this.local_cache_db_url = app_geo_config.getLocalTileDBName();
		this.remote_cache_db_url = app_geo_config.getRemoteTileDBName();

		console.log('uploadTileCache()');
		console.log('\toptions.useOnlyCache : ' + this.options.useOnlyCache);
		console.log('\tlocal_cache_db_url : ' + this.local_cache_db_url);
		console.log('\tremote_cache_db_url : ' + this.remote_cache_db_url);
		console.log('\tremote_tile_db_can_override : ' + app_geo_config.canOverrideRemoteTileDB());
		console.log('\tremote_tile_db_connected : ' + app_geo_config.isRemoteTileDBConnected());

		if (!this.local_cache_db_connected) {
			console.log("tile_cache database '" + this.local_cache_db_url + "' NOT connected!");

			if (map) {
				map.fireEvent('up:error', null);
			}
			return;
		}

		if (!this.remote_cache_db_connected) {
			console.log("tile_cache database '" + this.remote_cache_db_url + "' NOT connected!");

			if (map) {
				map.fireEvent('upload:error', null);
			}
			return;
		}

		if (this.remote_cache_db_url != this.local_cache_db_url) {

			this._upload_handler = PouchDB.replicate(
					this.local_cache_db_url,
					this.remote_cache_db_url,
					{retry: true}
			).on('change', function (info) { // handle change
			}).on('paused', function (err) { // replication paused (e.g. replication up to date, user went offline)
				//this._fireMapEvent('upload:paused', err);
				//this.fire('upload:paused', err);
			}).on('active', function () {
				// replicate resumed (e.g. new changes replicating, user went back online)
			}).on('denied', function (err) {  // a document failed to replicate, e.g. due to permissions
				//this._fireMapEvent('upload:denied', err);
				//this.fire('upload:denied', err);
			}).on('complete', function (info) { // handle complete
				console.log('uploadTileCache complete!\n' + JSON.stringify(info, null, 2));

				map.fireEvent('upload:complete', info);
			}).on('error', function (err) { // handle error
				console.warn(err);
				if (map) {
					map.fireEvent('upload:error', err);
				}
			});

		}
		else {
			if (map) {
				map.fireEvent('upload:error', null);
			}
		}

	}, // end of uploadTileCache()

	cancelUploadTileCache : function() {
		if (this._upload_handler) {
			console.log('cancelUploadTileCache()');
			this._upload_handler.cancel();
		}
	},

  downloadTileCache : function( map ) {
		this.options.useOnlyCache = app_geo_config.enableOnlyTileCache();
		this.local_cache_db_url = app_geo_config.getLocalTileDBName();
		this.remote_cache_db_url = app_geo_config.getRemoteTileDBName();

		console.log('downloadTileCache()');
		console.log('\toptions.useOnlyCache : ' + this.options.useOnlyCache);
		console.log('\tlocal_cache_db_url : ' + this.local_cache_db_url);
		console.log('\tremote_cache_db_url : ' + this.remote_cache_db_url);
		console.log('\tremote_tile_db_can_override : ' + app_geo_config.canOverrideRemoteTileDB());
		console.log('\tremote_tile_db_connected : ' + app_geo_config.isRemoteTileDBConnected());

		if (!this.local_cache_db_connected) {
			console.log("tile_cache database '" + this.local_cache_db_url + "' NOT connected!");

			if (map) {
				map.fireEvent('download:error', null);
			}
			return;
		}

		if (!this.remote_cache_db_connected) {
			console.log("tile_cache database '" + this.remote_cache_db_url + "' NOT connected!");

			if (map) {
				map.fireEvent('download:error', null);
			}
			return;
		}

		if (this.remote_cache_db_url != this.local_cache_db_url) {

			this._download_handler = PouchDB.replicate(
					this.remote_cache_db_url,
					this.local_cache_db_url,
					{retry: true}
			).on('change', function (info) {
				// handle change
			}).on('paused', function (err) {
				// replication paused (e.g. replication up to date, user went offline)
				if (map) {
					map.fireEvent('download:paused', err);
				}
				//this.fire('download:paused', err);
			}).on('active', function () {
				// replicate resumed (e.g. new changes replicating, user went back online)
			}).on('denied', function (err) {
				// a document failed to replicate, e.g. due to permissions
				if (map) {
					map.fireEvent('download:denied', err);
				}
				//this.fire('download:denied', err);
			}).on('complete', function (info) { // handle complete
				//console.log('downloadTileCache complete!\n' + JSON.stringify(info, null, 2));
				if (map) {
					map.fireEvent('download:complete', info);
				}
				//this.fire('download:complete', info);
			}).on('error', function (err) { // handle error
				console.warn(err);
				if (map) {
					map.fireEvent('download:error', err);
				}
				//this.fire('download:error', {'error':err});
			});

		}
		else {
			if (map) {
				map.fireEvent('download:error', null);
			}
		}

	}, // end of downloadTileCache()

	cancelDownloadTileCache : function() {
		if (this._download_handler) {
			console.log('cancelDownloadTileCache()');
			this._download_handler.cancel();
		}
	}

});


