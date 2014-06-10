/*jslint browser: true, unparam: true */

// Export a global module.
var tangelo = {};

(function ($) {
    "use strict";

    // Tangelo version number.
    tangelo.version = function () {
        return "0.2.0";
    };

    tangelo.identity = function (d) { return d; };

    tangelo.isNumber = function (value) {
        return typeof value === 'number';
    };

    tangelo.isBoolean = function (value) {
        return typeof value === 'boolean';
    };

    tangelo.isArray = function (value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    };

    tangelo.isObject = function (value) {
        return Object.prototype.toString.call(value) === '[object Object]';
    };

    tangelo.isString = function (value) {
        return Object.prototype.toString.call(value) === '[object String]';
    };

    tangelo.accessor = function (spec, defaultValue) {
        var parts;
        if (!spec) {
            return function () { return defaultValue; };
        }
        if (spec.value) {
            return function () { return spec.value; };
        }
        if (spec.field) {
            parts = spec.field.split(".");
            return function (d) {
                var i;
                for (i = 0; i < parts.length; i += 1) {
                    d = d[parts[i]];
                }
                return d;
            };
        }
        window.console.log("error: unknown accessor spec");
    };

    function hasNaN(values) {
        var hasnan = false;

        $.each(values, function (i, v) {
            if (isNaN(v)) {
                hasnan = true;
                return;
            }
        });

        return hasnan;
    }

    tangelo.appendFunction = function(f1, f2) {
        var that = this;
        if (!f1) {
            return f2;
        }
        if (!f2) {
            return f1;
        }
        return function () {
            f1.apply(that, arguments);
            f2.apply(that, arguments);
        };
    };

    // Check for the required version number.
    tangelo.requireCompatibleVersion = function (reqvstr) {
        var i,
            tanv,
            reqv,
            compatible;

        // Split the argument out into major, minor, and patch version numbers.
        reqv = reqvstr.split(".").map(function (x) { return +x; });

        // Check for: blank argument, too long argument, non-version-number
        // argument.
        if (reqv.length === 0 || reqv.length > 3 || hasNaN(reqv)) {
            throw "[tangelo.requireCompatibleVersion()] Illegal argument '" + reqvstr +  "'";
        }

        // Fill in any missing trailing values (i.e., "1.0" -> "1.0.0").
        for (i = reqv.length; i < 3; i += 1) {
            reqv[i] = 0;
        }

        // Split the Tangelo version number into major, minor, and patch level
        // as well.
        tanv = tangelo.version().split(".").map(function (x) { return +x; });

        // In order to be compatible above major version 0: (1) the major
        // versions MUST MATCH; (2) the required minor version MUST BE AT MOST
        // the Tangelo minor version number; and (3) the required patch level
        // MUST BE AT MOST the Tangelo patch level.
        //
        // For major version 0, in order to be compatible: (1) the major
        // versions MUST BOTH BE 0; (2) the minor versions MUST MATCH; (3) the
        // required patch level MUST BE AT MOST the Tangelo patch level.
        if (reqv[0] === 0) {
            compatible = tanv[0] === 0 && reqv[1] === tanv[1] && reqv[2] <= tanv[2];
        } else {
            compatible = reqv[0] === tanv[0] && reqv[1] <= tanv[1] && reqv[2] <= tanv[2];
        }

        return compatible;
    };

    // Initialization function that will handle tangelo-specific elements
    // automatically.
    $(function () {
        // Instantiate a navbar if there is an element marked as such.
        $("[data-tangelo-type=navbar]").navbar();

        // Instantiate a control panel if there is an element marked as such.
        $("[data-tangelo-type=control-panel]").controlPanel();
    });
}(window.$));
/*jslint browser: true */

/*globals jQuery, d3 */

(function ($) {
    "use strict";

    function drawerToggle(divsel, buttonsel) {
        var div,
            button,
            state,
            divheight,
            iconheight;

        // Use the selectors to grab the DOM elements.
        div = d3.select(divsel);
        button = d3.select(buttonsel);

        // Initially, the panel is open.
        state = 'uncollapsed';

        // The glyphicon halfings are around 22.875 pixels tall.
        iconheight = "23px";

        // Save the original height of the panel.
        // This requires a DOM update to do this correctly, so we wait a second.
        // I have found that waiting less than 200ms can cause undefined behavior,
        // since there may be other callback that need to populate the panel.
        function updateHeight() {
            divheight = $(div.node()).height() + "px";
        }
        window.setTimeout(updateHeight, 1000);

        // This function, when called, will toggle the state of the panel.
        return function () {
            if (state === 'uncollapsed') {
                div.transition()
                    .duration(500)
                    .style("height", iconheight);

                button.classed("icon-chevron-down", false)
                    .classed("icon-chevron-up", true);

                state = 'collapsed';
            } else if (state === 'collapsed') {
                div.transition()
                    .duration(500)
                    .style("height", divheight);

                button.classed("icon-chevron-down", true)
                    .classed("icon-chevron-up", false);

                state = 'uncollapsed';
            } else {
                throw "Illegal state: " + state;
            }
        };
    }

    $.fn.controlPanel = function () {
        var toggle,
            s;

        // Make a d3 selection out of the target element.
        s = d3.select(this[0]);

        // Bail out silently if the selection is empty.
        if (s.empty()) {
            return;
        }

        // Style the control panel div appropriately, then add a div as the
        // first child to act as the drawer handle (and place an appropriate
        // icon in the middle of it).
        s.attr("id", "tangelo-control-panel")
            .classed("control-panel", true)
            .insert("div", ":first-child")
                .attr("id", "tangelo-drawer-handle")
                .classed("centered", true)
                .classed("pointer", true)
                .classed("drawer", true)
                .append("i")
                    .attr("id", "tangelo-drawer-icon")
                    .classed("icon-chevron-down", true);

        toggle = drawerToggle("#tangelo-control-panel", "#tangelo-drawer-icon");
        d3.select("#tangelo-drawer-handle")
            .on("click", toggle);
    };
}(jQuery));
/*global tangelo */

