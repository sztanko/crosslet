var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

crosslet.MapView = (function(_super) {

  __extends(MapView, _super);

  function MapView() {
    this._renderMap = __bind(this._renderMap, this);
    this.hover = __bind(this.hover, this);
    this.moveMove = __bind(this.moveMove, this);
    this.reset = __bind(this.reset, this);
    this.beforezoom = __bind(this.beforezoom, this);
    this.project = __bind(this.project, this);
    MapView.__super__.constructor.apply(this, arguments);
  }

  MapView.prototype.initialize = function(el, config) {
    var _this = this;
    this.config = config;
    this.geoURL = this.config.map.geo.url;
    if (!this.config.data.id_field) this.config.data.id_field = "id";
    if (!this.config.map.geo.id_field) this.config.map.geo.id_field = "id";
    this.opacity = this.config.defaults.opacity;
    this.ds = new crosslet.DataStore(this.config);
    this.el = el;
    this.hoverFunc = this.default_hover;
    $(this.el).attr("class", "crosslet");
    this.map = L.map(el[0]).setView(this.config.map.view.center, this.config.map.view.zoom);
    L.tileLayer("http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png", this.config.map.leaflet).addTo(this.map);
    this.control = $("<div class='crosslet_panel'></div>");
    this.info = L.Control.extend({
      options: {
        position: 'topright'
      },
      onAdd: function(map) {
        return _this.control[0];
      }
    });
    this.map.addControl(new this.info());
    this.panel = new crosslet.PanelView(this.control, this.config, this);
    this.renderMap = this._renderMap;
    return this.ds.loadGeo(this.geoURL, this.config.map.geo.id_field, function(ds) {
      _this.bounds = _this.ds.bounds;
      _this.path = d3.geo.path().projection(_this.project);
      _this.svg = d3.select(_this.map.getPanes().overlayPane).append("svg");
      _this.g = _this.svg.append("g");
      _this.g.attr("class", "crosslet_geometry");
      _this.feature = _this.g.selectAll("path").data(ds.geometries).enter().append("path").attr("id", function(d) {
        return "path_" + d.properties[_this.config.map.geo.id_field];
      }).on("mouseover", function(d) {
        return _this.hover(d);
      }).on("mousemove", _this.moveMove);
      _this.reset();
      _this.map.on("viewreset", _this.reset);
      _this.map.on("zoomstart", _this.beforezoom);
      _this.hoverElement = _this.svg.append("g").attr("class", "hover");
      _this.hoverElementRect = _this.hoverElement.append("svg:rect").attr("x", 0).attr("y", 0).attr("width", 10).attr("height", 30).attr("rx", 5).attr("ry", 5);
      _this.hoverElementText = _this.hoverElement.append("text").attr("x", 0).attr("y", 0);
      return _this.hoverElementTextBB = _this.hoverElementText.node().getBBox();
    });
  };

  MapView.prototype.project = function(x) {
    var point;
    point = this.map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
    return [point.x, point.y];
  };

  MapView.prototype.beforezoom = function() {
    return this.g.style("display", "none");
  };

  MapView.prototype.reset = function() {
    var bottomLeft, topRight;
    bottomLeft = this.project(this.bounds[0]);
    topRight = this.project(this.bounds[1]);
    this.svg.attr("width", topRight[0] - bottomLeft[0]).attr("height", bottomLeft[1] - topRight[1]).style("margin-left", bottomLeft[0] + "px").style("margin-top", topRight[1] + "px");
    this.g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
    this.feature.attr("d", this.path);
    this.g.style("display", "inline");
    return true;
  };

  MapView.prototype.moveMove = function() {
    var pos;
    pos = d3.mouse(this.svg.node());
    pos[0] += 30;
    pos[1] += 30;
    if (this.hoverElementTextBB.width + pos[0] >= this.svg.attr("width")) {
      pos[0] -= this.hoverElementTextBB.width + 60;
    }
    if (this.hoverElementTextBB.height + pos[1] >= this.svg.attr("height")) {
      pos[1] -= this.hoverElementTextBB.height + 60;
    }
    return this.hoverElement.attr("transform", "translate(" + pos[0] + "," + pos[1] + ")");
  };

  MapView.prototype.hover = function(data) {
    var text;
    text = this.hoverFunc(data, data.properties.value);
    this.hoverElementText.text(text);
    this.hoverElementTextBB = this.hoverElementText.node().getBBox();
    return this.hoverElementRect.attr("width", this.hoverElementTextBB.width + 10).attr("height", this.hoverElementTextBB.height + 10).attr("x", this.hoverElementTextBB.x - 5).attr("y", this.hoverElementTextBB.y - 5);
  };

  MapView.prototype.default_hover = function(data, value) {
    return data.properties[this.config.map.geo.name_field] + " - " + value;
  };

  MapView.prototype._renderMap = function(data, formatter, hoverFunc) {
    var _this = this;
    if (hoverFunc) this.hoverFunc = hoverFunc;
    this.feature.attr("style", function(d) {
      var id;
      id = d.properties[_this.config.map.geo.id_field];
      d.properties.value = data[id];
      if (data[id]) {
        return "fill: " + formatter(d.properties.value);
      } else {
        return "display:none";
      }
    });
    return this;
  };

  return MapView;

})(Backbone.View);
