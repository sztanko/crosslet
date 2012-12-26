var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

crosslet.PanelView = (function(_super) {

  __extends(PanelView, _super);

  function PanelView() {
    this.renderCubes = __bind(this.renderCubes, this);
    this.createCube = __bind(this.createCube, this);
    this.setActive = __bind(this.setActive, this);
    this._renderMap = __bind(this._renderMap, this);
    PanelView.__super__.constructor.apply(this, arguments);
  }

  PanelView.prototype.initialize = function(el, config, parent) {
    var e, o, _i, _len, _ref;
    this.config = crosslet.createConfig(crosslet.defaultConfig, config);
    this.parent = parent;
    this.el = el;
    this.ds = parent.ds;
    this.boxes = {};
    this.render();
    this.width = 200;
    this.active = config.defaults.active ? config.defaults.active : config.defaults.order[0];
    this.numloads = this.config.defaults.order.length;
    _ref = this.config.defaults.order;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      o = _ref[_i];
      e = $("<div class='box'></div>");
      this.boxes[o] = new crosslet.BoxView(e, this.config.dimensions[o], this, o);
      this.boxes[this.active].setActive(true);
      $(this.el).append(e);
    }
    this.renderMap = _.debounce(this._renderMap, 200);
    return this.boxes;
  };

  PanelView.prototype.loaded = function() {
    this.numloads = this.numloads - 1;
    if (this.numloads <= 0) return this.createCube();
  };

  PanelView.prototype._renderMap = function() {
    var abox, adata, f, k, keys, out, _i, _len,
      _this = this;
    abox = this.boxes[this.active];
    adata = abox.getFilteredData();
    keys = this.intersection(_.map(_.values(this.boxes), function(b) {
      return _.keys(b.getFilteredData()).sort();
    }));
    out = {};
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      k = keys[_i];
      out[k] = adata[k];
    }
    f = abox.config.format.long(abox.config);
    this.parent.renderMap(out, (function(v) {
      return abox.config.data.colorscale(abox.config.scale(v));
    }), function(data, value) {
      return data.properties[_this.config.map.geo.name_field] + " - " + f(value);
    });
    return this;
  };

  PanelView.prototype.setActive = function(activeBox) {
    if (activeBox !== this.active) {
      this.boxes[this.active].setActive(false);
      this.active = activeBox;
      this.boxes[this.active].setActive(true);
      return this.renderMap();
    }
  };

  PanelView.prototype.intersection = function(a) {
    var intersect_safe, o, out, _i, _len, _ref;
    intersect_safe = function(a, b) {
      var ai, bi, result;
      ai = bi = 0;
      result = [];
      while (ai < a.length && bi < b.length) {
        if (a[ai] < b[bi]) ai++;
        if (a[ai] > b[bi]) bi++;
        if (a[ai] === b[bi]) {
          result.push(a[ai]);
          ai++;
          bi++;
        }
      }
      return result;
    };
    switch (a.length) {
      case 0:
        return a;
      case 1:
        return a[0];
      case 2:
        return intersect_safe(a[0], a[1]);
      default:
        out = a[0];
        _ref = a.slice(1);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          o = _ref[_i];
          out = intersect_safe(out, o);
        }
        return out;
    }
  };

  PanelView.prototype.createCube = function() {
    var bName, box, brushevent, chart, d, dg, getRounder, groups, int, js_bName, js_box, key, keys, row, t1, t15, t2, _i, _len, _ref, _ref2;
    this.rows = [];
    t1 = new Date().getTime();
    keys = _.map(_.values(this.boxes), function(b) {
      return _.keys(b.data).sort();
    });
    t15 = new Date().getTime();
    int = this.intersection(keys);
    for (_i = 0, _len = int.length; _i < _len; _i++) {
      key = int[_i];
      row = {};
      _ref = this.boxes;
      for (bName in _ref) {
        box = _ref[bName];
        row[bName] = box.data[key];
      }
      this.rows.push(row);
    }
    t2 = new Date().getTime();
    this.cube = crossfilter(this.rows);
    getRounder = function(m1, m2, w) {
      var t;
      t = 10 * (m2 - m1) / w;
      return function(d) {
        return t * Math.floor(+d / t);
      };
    };
    groups = {};
    this.charts = {};
    brushevent = function(box, ctx) {
      return function() {
        box.event_click();
        return ctx.renderCubes();
      };
    };
    _ref2 = this.boxes;
    for (bName in _ref2) {
      box = _ref2[bName];
      var chart, js_box,js_bName;
      js_box = box;
      js_bName = bName;
      d = this.cube.dimension(function(dd) {
        return dd[bName];
      });
      dg = d.group(getRounder(box.config.data.interval[0], box.config.data.interval[1], this.width - 20));
      box.graph.empty();
      chart = barChart().dimension(d).name_id(bName).group(dg).x(d3.scale.linear().domain(box.config.data.interval).rangeRound([0, this.width - 20])).tickSize(box.config.data.tickSize).tickFormat(box.config.format.axis(box.config)).fill(box.config.data.colorscale);
      console.log(js_bName);
      chart.on("brush", brushevent(box, this));
      chart.on("brushend", this.renderCubes);
      box.chart = chart;
      this.charts[bName] = chart;
    }
    this.renderCubes();
    return this;
  };

  PanelView.prototype.renderCubes = function() {
    var abox, bName, box, _ref;
    _ref = this.boxes;
    for (bName in _ref) {
      box = _ref[bName];
      box.chart(box.graph);
      $(box.el).on("mousedown", box.event_click);
      box.setFilter(box.chart.filter(), false);
    }
    abox = this.boxes[this.active];
    abox.setFilter(abox.chart.filter(), false);
    this.renderMap();
    return this;
  };

  return PanelView;

})(Backbone.View);

