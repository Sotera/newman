
L.TileLayer.addInitHook(function() {

	if (!this.options.useCache) {
		this._local_db = null;
		this._canvas = null;
		return;
	}

	//initialize from external config
	this.options.useOnlyCache = app_geo_config.enableOnlyTileCache();
	this.local_tile_db_name = app_geo_config.getLocalTileDBName();
	this.remote_tile_db_name = app_geo_config.getRemoteTileDBName();

	this._local_db = new PouchDB( this.local_tile_db_name );
	this._canvas = document.createElement('canvas');

	if (!(this._canvas.getContext && this._canvas.getContext('2d'))) {
		// HTML5 canvas is needed to pack the tiles as base64 data. If
		//   the browser doesn't support canvas, the code will forcefully
		//   skip caching the tiles.
		this._canvas = null;
	}
});

L.TileLayer.prototype.options.useCache     = true;
L.TileLayer.prototype.options.saveToCache  = true;
L.TileLayer.prototype.options.useOnlyCache = false;
L.TileLayer.prototype.options.cacheFormat = 'image/png';
L.TileLayer.prototype.options.cacheMaxAge  = 6*30*24*3600*1000; // 6*30-days


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
			this._local_db.get(tileUrl, {revs_info: true}, this._onCacheLookup(tile, tileUrl, done));
		} else {
			// Fall back to standard behaviour
			tile.onload = L.bind(this._tileOnLoad, this, done, tile);
		}

		tile.src = tileUrl;
		return tile;
	},

	// Returns a callback (closure over tile/key/originalSrc) to be run when the DB
	//   backend is finished with a fetch operation.
	_onCacheLookup: function(tile, tileUrl, done) {
		return function(err, data) {
			if (data) {
				this.fire('tilecachehit', {
					tile: tile,
					url: tileUrl
				});
				if (Date.now() > data.timestamp + this.options.cacheMaxAge && !this.options.useOnlyCache) {
					// Tile is too old, try to refresh it
					console.warn('Tile is too old: ' + tileUrl);

					if (this.options.saveToCache) {
						tile.onload = L.bind(this._saveTile, this, tile, tileUrl, data._revs_info[0].rev, done);
					}
					tile.crossOrigin = 'Anonymous';
					tile.src = tileUrl;
					tile.onerror = function(ev) {
						// If the tile is too old but couldn't be fetched from the network,
						//   serve the one still in cache.
						this.src = data.dataUrl;
					}
				} else {
					// Serve tile from cached data
					//console.log('Tile is cached: ', tileUrl);
					tile.onload = L.bind(this._tileOnLoad, this, done, tile);
					tile.src = data.dataUrl;    // data.dataUrl is already a base64-encoded PNG image.
				}
			} else {
				this.fire('tilecachemiss', {
					tile: tile,
					url: tileUrl
				});
				if (this.options.useOnlyCache) {
					// Offline, not cached
// 					console.log('Tile not in cache', tileUrl);
					tile.onload = L.Util.falseFn;
					tile.src = L.Util.emptyImageUrl;
				} else {
					//Online, not cached, request the tile normally
// 					console.log('Requesting tile normally', tileUrl);
					if (this.options.saveToCache) {
						tile.onload = L.bind(this._saveTile, this, tile, tileUrl, null, done);
					} else {
						tile.onload = L.bind(this._tileOnLoad, this, done, tile);
					}
					tile.crossOrigin = 'Anonymous';
					tile.src = tileUrl;
				}
			}
		}.bind(this);
	},

	// Returns an event handler (closure over DB key), which runs
	//   when the tile (which is an <img>) is ready.
	// The handler will delete the document from pouchDB if an existing revision is passed.
	//   This will keep just the latest valid copy of the image in the cache.
	_saveTile: function(tile, tileUrl, existingRevision, done) {
		if (this._canvas === null) return;
		this._canvas.width  = tile.naturalWidth  || tile.width;
		this._canvas.height = tile.naturalHeight || tile.height;

		var context = this._canvas.getContext('2d');
		context.drawImage(tile, 0, 0);

		var dataUrl = this._canvas.toDataURL(this.options.cacheFormat);
		var doc = {dataUrl: dataUrl, timestamp: Date.now()};

		if (existingRevision) {
			this._local_db.remove(tileUrl, existingRevision);
		}
		this._local_db.put(doc, tileUrl, doc.timestamp);

		if (done) { done(); }
	},


	// Seeds the cache given a bounding box (latLngBounds), and
	//   the minimum and maximum zoom levels
	// Use with care! This can spawn thousands of requests and
	//   flood tileservers!
	seed: function(bbox, minZoom, maxZoom) {
		if (!this.options.useCache) return;
		if (minZoom > maxZoom) return;
		if (!this._map) return;

		var queue = [];

		for (var z = minZoom; z<=maxZoom; z++) {

			var northEastPoint = this._map.project(bbox.getNorthEast(),z);
			var southWestPoint = this._map.project(bbox.getSouthWest(),z);

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

		var seedData = {
			bbox: bbox,
			minZoom: minZoom,
			maxZoom: maxZoom,
			queueLength: queue.length
		}
		this.fire('seedstart', seedData);
		var tile = this._createTile();
		tile._layer = this;
		this._seedOneTile(tile, queue, seedData);
	},

	_createTile: function () {
		return document.createElement('img');
	},

	// Modified L.TileLayer.getTileUrl, this will use the zoom given by the parameter coords
	//  instead of the maps current zoomlevel.
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

	// Uses a defined tile to eat through one item in the queue and
	//   asynchronously recursively call itself when the tile has
	//   finished loading.
	_seedOneTile: function(tile, remaining, seedData) {
		if (!remaining.length) {
			this.fire('seedend', seedData);
			return;
		}
		this.fire('seedprogress', {
			bbox:    seedData.bbox,
			minZoom: seedData.minZoom,
			maxZoom: seedData.maxZoom,
			queueLength: seedData.queueLength,
			remainingLength: remaining.length
		});

		var url = remaining.pop();

		this._local_db.get(url, function(err, data) {
			if (!data) {
				/// FIXME: Do something on tile error!!
				tile.onload = function(ev) {
					this._saveTile(tile, url, null); //(ev)
					this._seedOneTile(tile, remaining, seedData);
				}.bind(this);
				tile.crossOrigin = 'Anonymous';
				tile.src = url;
			} else {
				this._seedOneTile(tile, remaining, seedData);
			}
		}.bind(this));

	},

	exportToFile : function( file_name ) {
		var db_file_name = 'cache.' + this.local_tile_db_name + '.db';
		if (file_name) {
			db_file_name = file_name;
		}

		console.log('exportToFile(' + db_file_name + ')');

		var pouch = require('pouchdb');
		var pouchRepStream = require('pouchdb-replication-stream');
		pouch.plugin(pouchRepStream.plugin);
		var fs = require('fs');
		var ws = fs.createWriteStream( db_file_name );

		this._local_db.dump(ws).then(function (response) {
			// response should be {ok: true}
			console.log(JSON.stringify(response, null, 2));
		});


	},

	uploadTileCache : function() {
		console.log('uploadTileCache()');
		console.log('\toptions.useOnlyCache : ' + this.options.useOnlyCache);
		console.log('\tlocal_tile_db_name : ' + this.local_tile_db_name);
		console.log('\tremote_tile_db_name : ' + this.remote_tile_db_name);

		if (this._local_db) {

			PouchDB.replicate(this.local_tile_db_name, this.remote_tile_db_name,
					{retry: false}
			).on('change', function (info) {
				// handle change
			}).on('paused', function (err) {
				// replication paused (e.g. replication up to date, user went offline)
			}).on('active', function () {
				// replicate resumed (e.g. new changes replicating, user went back online)
			}).on('denied', function (err) {
				// a document failed to replicate, e.g. due to permissions
			}).on('complete', function (info) {
				// handle complete
				console.log('pushTileCache complete!\n' + JSON.stringify(info, null, 2));
			}).on('error', function (err) {
				// handle error
				console.warn(err);
			});

		}

	},

  downloadTileCache : function() {
		console.log('downloadTileCache()');
		console.log('\toptions.useOnlyCache : ' + this.options.useOnlyCache);
		console.log('\tlocal_tile_db_name : ' + this.local_tile_db_name);
		console.log('\tremote_tile_db_name : ' + this.remote_tile_db_name);

		if (this._local_db) {

			PouchDB.replicate(this.remote_tile_db_name, this.local_tile_db_name,
					{retry: false}
			).on('change', function (info) {
				// handle change
			}).on('paused', function (err) {
				// replication paused (e.g. replication up to date, user went offline)
			}).on('active', function () {
				// replicate resumed (e.g. new changes replicating, user went back online)
			}).on('denied', function (err) {
				// a document failed to replicate, e.g. due to permissions
			}).on('complete', function (info) {
				// handle complete
				console.log('pullTileCache complete!\n' + JSON.stringify(info, null, 2));
			}).on('error', function (err) {
				// handle error
				console.warn(err);
			});

		}

	}


});


