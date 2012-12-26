var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

crosslet.DataStore = (function() {

  DataStore.prototype.data = {};

  DataStore.prototype.geometries = null;

  DataStore.prototype.isGeoLoaded = false;

  DataStore.prototype.isDataLoaded = false;

  function DataStore(initData) {
    this.loadGeo = __bind(this.loadGeo, this);
    var _ref, _ref2;
    this.geoURL = initData.map.geo.url;
    this.version = initData.data.version;
    this.idField = (_ref = initData.data.id_field) != null ? _ref : "id";
    this.geoIdField = (_ref2 = initData.map.geo.id_field) != null ? _ref2 : "id";
    if (!window.dataloader) window.dataloader = new crosslet.DataLoader();
    this.l = window.dataloader;
  }

  DataStore.prototype.addData = function(data, callback) {
    var d, k, v, _i, _len;
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      d = data[_i];
      if (!this.data[d[this.idField]]) this.data[d[this.idField]] = {};
      for (k in d) {
        v = d[k];
        if (!_.isNaN(+v)) this.data[d[this.idField]][k] = +v;
      }
    }
    this.isDataLoaded = true;
    if (callback) return callback(data);
  };

  DataStore.prototype.loadData = function(url, callback, method) {
    var _this = this;
    if (!method) method = d3.tsv;
    this.l.load(url, method, function(data) {
      return _this.addData(data, callback);
    });
    return this;
  };

  DataStore.prototype.get_bounds_topo = function(c) {
    var a, f, i, o, _i, _j, _len, _len2, _ref, _ref2;
    o = [];
    _ref = [_.min, _.max];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      f = _ref[_i];
      a = [];
      _ref2 = [0, 1];
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        i = _ref2[_j];
        a.push(f(_.map(c, function(d) {
          return f(_.map(d.coordinates[0], function(dd) {
            return dd[i];
          }));
        })));
      }
      o.push(a);
    }
    return o;
  };

  DataStore.prototype.loadGeo = function(url, geoIdField, callback, topo_objectName) {
    var _this = this;
    return this.l.load(url, d3.json, function(t) {
      var f, _i, _len, _ref;
      if (t.arcs) {
        t = topojson.object(t, t.objects[topo_objectName]);
        _this.geometries = t.geometries;
      } else {
        _this.geometries = t.features;
      }
      _this.bounds = d3.geo.bounds(t);
      _ref = _this.geometries;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        if (f.properties) {
          _this.data[f.properties[_this.geoIdField]] = f.properties;
          _this.data[f.properties[_this.geoIdField]].bbox = d3.geo.bounds(f);
        }
      }
      _this.isGeoLoaded = true;
      if (callback) callback(_this);
      return _this;
    });
  };

  return DataStore;

})();

crosslet.DataLoader = (function() {

  DataLoader.prototype.cache = {};

  DataLoader.prototype.status = {};

  DataLoader.prototype.callbackList = {};

  function DataLoader(version) {
    if (!version) version = 1 + ".0";
    this.version = version;
    this.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
  }

  DataLoader.prototype.load = function(url, method, callback) {
    var urlv,
      _this = this;
    urlv = url + this.version;
    if (!this.callbackList[urlv]) this.callbackList[urlv] = [];
    if (!this.status[urlv]) this.status[urlv] = "init";
    if (callback) this.callbackList[urlv].push(callback);
    if (__indexOf.call(this.cache, urlv) >= 0) {
      this.executeCallbacks(this.callbackList[urlv], this.cache[urlv]);
      return this;
    } else {
      if (this.status[urlv] !== "loading") {
        this.status[urlv] = "loading";
        method(url, function(data) {
          _this.cache[urlv] = data;
          _this.executeCallbacks(_this.callbackList[urlv], _this.cache[urlv]);
          _this.status[urlv] = "done";
          return _this;
        });
      }
    }
    return this;
  };

  DataLoader.prototype.executeCallbacks = function(list, data) {
    var _results;
    _results = [];
    while (list.length > 0) {
      _results.push(list.pop()(data));
    }
    return _results;
  };

  return DataLoader;

})();