crosslet.BoxView = (function(_super) {

  __extends(BoxView, _super);

  function BoxView() {
    this.setFilter = __bind(this.setFilter, this);
    this.event_click = __bind(this.event_click, this);
    this.setActive = __bind(this.setActive, this);
    this.dataLoaded = __bind(this.dataLoaded, this);
    BoxView.__super__.constructor.apply(this, arguments);
  }

  BoxView.prototype.initialize = function(el, config, parent, name) {
    this.el = el;
    this.config = crosslet.createConfig(crosslet.defaultDimensionConfig, config);
    this.config.id = name;
    this.config.data.field_func = !_.isFunction(this.config.data.field) ? (function(d) {
      return d.data.field;
    }) : this.config.data.field;
    $(this.el).on("mousedown", this.event_click);
    $(this.el).on("tap", this.event_click);
    $(this.el)[0].onmousedown = $(this.el)[0].ondblclick = L.DomEvent.stopPropagation;
    this.legend = {};
    this.legend.all = $("<div class='legend'></div>");
    this.legend.text = $("<div class='legendText'></div>");
    this.legend.text_p = $("<div class='legendText'></div>");
    this.legend.text_range = $("<div class='legendRange'></div>");
    this.legend.text.append(this.legend.text_p).append(this.legend.text_range);
    this.legend.form = $("<div class='legendForm'></div>");
    this.legend.form_p = $("<div class='legendForm_p'></div>");
    this.legend.form_range = $("<div class='legendForm_range'></div>");
    this.legend.form.append(this.legend.form_p).append(this.legend.form_range);
    this.legend.all.append(this.legend.text).append(this.legend.form);
    $(el).append(this.legend.all);
    this.graph = $("<div class='graph'></div>");
    $(el).append(this.graph);
    this.parent = parent;
    this.ds = parent.ds;
    this.active = false;
    this.name = name;
    return this.loadData();
  };

  BoxView.prototype.loadData = function() {
    if (_.isString(this.config.data.dataSet)) {
      return this.parent.ds.loadData(this.config.data.dataSet, this.dataLoaded, this.config.data.method);
    } else {
      if (_.isFunction(this.config.data.dataSet)) {
        return this.parent.ds.loadData(this.config.data.dataSet(this.config), this.dataLoaded, this.config.data.method);
      } else {
        return this.parent.ds.addData(this.config.data.dataSet, this.dataLoaded);
      }
    }
  };

  BoxView.prototype.dataLoaded = function() {
    var f, id, preformatter, val, _ref;
    this.data = {};
    f = this.config.data.field_func(this.config);
    preformatter = this.config.data.preformat(this.config);
    _ref = this.parent.ds.data;
    for (id in _ref) {
      val = _ref[id];
      if (val[f]) this.data[id] = preformatter(val[f]);
    }
    if (!this.config.data.interval) {
      this.config.data.interval = [_.min(_.values(this.data)), _.max(_.values(this.data))];
    }
    if (!this.config.filter) {
      this.config.filter = [_.min(_.values(this.data)), _.max(_.values(this.data))];
    }
    if (!this.config.scale) {
      this.config.scale = d3.scale.quantize().domain(this.config.data.interval).range([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    }
    this.render();
    return this.parent.loaded();
  };

  BoxView.prototype.setActive = function(isActive) {
    this.active = isActive;
    if (isActive) {
      return $(this.el).addClass("selected");
    } else {
      return $(this.el).removeClass("selected");
    }
  };

  BoxView.prototype.event_click = function(event) {
    if (!this.active) this.parent.setActive(this.name);
    return true;
  };

  BoxView.prototype.setFilter = function(f, redrawCube) {
    if (redrawCube == null) redrawCube = false;
    if (redrawCube) {
      this.chart.filter(f);
      this.parent.renderCubes();
    }
    if (!f) f = this.config.data.interval;
    this.config.filter = f;
    this.filterElements[0].val(this.config.format.input(this.config)(f[0]));
    this.filterElements[1].val(this.config.format.input(this.config)(f[1]));
    $(this.legend.text_range).find(".m0").text(this.config.format.short(this.config)(f[0]));
    $(this.legend.text_range).find(".m1").text(this.config.format.short(this.config)(f[1]));
    return this;
  };

  BoxView.prototype.getFilteredData = function() {
    var f, k, out, v, _ref, _ref2;
    if (!this.chart.filter()) return this.data;
    f = (_ref = this.chart.filter()) != null ? _ref : this.config.data.interval;
    out = {};
    _ref2 = this.data;
    for (k in _ref2) {
      v = _ref2[k];
      if ((f[0] <= v && v <= f[1])) out[k] = v;
    }
    return out;
  };

  BoxView.prototype.renderRange = function() {
    this.config.render.range(this.config, this.legend.text_range);
    return this.config.render.rangeForm(this.config, this.legend.form_range);
  };

  BoxView.prototype.render = function() {
    var _this = this;
    this.config.render.legend(this.config, this.legend.text_p);
    this.config.render.form(this.config, this.legend.form_p);
    this.renderRange();
    $(this.legend.form_range).find("input").on("change", function() {
      var f;
      f = [+_this.filterElements[0].val(), +_this.filterElements[1].val()];
      if (f[0] > f[1]) f.reverse();
      f[0] = _.max([_this.config.data.interval[0], f[0]]);
      f[1] = _.min([_this.config.data.interval[1], f[1]]);
      if (_.isEqual(f, _this.config.data.interval)) f = null;
      return _this.setFilter(f, true);
    });
    $(this.legend.form_p).find("input, select").on("change", function() {
      var p;
      _this.config.data.interval = null;
      _this.config.scale = null;
      _this.config.filter = null;
      p = _this.config.submitter(_this.config, _this.legend.form_p);
      _this.config.p = p;
      console.log(p);
      return _this.loadData();
    });
    return this.filterElements = [$(this.legend.form_range).find("input[name=m0]"), $(this.legend.form_range).find("input[name=m1]")];
  };

  return BoxView;

})(Backbone.View);
