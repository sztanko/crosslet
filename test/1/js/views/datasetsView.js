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
    this.config = config;
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
    if (this.numloads === 0) return this.createCube();
  };

  PanelView.prototype._renderMap = function() {
    var abox, adata, k, keys, out, _i, _len;
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
    this.parent.renderMap(out, (function(v) {
      return this.config.defaults.colorscale(abox.config.scale(v));
    }), abox.config.hover);
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
    var bName, box, chart, d, dg, getRounder, groups, int, key, keys, row, t1, t15, t2, _i, _len, _ref, _ref2;
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
    _ref2 = this.boxes;
    for (bName in _ref2) {
      box = _ref2[bName];
      d = this.cube.dimension(function(d) {
        return d[bName];
      });
      dg = d.group(getRounder(box.interval[0], box.interval[1], this.width - 20));
      chart = barChart().dimension(d).name_id(bName).group(dg).x(d3.scale.linear().domain(box.interval).rangeRound([0, this.width - 20])).tickSize(box.config.tickSize).tickFormat(box.config.axisformat(box.config)).fill(this.config.defaults.colorscale);
      chart.on("brush", this.renderCubes);
      chart.on("brushend", this.renderCubes);
      this.charts[bName] = chart;
      box.chart = chart;
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
    this.defaultSubmitForm = __bind(this.defaultSubmitForm, this);
    this.defaultRenderText = __bind(this.defaultRenderText, this);
    this.defaultRenderForm = __bind(this.defaultRenderForm, this);
    this.dataLoaded = __bind(this.dataLoaded, this);
    BoxView.__super__.constructor.apply(this, arguments);
  }

  BoxView.prototype.initialize = function(el, config, parent, name) {
    var id, idf;
    this.el = el;
    $(this.el)[0].onmousedown = $(this.el)[0].ondblclick = L.DomEvent.stopPropagation;
    $(this.el).on("mousedown", this.event_click);
    this.legend = $("<div class='legend'></div>");
    this.legendForm = $("<div class='legendForm'></div>");
    this.legendText = $("<div class='legendText'></div>");
    this.legend.append(this.legendText).append(this.legendForm);
    $(el).append(this.legend);
    this.graph = $("<div class='graph'></div>");
    $(el).append(this.graph);
    this.config = config;
    id = function(d) {
      return d;
    };
    idf = function(d) {
      return id;
    };
    if (!this.config.format) {
      this.config.format = (function(data) {
        return d3.format(",.2f");
      });
    }
    if (!this.config.axisformat) this.config.axisformat = this.config.format;
    if (!this.config.preformat) this.config.preformat = idf;
    if (!this.config.inputformat) this.config.inputformat = idf;
    if (!this.config.renderForm) this.config.renderForm = this.defaultRenderForm;
    if (!this.config.renderText) this.config.renderText = this.defaultRenderText;
    if (!this.config.submitForm) this.config.submitForm = this.defaultSubmitForm;
    if (!this.config.method) this.config.method = d3.tsv;
    this.config.load_url_func = _.isFunction(this.config.load_url) ? this.config.load_url : (function(d) {
      return d.load_url;
    });
    this.config.field_func = _.isFunction(this.config.field) ? this.config.field : (function(d) {
      return d.field;
    });
    if (!this.config.tickSize) this.config.tickSize = 5;
    this.config.cinputformat = this.config.inputformat(this.config);
    this.parent = parent;
    this.ds = parent.ds;
    this.active = false;
    this.name = name;
    return this.parent.ds.loadData(this.config.load_url_func(this.config), this.dataLoaded, this.config.method);
  };

  BoxView.prototype.dataLoaded = function() {
    var f, id, val, _ref;
    this.data = {};
    f = this.config.field_func(this.config);
    console.log("Field is " + f);
    _ref = this.parent.ds.data;
    for (id in _ref) {
      val = _ref[id];
      if (val[f]) this.data[id] = this.config.preformat(this.config)(val[f]);
    }
    this.range = [_.min(_.values(this.data)), _.max(_.values(this.data))];
    this.interval = [_.min(_.values(this.data)), _.max(_.values(this.data))];
    if (!this.config.scale) {
      this.config.scale = d3.scale.quantize().domain(this.range).range([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    }
    this.render();
    return this.parent.loaded();
  };

  BoxView.prototype.defaultRenderForm = function(d, el) {
    var f, html, size;
    f = d.title ? d.title : d.field_func(d);
    html = '<h2>' + f + '<h2>';
    size = _.max(_.map(this.interval, function(d) {
      return ("_" + d).length - 1;
    }));
    html = html + "Range: <input type='text' name='m0' size='" + size + "' value='" + this.interval[0] + "'> &ndash; <input type='text' name='m1' size='3' value='" + this.interval[1] + "'>";
    return el.html(html);
  };

  BoxView.prototype.defaultRenderText = function(d, el) {
    var f, html;
    f = d.title ? d.title : d.field_func(d);
    html = '<h2>' + f + '</h2>';
    html = html + "<p><span class='m0'>" + d.format(d)(this.interval[0]) + "</span> &ndash; <span class='m1'>" + d.format(d)(this.interval[1]) + "</span></p>";
    return el.html(html);
  };

  BoxView.prototype.defaultSubmitForm = function(d, el) {
    return {};
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
    if (f) {
      this.filterElements[0].val(this.config.cinputformat(f[0]));
      this.filterElements[1].val(this.config.cinputformat(f[1]));
      $(this.legend).find(".m0").text(this.config.format(this.config)(f[0]));
      $(this.legend).find(".m1").text(this.config.format(this.config)(f[1]));
    } else {
      this.filterElements[0].val(this.config.cinputformat(this.interval[0]));
      this.filterElements[1].val(this.config.cinputformat(this.interval[1]));
      $(this.legend).find(".m0").text(this.config.format(this.config)(this.interval[0]));
      $(this.legend).find(".m1").text(this.config.format(this.config)(this.interval[1]));
    }
    if (redrawCube) {
      this.chart.filter(f);
      this.parent.renderCubes();
    }
    return this;
  };

  BoxView.prototype.getFilteredData = function() {
    var f, k, out, v, _ref, _ref2;
    if (!this.chart.filter()) return this.data;
    f = (_ref = this.chart.filter()) != null ? _ref : this.interval;
    out = {};
    _ref2 = this.data;
    for (k in _ref2) {
      v = _ref2[k];
      if ((f[0] <= v && v <= f[1])) out[k] = v;
    }
    return out;
  };

  BoxView.prototype.render = function() {
    this.config.renderForm(this.config, this.legendForm);
    this.config.renderText(this.config, this.legendText);
    return this.filterElements = [$(this.legend).find("input[name=m0]"), $(this.legend).find("input[name=m1]")];
  };

  return BoxView;

})(Backbone.View);