(function () {
    "use strict";

    var month_names,
        day_names;

    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    tangelo.monthNames = function () {
        return month_names.slice();
    };

    tangelo.dayNames = function () {
        return day_names.slice();
    };

    // Date handling functions go in this submodule.
    tangelo.date = {};

    // Formats a date in the form "Oct 30, 1981 (05:31:00)"
    tangelo.date.toShortString = function (d) {
        var day,
            month,
            year,
            hour,
            minute,
            second;

        // Grab the date.
        day = d.getDate();
        month = d.getMonth();
        year = d.getFullYear();

        // Grab the time.
        hour = d.getHours();
        minute = d.getMinutes();
        second = d.getSeconds();

        // Pad the time components with a zero if they are smaller than 10.
        if (hour < 10) { hour = "0" + hour; }
        if (minute < 10) { minute = "0" + minute; }
        if (second < 10) { second = "0" + second; }

        return month_names[month] + " " + day + ", " + year + " (" + hour + ":" + minute + ":" + second + ")";
    };

    // Returns the shortened month name for a given Date object.
    tangelo.date.getMonthName = function (d) {
        return month_names[d.getMonth()];
    };

    // Returns the shortened day name for a given Date object.
    tangelo.date.getDayName = function (d) {
        return day_names[d.getDay()];
    };

    // Formats a date in the form "Oct 30, 1981"
    tangelo.date.displayDate = function (d) {
        return tangelo.monthNames()[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    };
}());
/*jslint browser: true */

/*global tangelo, google, d3, $ */

(function () {
    "use strict";

    if (!window.google) {
        tangelo.GoogleMapSVG = function () {
            throw "Use of the GoogleMapSVG class requires loading the Google Map API *before* loading Tangelo.";
        };
        return;
    }

    tangelo.GoogleMapSVG = function (elem, mapoptions, cfg, cont) {
        var that,
            idle,
            sel;

        // Obtain a unique id for this class.
        this.id = "gmsvg-" + tangelo.uniqueID();

        // Create a div element to put in the container element.
        this.mapdiv = d3.select(elem)
            .append("div")
            .attr("id", this.id)
            .style("width", $(elem).width() + "px")
            .style("height", $(elem).height() + "px")
            .node();

        // Create the map and place it in the "map div".
        this.map = new google.maps.Map(this.mapdiv, mapoptions);
        this.setMap(this.map);

        // Compute the size of the map div.
        this.size = {
            width: $(this.mapdiv).width(),
            height: $(this.mapdiv).height()
        };

        // When the map is dragged, resized, or zoomed, emit the appropriate
        // events and/or redraw the SVG layer.
        that = this;
        google.maps.event.addListener(this.map, "drag", function () {
            that.draw();
        });
        google.maps.event.addListener(this.map, "zoom_changed", function () {
            that.draw();
        });
        $(this.mapdiv).resize(function () {
            google.maps.event.trigger(this.map, "resize");
        });

        // Store the config for later use.
        this.cfg = cfg || {};

        // If a continuation function was passed, call it with the new object as
        // soon as the map is actually ready.
        if (cont) {
            google.maps.event.addListenerOnce(this.map, "idle", function () {
                cont(that);
            });
        }
    };

    // Enable the class to use Google Map overlays.
    tangelo.GoogleMapSVG.prototype = new google.maps.OverlayView();

    // Function to return the SVG DOM node, for generic manipulation.
    tangelo.GoogleMapSVG.prototype.getSVG = function () {
        return this.svg.node();
    };

    tangelo.GoogleMapSVG.prototype.getMap = function () {
        return this.map;
    };

    // This function is part of the overlay interface - it will be called when a
    // new map element is added to the overlay (as in the constructor function
    // above).
    tangelo.GoogleMapSVG.prototype.onAdd = function () {
        // Put an SVG element in the mouse target overlay.
        this.svg = d3.select(this.getPanes().overlayMouseTarget)
            .append("svg")
            .attr("width", this.size.width)
            .attr("height", this.size.height);

        // If the user supplied an initialization function, call it now.
        if (this.cfg.initialize) {
            this.cfg.initialize.call(this, this.svg.node(), this.getProjection(), this.map.getZoom());
        }

    };

    // This is called when the Google Map API decides to redraw the map, or when
    // the GoogleMapSVG interface needs the map redrawn.
    tangelo.GoogleMapSVG.prototype.draw = function () {
        var mattrans,
            xtrans,
            ytrans,
            setTimeout;

        // Find the matrix transform for the overlay.
        mattrans = d3.select("#" + this.id + " [style*='webkit-transform: matrix']")
            .style("-webkit-transform")
            .split(" ")
            .map(function (v, i) {
                var retval;

                if (i === 0) {
                    retval = v.slice("matrix(".length, -1);
                } else {
                    retval = v.slice(0, -1);
                }

                return retval;
            });

        // If the map is in the middle of a zooming transform, abort the draw
        // operation and try again in a little while.
        if (mattrans[0] !== "1" || mattrans[3] !== "1") {
            window.setTimeout(google.maps.event.trigger, 100, this.map, "drag");
            return;
        }

        // Extract the translation component.
        xtrans = mattrans[4];
        ytrans = mattrans[5];

        // Give the svg element an opposite transform to hold it in place.
        this.svg.style("-webkit-transform", "translate(" + (-xtrans) + "px," + (-ytrans) + "px)");

        // Call the user's draw method, if there is one.
        if (this.cfg.draw) {
            this.cfg.draw.call(this, this.svg.node(), this.getProjection(), this.map.getZoom());
        }
    };
}());
/*globals console, d3, jQuery, tangelo */

(function ($) {
    "use strict";

    $.fn.landingPage = function (cfg) {
        var specFile,
            appLeftSelector,
            appRightSelector,
            extLeftSelector,
            extRightSelector,
            container;

        // Pull values from the config object argument.
        specFile = cfg.specFile;
        appLeftSelector = cfg.appLeftSelector;
        appRightSelector = cfg.appRightSelector;
        extLeftSelector = cfg.extLeftSelector;
        extRightSelector = cfg.extRightSelector;

        // Create a d3 selection out of the target element.
        container = d3.select(this[0]);

        // Retrieve the contents of the specification file, then build up the
        // page.
        d3.json(specFile, function (err, spec) {
            var app,
                apps,
                col,
                cols,
                external,
                i,
                left,
                right,
                text;

            if (err !== null) {
                console.log("fatal error: could not load app list from " + specFile);
                return;
            }

            // Pull out the two lists in the specification - one for the list of
            // apps, and one for the list of external links.
            apps = spec.apps;
            external = spec.external;

            if (apps !== undefined) {
                if (!tangelo.allDefined(appLeftSelector, appRightSelector)) {
                    throw "Required config argument property appLeftSelector or appRightSelector missing!";
                }

                // Grab a reference to each of the two index columns.
                left = container.select(appLeftSelector);
                right = container.select(appRightSelector);
                cols = [left, right];

                // Place the app info/links into the two columns, alternating
                // between left and right.
                for (i = 0; i < apps.length; i = i + 1) {
                    col = cols[i % 2];
                    app = apps[i];

                    col.append("a")
                        .attr("href", app.path)
                        .append("h4")
                        .html(app.name);
                    col.append("p")
                        .html(app.description);
                }
            }

            if (external !== undefined) {
                if (!tangelo.allDefined(extLeftSelector, extRightSelector)) {
                    throw "Required config argument property extLeftSelector or extRightSelector missing!";
                }

                // List out the external links in the two columns, as above.
                left = container.select(extLeftSelector);
                right = container.select(extRightSelector);
                cols = [left, right];
                text = function (d) {
                    return "<a href=\"" + d.link + "\">" + "<strong>" + d.name + "</strong>" + "</a>" +
                        " (<a href=\"" + d.institution_link + "\">" + d.institution + "</a>) - " +
                        d.description;
                };
                for (i = 0; i < external.length; i = i + 1) {
                    col = cols[i % 2];
                    app = external[i];

                    col.append("div")
                        .html(text(app));
                }
            }
        });
    };
}(jQuery));
/*jslint browser: true */

/*globals d3, jQuery */

(function ($) {
    "use strict";

    $.fn.navbar = function (cfg) {
        var footer,
            items,
            item,
            i,
            navbar_inner,
            modal,
            oktext,
            selection,
            type,
            ul,
            x,
            s,
            brand,
            app,
            onConfigSave,
            onConfigLoad,
            onConfigDefault;

        // If no configuration was passed in, emulate an empty configuration
        // object.
        cfg = cfg || {};

        // Create a d3 selection out of the target element.
        s = d3.select(this[0]);

        // Bail out silently if the selection is empty.
        if (s.empty()) {
            return;
        }

        // Convert the top-level element into a bootstrap navbar element,
        // then embed a "navbar-inner" div within it.
        navbar_inner = s.classed("navbar", true)
            .classed("navbar-fixed-top", true)
            .append("div")
                .classed("navbar-inner", true);

        // Create a "brand" item if requested.
        brand = s.attr("data-tangelo-brand") || cfg.brand;
        if (brand !== null) {
            navbar_inner.append("a")
                .classed("brand", true)
                .attr("href", s.attr("data-tangelo-brand-href"))
                .text(brand);
        }

        // Create an unordered list for holding the navbar contents.
        ul = navbar_inner.append("ul")
                .classed("nav", true);

        // Create an app name item if requested.
        app = s.attr("data-tangelo-app") || cfg.app;
        if (app !== null) {
            ul.append("li")
                .classed("active", true)
                .append("a")
                    .text(app);
        }

        // Each top-level div inside the navbar div represents list-item
        // content for the navbar.  One by one, handle them as necessary and
        // add an appropriate li to the list.
        //
        // Start by forming an array of single-element selections out of the
        // full list.
        items = s.selectAll("[data-tangelo-type]")[0].map(d3.select);

        // Go through and check the type field, taking approriate action for
        // each.
        for (i = 0; i < items.length; i += 1) {
            item = items[i];
            type = item.attr("data-tangelo-type");

            if (type === "info") {
                ul.append("li")
                    .append("a")
                    .classed("pointer", true)
                    .attr("data-toggle", "modal")
                    .attr("data-target", "#tangelo-info-panel")
                    .html("<i class=icon-info-sign></i> Info");

                modal = d3.select(document.body)
                    .insert("div", ":first-child")
                    .attr("id", "tangelo-info-panel")
                    .classed("modal", true)
                    .classed("hide", true)
                    .classed("fade", true);

                x = modal.append("div")
                    .classed("modal-header", true);
                x.append("button")
                    .attr("type", "button")
                    .classed("close", true)
                    .attr("data-dismiss", "modal")
                    .attr("aria-hidden", true)
                    .html("&times;");
                x.append("h3")
                    .text("Information");

                modal.append("div")
                    .classed("modal-body", true)
                    .html(item.html());

                oktext = item.attr("data-tangelo-ok-button") || "";
                modal.append("div")
                    .classed("modal-footer", true)
                    .append("a")
                        .classed("btn", true)
                        .attr("data-dismiss", "modal")
                        .text(oktext === "" ? "OK" : oktext);

                item.remove();

            } else if (type === "config") {
                ul.append("li")
                    .append("a")
                    .classed("pointer", true)
                    .attr("data-toggle", "modal")
                    .attr("data-target", "#tangelo-config-panel")
                    .html("<i class=icon-cog></i> Config");

                modal = d3.select(document.body)
                    .insert("div", ":first-child")
                    .attr("id", "tangelo-config-panel")
                    .classed("modal", true)
                    .classed("hide", true)
                    .classed("fade", true);

                x = modal.append("div")
                    .classed("modal-header", true);
                x.append("button")
                    .attr("type", "button")
                    .classed("close", true)
                    .attr("data-dismiss", "modal")
                    .attr("aria-hidden", true)
                    .html("&times;");
                x.append("h3")
                    .text("Configuration");

                modal.append("div")
                    .classed("modal-body", true)
                    .html(item.html());

                oktext = item.attr("data-tangelo-cancel-button") || "";
                footer = modal.append("div")
                    .classed("modal-footer", true);
                footer.append("a")
                    .attr("id", "tangelo-config-cancel")
                    .classed("btn", true)
                    .attr("data-dismiss", "modal")
                    .text(oktext === "" ? "Cancel" : oktext);
                footer.append("a")
                    .attr("id", "tangelo-config-defaults")
                    .classed("btn", true)
                    .text("Defaults");
                footer.append("a")
                    .attr("id", "tangelo-config-submit")
                    .classed("btn", true)
                    .classed("btn-primary", true)
                    .attr("data-dismiss", "modal")
                    .text(oktext === "" ? "Save changes" : oktext);

                item.remove();
            } else if (type === "other") {
                // TODO(choudhury): implement this code path.
                throw "navbar item type 'other' currently unimplemented";
            } else {
                throw "unknown navbar item type '" + type + "'";
            }
        }

        // Emplace callbacks if specified.
        onConfigSave = s.attr("data-config-save") || cfg.onConfigSave;
        if (typeof onConfigSave === "string") {
            onConfigSave = window[onConfigSave];
        }
        if (onConfigSave) {
            d3.select("#tangelo-config-submit")
                .on("click.tangelo", onConfigSave);
        }

        onConfigLoad = s.attr("data-config-load") || cfg.onConfigLoad;
        if (typeof onConfigLoad === "string") {
            onConfigLoad = window[onConfigLoad];
        }
        if (onConfigLoad) {
            $("#tangelo-config-panel")
                .on("show.tangelo", onConfigLoad);
        }

        onConfigDefault = s.attr("data-config-default") || cfg.onConfigDefault;
        if (typeof onConfigDefault === "string") {
            onConfigDefault = window[onConfigDefault];
        }
        if (onConfigDefault) {
            d3.select("#tangelo-config-defaults")
                .on("click.tangelo", onConfigDefault);
        }
    };
}(jQuery));
/*jslint browser: true, unparam: true */
/*globals d3, $, console */

(function (tangelo) {
    "use strict";

    function resolveMain(specRoot, doneRoot, changed, ids) {
        function resolve(spec, done) {
            var s,
                first,
                prop,
                hasProps = false,
                rest = {},
                deps,
                value,
                i;

            ids = ids || {};

            if (tangelo.isString(spec) || tangelo.isNumber(spec) || tangelo.isBoolean(spec)) {
                done(spec);
            } else if (tangelo.isObject(spec)) {
                // Perform shortcut if there are no dependencies on what changed
                if (changed && spec["@"] && spec["@"].deps && !spec["@"].deps.hasOwnProperty(changed) && spec.id !== changed) {
                    done(spec["@"].current, deps);
                } else if (spec.hasOwnProperty("@extract")) {
                    s = spec["@extract"];
                    resolve(s.from, function (part, deps) {
                        var i, fields = s.field.split(".");
                        for (i = 0; i < fields.length; i += 1) {
                            part = part[fields[i]];
                        }
                        done(part, deps);
                    });
                } else if (spec.hasOwnProperty("@url")) {
                    s = spec["@url"];
                    resolve(s, function (url, deps) {
                        d3.json(url, function (error, part) {
                            done(part, deps);
                        });
                    });
                } else if (spec.hasOwnProperty("@json")) {
                    s = spec["@json"];
                    resolve(s, function (data, deps) {
                        done(JSON.stringify(data), deps);
                    });
                } else if (spec.hasOwnProperty("@join")) {
                    s = spec["@join"];
                    resolve(s, function (arr, deps) {
                        done(arr.join(""), deps);
                    });
                } else if (spec.hasOwnProperty("@concat")) {
                    s = spec["@concat"];
                    resolve(s, function (arr, deps) {
                        done([].concat.apply([], arr), deps);
                    });
                } else if (spec.hasOwnProperty("@view")) {
                    s = spec["@view"];
                    resolve(s.spec, function (attr, deps) {
                        var i, fields = s.constructor.split("."), cons = window;
                        for (i = 0; i < fields.length; i += 1) {
                            cons = cons[fields[i]];
                        }
                        if (changed && spec["@"]) {
                            spec["@"].current.update(attr);
                        } else {
                            spec["@"] = {current: cons(attr)};
                        }
                        done(spec["@"].current, deps);
                    });
                } else if (spec.hasOwnProperty("@ref")) {
                    s = spec["@ref"].split(".");
                    deps = $.extend(true, {}, ids[s[0]]["@"].deps);
                    deps[s[0]] = true;
                    value = ids[s[0]]["@"].current;
                    for (i = 1; i < s.length; i += 1) {
                        value = value[s[i]];
                    }
                    done(value, deps);
                } else if (spec.hasOwnProperty("@update")) {
                    s = spec["@update"];
                    done(function (value) {
                        var d;
                        for (d in value) {
                            if (value.hasOwnProperty(d)) {
                                ids[s][d] = value[d];
                            }
                        }
                        resolveMain(specRoot, undefined, s, ids);
                    }, deps);
                } else {
                    for (prop in spec) {
                        if (spec.hasOwnProperty(prop) && prop !== "@") {
                            if (hasProps === false) {
                                hasProps = true;
                                first = prop;
                            } else {
                                rest[prop] = spec[prop];
                            }
                        }
                    }
                    if (hasProps) {
                        resolve(spec[first], function (firstData, firstDeps) {
                            resolve(rest, function (restData, restDeps) {
                                var deps, d;

                                restData[first] = firstData;
                                if (restData.hasOwnProperty("id")) {
                                    ids[restData.id] = spec;
                                }

                                deps = $.extend(true, {}, firstDeps);
                                for (d in restDeps) {
                                    if (restDeps.hasOwnProperty(d)) {
                                        deps[d] = restDeps[d];
                                    }
                                }

                                spec["@"] = {
                                    current: restData,
                                    deps: deps
                                };
                                done(restData, deps);
                            });
                        });
                    } else {
                        done({}, {});
                    }
                }
            } else if (tangelo.isArray(spec)) {
                if (spec.length === 0) {
                    done([]);
                } else {
                    resolve(spec[0], function (car, carDeps) {
                        resolve(spec.slice(1), function (cdr, cdrDeps) {
                            var deps, d;
                            cdr.unshift(car);
                            deps = $.extend(true, {}, carDeps);
                            for (d in cdrDeps) {
                                if (cdrDeps.hasOwnProperty(d)) {
                                    deps[d] = cdrDeps[d];
                                }
                            }
                            done(cdr, deps);
                        });
                    });
                }
            } else {
                console.log("error: unexpected data");
            }
        }
        resolve(specRoot, doneRoot || function () { return null; });
    }

    tangelo.resolve = resolveMain;
}(window.tangelo));/*globals jQuery, d3 */

(function ($) {
    "use strict";

    $.fn.svgColorLegend = function (cfg) {
        var bbox,
            bg,
            bottom,
            height,
            heightfunc,
            left,
            maxheight,
            maxwidth,
            right,
            text,
            top,
            totalheight,
            totalwidth,
            width,
            legend,
            cmap_func,
            xoffset,
            yoffset,
            categories,
            height_padding,
            width_padding,
            text_spacing,
            legend_margins,
            clear;

        // Extract arguments from the config argument.
        cmap_func = cfg.cmap_func;
        xoffset = cfg.xoffset;
        yoffset = cfg.yoffset;
        categories = cfg.categories;
        height_padding = cfg.height_padding;
        width_padding = cfg.width_padding;
        text_spacing = cfg.text_spacing;
        legend_margins = cfg.legend_margins;
        clear = cfg.clear;

        // Create a d3 selection from the selection.
        legend = d3.select(this[0]);

        // Clear the svg element, if requested.
        clear = clear || false;
        if (clear) {
            legend.selectAll("*").remove();
        }

        maxwidth = 0;
        maxheight = 0;

        // Place a rect that will serve as a container/background for the legend
        // list items.  Leave its dimensions undefined for now (they will be
        // computed from the size of all the elements later).
        bg = legend.append("rect")
            //.style("fill", "gray");
            .style("fill", "white")
            .style("opacity", 0.7);

        $.each(categories, function (i, d) {
            legend.append("rect")
                .classed("colorbox", true)
                .attr("x", xoffset)
                // "y", "width", and "height" intentionally left unset
                .style("fill", cmap_func(d));

            text = legend.append("text")
                .classed("legendtext", true)
                // "x" and "y" intentionally left unset
                .text(d);

            // Compute the max height and width out of all the text bgs.
            bbox = text[0][0].getBBox();

            if (bbox.width > maxwidth) {
                maxwidth = bbox.width;
            }

            if (bbox.height > maxheight) {
                maxheight = bbox.height;
            }
        });

        // Compute the height and width of each color swatch.
        height = maxheight + height_padding;
        width = height;

        // Compute the total height and width of all the legend items together.
        totalheight = height * categories.length;
        totalwidth = width + width_padding + maxwidth;

        // Get the user-supplied margin values.
        left = legend_margins.left || 0;
        top = legend_margins.top || 0;
        right = legend_margins.right || 0;
        bottom = legend_margins.bottom || 0;

        // Set the dimensions of the container rect, based on the height/width of
        // all the items, plus the user supplied margins.
        bg.attr("x", xoffset - left || 0)
            .attr("y", yoffset - top || 0)
            .attr("width", left + totalwidth + right)
            .attr("height", top + totalheight + bottom);

        heightfunc = function (d, i) {
            return yoffset + i * height;
        };

        legend.selectAll(".colorbox")
            .attr("width", height)
            .attr("height", height)
            .attr("y", heightfunc);

        legend.selectAll(".legendtext")
            .attr("x", xoffset + width + width_padding)
            .attr("y", function (d, i) {
                //return 19 + heightfunc(d, i);
                return text_spacing + heightfunc(d, i);
            });
    };
}(jQuery));
/*jslint */

/*global tangelo, d3, console, $ */

(function () {
    "use strict";

    tangelo.getMongoRange = function (host, db, coll, field, callback) {
        var min,
            max,
            mongourl;

        // The base URL for both of the mongo service queries.
        mongourl = "/service/mongo/" + host + "/" + db + "/" + coll;

        // Fire an ajax call to retrieve the maxmimum value.
        $.ajax({
            url: mongourl,
            data: {
                sort: JSON.stringify([[field, -1]]),
                limit: 1,
                fields: JSON.stringify([field])
            },
            dataType: "json",
            success: function (response) {
                // If the value could not be retrieved, set it to null and print
                // an error message on the console.
                if (response.error !== null || response.result.data.length === 0) {
                    max = null;

                    if (response.error !== null) {
                        throw "[tangelo.getMongoRange()] error: could not retrieve max value from " + host + ":/" + db + "/" + coll + ":" + field;
                    }
                } else {
                    max = response.result.data[0][field];
                }

                // Fire a second query to retrieve the minimum value.
                $.ajax({
                    url: mongourl,
                    data: {
                        sort: JSON.stringify([[field, 1]]),
                        limit: 1,
                        fields: JSON.stringify([field])
                    },
                    dataType: "json",
                    success: function (response) {
                        // As before, set the min value to null if it could not
                        // be retrieved.
                        if (response.error !== null || response.result.data.length === 0) {
                            min = null;

                            if (response.error !== null) {
                                throw "[tangelo.getMongoRange()] error: could not retrieve min value from " + host + ":/" + db + "/" + coll + ":" + field;
                            }
                        } else {
                            min = response.result.data[0][field];
                        }

                        // Pass the range to the user callback.
                        callback(min, max);
                    }
                });
            }
        });
    };

    // Returns true if all arguments are defined; false otherwise.
    tangelo.allDefined = function () {
        var i;

        for (i = 0; i < arguments.length; i += 1) {
            if (arguments[i] === undefined) {
                return false;
            }
        }

        return true;
    };

    // Returns a key-value store containing the configuration options encoded in
    // the inputfile.
    tangelo.defaults = function (inputfile, callback) {
        // If there is a problem with the file, it may be that it is not
        // expected to be there at all, so silently supply an empty defaults
        // table.  The err argument is passed in case the client WAS expecting
        // the defaults file to be read in, and wants to examine the error.
        d3.json(inputfile, function (err, json) {
            callback(json || {}, err);
        });
    };

    // Returns a unique ID for use as, e.g., ids for dynamically generated html
    // elements, etc.
    tangelo.uniqueID = (function () {
        var ids = {"": true};
        var letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

        return function (n) {
            var id = "",
                i;

            n = n || 6;

            while (id in ids) {
                id = "";
                for (i = 0; i < n; i += 1) {
                    id += letters[Math.floor(Math.random() * 52)];
                }
            }

            ids[id] = true;

            return id;
        };
    }());
}());
/*jslint browser: true */
window.tangelo.ui = {};
/*jslint browser: true */
window.tangelo.data = {};
/*jslint browser: true */

(function (tangelo) {
    "use strict";

    tangelo.data.tree = function(spec) {
        var id = tangelo.accessor(spec.id, ""),
            idChild = tangelo.accessor(spec.idChild, ""),
            children = tangelo.accessor(spec.children, []),
            data = spec.data,
            nodeMap = {},
            root;

        data.forEach(function (d) {
            nodeMap[id(d)] = d;
        });

        data.forEach(function (d) {
            if (children(d)) {
                d.children = [];
                children(d).forEach(function (c) {
                    var child = nodeMap[idChild(c)];
                    child.hasParent = true;
                    d.children.push(child);
                });
            }
        });

        data.forEach(function (d) {
            if (!d.hasParent) {
                root = d;
            }
            delete d.hasParent;
        });

        return root;
    };

}(window.tangelo));
/*jslint browser: true */

(function (tangelo, d3) {
    "use strict";

    tangelo.ui.html = function (spec) {
        var that = {};

        d3.select(spec.el).html(spec.content);

        function update() {
            return that;
        }

        that.update = update;

        return that;
    };

}(window.tangelo, window.d3));/*jslint browser: true, unparam: true */

(function (tangelo, d3, $) {
    "use strict";

    tangelo.ui.rangeslider = function (spec) {
        var low, high, main, values, el, that = {};

        el = d3.select(spec.el)
            .style("padding", "0px 20px 10px 20px");
        if (spec.heading) {
            el.append("h4").text(spec.heading);
        }
        main = $(el.append("div").node());
        low = el.append("div").classed("code", true);
        high = el.append("div").classed("code", true);

        values = [spec.value.min, spec.value.max];

        function displayFunc(values) {
            if (spec.date) {
                low.html(tangelo.date.toShortString(new Date(values[0])));
                high.html(tangelo.date.toShortString(new Date(values[1])));
            } else {
                low.html(values[0]);
                high.html(values[1]);
            }
        }

        main.dragslider({
            range: true,
            rangeDrag: true,

            min: spec.range.min,
            max: spec.range.max,
            values: values,

            change: function (evt, ui) {
                displayFunc(ui.values);
                if (spec.on && spec.on.change) {
                    spec.on.change({min: ui.values[0], max: ui.values[1]});
                }
            },

            slide: function (evt, ui) {
                displayFunc(ui.values);
            }
        });
        displayFunc(values);

        that.update = function (updatedSpec) {
            return that;
        };

        return that;
    };

}(window.tangelo, window.d3, window.$));/*jslint browser: true */

(function (tangelo, d3, $) {
    "use strict";

    tangelo.ui.select = function (spec, root, data) {
        var select = root.append("select"),
            d = data[spec.data],
            numeric;

        spec.label = spec.label || d.key;

        numeric = tangelo.isNumber(d.active);

        select.selectAll("option")
            .data(d.value)
            .enter().append("option")
            .attr("value", function (dd) { return dd[d.key]; })
            .text(function (dd) { return dd[spec.label]; });
        $(select.node()).val(d.active);
        $(select.node()).change(function () {
            d.active = $(this).val();
            if (numeric) {
                d.active = +d.active;
            }
            if (spec.app) {
                spec.app.reset();
            }
        });
    };

}(window.tangelo, window.d3, window.$));/*jslint browser: true */

(function (tangelo, d3, $) {
    "use strict";

    tangelo.ui.split = function () {
        var vertical;

        vertical = false;

        function my(selection) {
            selection.each(function () {
                var main = d3.select(this).classed("pane", false);
                main.append("div").classed("p1", true);//.classed("pane", true);
                main.append("div").classed("p2", true);//.classed("pane", true);
                $(main.node()).splitter({
                    type: vertical ? "v" : "h",
                    outline: true,
                    resizeToWidth: true
                });
            });
        }

        my.vertical = function(value) {
            if (!arguments.length) {
                return vertical;
            }
            vertical = value;
            return my;
        };

        return my;
    };

}(window.tangelo, window.d3, window.$));/*jslint browser: true */
window.tangelo.vis = {};
/*jslint browser: true, unparam: true, nomen: true */

(function (tangelo, d3) {
    "use strict";

    tangelo.vis.dendrogram = function (spec) {
        var label = tangelo.accessor(spec.label, ""),
            distance = tangelo.accessor(spec.distance, 1),
            id = tangelo.accessor(spec.id, 0),
            that = this,
            margin = {top: 20, right: 120, bottom: 20, left: 120},
            nodeLimit = spec.nodeLimit,
            width = 1200 - margin.right - margin.left,
            height = 800 - margin.top - margin.bottom,
            duration = 750,
            root = spec.root || spec.data,
            data = spec.data,
            mode = spec.mode || "hide",
            tree = d3.layout.partition()
                .size([height, width])
                .value(function () { return 1; })
                .sort(d3.ascending),
            line = d3.svg.line()
                .interpolate("step-before")
                .x(function (d) { return d.y; })
                .y(function (d) { return d.x; }),
            svg = d3.select(spec.el).append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        root.x0 = height / 2;
        root.y0 = 0;

        function firstChild(d) {
            if (d.children) {
                return firstChild(d.children[0]);
            }
            if (d._children) {
                return firstChild(d._children[0]);
            }
            return d;
        }

        function lastChild(d) {
            if (d.children) {
                return lastChild(d.children[d.children.length - 1]);
            }
            if (d._children) {
                return lastChild(d._children[d._children.length - 1]);
            }
            return d;
        }

        function update(specUpdate) {
            specUpdate = specUpdate || {};
            mode = specUpdate.mode || mode;
            root = specUpdate.root || specUpdate.data || root;
            data = specUpdate.data || data;
            nodeLimit = specUpdate.nodeLimit || nodeLimit;
            distance = specUpdate.distance ? tangelo.accessor(specUpdate.distance, 1) : distance;

            root.x0 = height / 2;
            root.y0 = 0;

            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse(),
                links = tree.links(nodes),
                source = specUpdate.source || root,
                node,
                nodeEnter,
                nodeUpdate,
                nodeExit,
                link,
                maxY,
                visibleLeaves,
                filteredNodes,
                filteredLinks;

            visibleLeaves = 0;
            function setPosition(node, pos) {
                var xSum = 0;
                node.y = pos;
                node.x = node.x + node.dx / 2;
                if (!node.parent) {
                    node.parent = node;
                }
                if (node.children) {
                    node.children.forEach(function (d) {
                        d.parent = node;
                        setPosition(d, pos + 10 * distance(d));
                        xSum += d.x;
                    });
                    node.x = xSum / node.children.length;
                } else {
                    visibleLeaves += 1;
                }
            }
            setPosition(root, 0);

            // Normalize Y to fill space
            maxY = d3.extent(nodes, function (d) { return d.y; })[1];
            nodes.forEach(function (d) {
                d.y = d.y / maxY * (width - 150);
            });

            if (nodeLimit && nodes.length > nodeLimit) {
                // Filter out everything beyond parent y-position to keep things interactive
                nodes.sort(function (a, b) { return d3.ascending(a.parent.y, b.parent.y); });
                nodes.forEach(function (d, i) { d.index = i; });
                filteredNodes = nodes.slice(0, nodeLimit);
                maxY = filteredNodes[filteredNodes.length - 1].parent.y;
                filteredNodes.forEach(function (d) {
                    d.y = d.y > maxY ? maxY : d.y;
                });

                // Filter the links based on visible nodes
                filteredLinks = [];
                links.forEach(function (d) {
                    if (d.source.index < nodeLimit && d.target.index < nodeLimit) {
                        filteredLinks.push(d);
                    }
                });
                nodes = filteredNodes;
                links = filteredLinks;
            }

            // Toggle children on click.
            function click(d) {
                if (mode === "hide") {
                    if (d.children) {
                        d._children = d.children;
                        d.children = null;
                    } else {
                        d.children = d._children;
                        d._children = null;
                    }
                } else if (mode === "focus") {
                    root = d;
                } else if (mode === "label") {
                    d.showLabel = d.showLabel ? false : true;
                }
                update({source: d});
            }

            // Update the nodes…
            node = svg.selectAll("g.node")
                .data(nodes, function(d) { return id(d); });

            // Enter any new nodes at the parent's previous position.
            nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", function() { return "translate(" + source.y0 + "," + source.x0 + ")"; })
                .on("click", click);

            nodeEnter.append("circle")
                .attr("r", 1e-6)
                .style("stroke", "none")
                .style("opacity", function(d) { return d._children ? 1 : 0; })
                .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

            nodeEnter.append("text")
                .attr("x", 10)
                .attr("dy", ".35em")
                .attr("text-anchor", "start")
                .style("font-size", "10px")
                .text(label)
                .style("fill-opacity", 1e-6);

            // Transition nodes to their new position.
            nodeUpdate = node.transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

            nodeUpdate.select("circle")
                .attr("r", 7.5)
                .style("opacity", function(d) { return d._children ? 1 : 0; })
                .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

            nodeUpdate.select("text")
                .text(function (d) {
                    if (d._children || (d.children && d.showLabel)) {
                        return label(firstChild(d)) + " ... " + label(lastChild(d));
                    }
                    if (visibleLeaves < height / 8) {
                        return label(d);
                    }
                    return "";
                })
                .style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", function() { return "translate(" + source.y + "," + source.x + ")"; })
                .remove();

            nodeExit.select("circle")
                .attr("r", 1e-6);

            nodeExit.select("text")
                .style("fill-opacity", 1e-6);

            // Update the links…
            link = svg.selectAll("path.link")
                .data(links, function(d) { return id(d.target); });

            // Enter any new links at the parent's previous position.
            link.enter().insert("path", "g")
                .attr("class", "link")
                .style("stroke", "black")
                .style("stroke-width", "1px")
                .style("fill", "none")
                .attr("d", function() {
                    var o = {x: source.x0, y: source.y0};
                    //return diagonal({source: o, target: o});
                    return line([o, o]);
                });

            // Transition links to their new position.
            link.transition()
                .duration(duration)
                .attr("d", function (d) {
                    return line([d.source, d.target]);
                });

            // Transition exiting nodes to the parent's new position.
            link.exit().transition()
                .duration(duration)
                .attr("d", function() {
                    var o = {x: source.x, y: source.y};
                    return line([o, o]);
                })
                .remove();

            // Stash the old positions for transition.
            nodes.forEach(function(d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        function download(format) {
            if (format === "pdf") {
                var node = svg.selectAll("g.node").select("circle")
                    .attr("r", function (d) { return d._children ? 7.5 : 0; }),
                    s = new window.XMLSerializer(),
                    d = d3.select("svg").node(),
                    str = s.serializeToString(d);

                // Change back to normal
                node.attr("r", 7.5);

                d3.json("/service/svg2pdf").send("POST", str, function (error, data) {
                    window.location = "/service/svg2pdf?id=" + data.result;
                });
            } else {
                window.alert("Unsupported export format type: " + format);
            }
        }

        function reset() {
            function unhideAll(d) {
                if (!d.children) {
                    d.children = d._children;
                    d._children = null;
                }
                if (d.children) {
                    d.children.forEach(unhideAll);
                }
            }
            unhideAll(data);
            update({root: data});
        }

        update();

        that.update = update;
        that.reset = reset;
        that.download = download;

        return that;
    };

}(window.tangelo, window.d3));
/*jslint browser: true, unparam: true */

(function (tangelo, vg) {
    "use strict";

    tangelo.vis.geodots = function (spec) {
        var latitude,
            longitude,
            size,
            color,
            data,
            vis,
            that = {};

        function update(spec) {
            latitude = tangelo.accessor(spec.latitude, 0);
            longitude = tangelo.accessor(spec.longitude, 0);
            size = tangelo.accessor(spec.size, 20);
            color = tangelo.accessor(spec.color, 0);
            data = spec.data;
            data.forEach(function (d) {
                d.latitude = latitude(d);
                d.longitude = longitude(d);
                d.size = size(d);
                d.color = color(d);
            });
            vis({el: spec.el, data: {table: data, links: []}}).update();
            return that;
        }

        vg.parse.spec("/vega/geonodelink.json", function (chart) {
            vis = chart;
            update(spec);
        });

        that.update = update;

        return that;
    };

}(window.tangelo, window.vg));/*jslint browser: true, unparam: true */

(function (tangelo, d3, vg) {
    "use strict";

    tangelo.vis.geonodelink = function (spec) {
        var nodeLatitude = tangelo.accessor(spec.nodeLatitude, 0),
            nodeLongitude = tangelo.accessor(spec.nodeLongitude, 0),
            nodeSize = tangelo.accessor(spec.nodeSize, 20),
            nodeColor = tangelo.accessor(spec.nodeColor, 0),
            linkColor = tangelo.accessor(spec.linkColor, 0),
            linkSource = tangelo.accessor(spec.linkSource, 0),
            linkTarget = tangelo.accessor(spec.linkTarget, 0),
            data = spec.data,
            that = {};

        data.nodes.forEach(function (d) {
            d.latitude = nodeLatitude(d);
            d.longitude = nodeLongitude(d);
            d.size = nodeSize(d);
            d.color = nodeColor(d);
        });
        data.links.forEach(function (d) {
            d.color = linkColor(d);
            d.source = linkSource(d);
            d.target = linkTarget(d);
        });
        vg.parse.spec("/vega/geonodelink.json", function (chart) {
            chart({el: spec.el, data: {table: data.nodes, links: data.links}}).update();
        });

        function update(spec) {
            return that;
        }

        that.update = update;
        return that;
    };

}(window.tangelo, window.d3, window.vg));
/*jslint browser: true, unparam: true */

(function (tangelo, google, d3, $) {
    "use strict";

    tangelo.vis.mapdots = function (spec) {
        var hoverContent = function (d) { return ""; },
            size = tangelo.accessor(spec.size, 1),
            color = tangelo.accessor(spec.color, ""),
            latitude = tangelo.accessor(spec.latitude, 0),
            longitude = tangelo.accessor(spec.longitude, 0),
            opacity = tangelo.accessor(spec.opacity, 1),
            on = {},
            el = spec.el,
            that = {},
            map,
            overlay,
            data = spec.data;

        map = new google.maps.Map(d3.select(el).node(), {
            zoom: 2,
            center: new google.maps.LatLng(0, 0),
            mapTypeId: google.maps.MapTypeId.TERRAIN
        });

        d3.select(el).classed("gmap", true)
            .style("width", "100%")
            .style("height", "100%");
        $(el).resize(function () { google.maps.event.trigger(map, "resize"); });

        overlay = new google.maps.OverlayView();

        // Add the container when the overlay is added to the map.
        overlay.onAdd = function() {
            var layer, colorScale, sizeScale;

            layer = d3.select(this.getPanes().overlayMouseTarget).append("div")
                .style("position", "absolute");
            //colorScale = d3.scale.linear().domain(d3.extent(data, function (item) { return item[color]; })).range(["white", "red"]);
            colorScale = d3.scale.category20();
            sizeScale = d3.scale.sqrt()
                .domain(d3.extent(data, size))
                .range([5, 15]);

            // Draw each marker as a separate SVG element.
            // We could use a single SVG, but what size would it have?
            overlay.draw = function() {
                var projection = this.getProjection(),
                    marker;

                function transform(d) {
                    var s = sizeScale(size(d));
                    d = new google.maps.LatLng(latitude(d), longitude(d));
                    d = projection.fromLatLngToDivPixel(d);
                    return d3.select(this)
                        .style("left", (d.x - s - 2) + "px")
                        .style("top", (d.y - s - 2) + "px")
                        .style("width", (2 * s + 4) + "px")
                        .style("height", (2 * s + 4) + "px");
                }

                marker = layer.selectAll("svg")
                    .data(data)
                    .each(transform) // update existing markers
                    .enter().append("svg:svg")
                    .each(transform)
                    .attr("class", "marker")
                    .style("cursor", "crosshair")
                    .style("position", "absolute")
                    .on("click", on.click);

                // Add a circle.
                marker.append("svg:circle")
                    .attr("r", function (d) { return sizeScale(size(d)); })
                    .attr("cx", function (d) { return sizeScale(size(d)) + 2; })
                    .attr("cy", function (d) { return sizeScale(size(d)) + 2; })
                    .style("fill", function (d) { return colorScale(color(d)); })
                    .style("opacity", function (d) { return opacity(d); })
                    .each(function (d) {
                        var cfg, content = hoverContent(d);
                        if (!content) {
                            return;
                        }
                        cfg = {
                            html: true,
                            container: "body",
                            placement: "top",
                            trigger: "hover",
                            content: hoverContent(d),
                            delay: {
                                show: 0,
                                hide: 0
                            }
                        };
                        $(this).popover(cfg);
                    });
            };
        };

        that.update = function(spec) {
            return that;
        };

        // Bind our overlay to the map…
        overlay.setMap(map);

        return that;
    };
}(window.tangelo, window.google, window.d3, window.$));/*jslint browser: true */

(function (tangelo, d3) {
    "use strict";

    tangelo.vis.nodelink = function (spec) {
        var colorScale,
            sizeScale,
            nodeColor = tangelo.accessor(spec.nodeColor, "steelblue"),
            nodeSize = tangelo.accessor(spec.nodeSize, 10),
            nodeLabel = tangelo.accessor(spec.nodeLabel, undefined),
            linkSource = tangelo.accessor(spec.linkSource, 0),
            linkTarget = tangelo.accessor(spec.linkTarget, 0),
            width = spec.width || 1000,
            height = spec.height || 1000,
            force,
            svg,
            link,
            node,
            data = spec.data,
            that = {};

        data.links.forEach(function (d) {
            d.source = linkSource(d);
            d.target = linkTarget(d);
        });

        colorScale = d3.scale.category20();
        sizeScale = d3.scale.sqrt()
            .domain(d3.extent(data.nodes, function (d) { return nodeSize(d); }))
            .range([5, 15]);

        force = d3.layout.force()
            .charge(-120)
            .linkDistance(30)
            .size([width, height]);

        svg = d3.select(spec.el).append("svg")
            .attr("width", width)
            .attr("height", height);

        force
            .nodes(data.nodes)
            .links(data.links)
            .start();

        link = svg.selectAll(".link")
            .data(data.links);
        link.enter().append("line")
            .attr("class", "link")
            .style("stroke", "black")
            .style("stroke-width", 1);

        node = svg.selectAll(".node")
            .data(data.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", function (d) { return sizeScale(nodeSize(d)); })
            .style("fill", function (d) { return colorScale(nodeColor(d)); })
            .call(force.drag);

        node.append("title")
            .text(function(d) { return nodeLabel(d); });

        force.on("tick", function() {
            link.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            node.attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });
        });

        function update() {
            return that;
        }

        that.update = update;

        return that;
    };

}(window.tangelo, window.d3));/*jslint browser: true, unparam: true */

(function (tangelo, vg) {
    "use strict";

    tangelo.vis.timebar = function (spec) {
        var color = tangelo.accessor(spec.color, "steelblue"),
            date = tangelo.accessor(spec.date, undefined),
            dt = [],
            opt = {
                data: {table: dt},
                renderer: "svg",
                el: spec.el
            },
            data = spec.data,
            that = {};

        data.forEach(function (d) {
            dt.push({
                date: date(d),
                color: color(d),
                orig: d
            });
        });
        vg.parse.spec("/vega/timebar.json", function(chart) {
            chart(opt).update();
        });

        function update() {
            return that;
        }

        that.update = update;
        return that;
    };
}(window.tangelo, window.vg));
/*jslint browser: true, unparam: true */

(function (tangelo, vg) {
    "use strict";

    tangelo.vis.timeline = function (spec) {
        var y,
            date = tangelo.accessor(spec.date, undefined),
            data = spec.data,
            dt = [],
            opt = {
                data: {table: dt},
                renderer: "svg",
                el: this
            },
            that = this;

        spec.y = tangelo.isArray(spec.y) ? spec.y : [spec.y];
        y = [];
        spec.y.forEach(function (d) {
            y.push(tangelo.accessor(d, 0));
        });
        d.forEach(function (d) {
            var ty = tangelo.isArray(y) ? y : [y];
            ty.forEach(function (yy) {
                dt.push({
                    date: row[date],
                    group: yy,
                    y: row[yy],
                    orig: row
                });
            });
        });
        vg.parse.spec("/vega/timeline.json", function(chart) {
            chart(opt)
                .on("mouseover", function (event, d) {
                    if (on.mouseover) {
                        on.mouseover(d);
                    }
                })
                .on("mouseout", function (event, d) {
                    if (on.mouseout) {
                        on.mouseout(d);
                    }
                })
                .on("click", function (event, d) {
                    if (on.click) {
                        on.click(d);
                    }
                })
                .update();
        });

        function update() {
            return that;
        }

        that.update = update;
        return that;
    };

}(window.tangelo, window.vg));