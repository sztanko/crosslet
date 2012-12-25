var crosslet;

crosslet = {};

if (!_) console.log("Please include underscore.js");

crosslet.createConfig = function(defaultConfig, config) {
  var c;
  return c = jQuery.extend(true, jQuery.extend(true, {}, defaultConfig), config);
};

crosslet.id = function(d) {
  return d;
};

crosslet.idf = function(d) {
  return id;
};

crosslet.notimplemented = function() {
  throw "This function is not set. Please check your config.";
};

crosslet.changeSelect = function(select, val) {
  return $(select).find("option").filter(function() {
    return $(this).val() === val;
  }).attr('selected', true);
};

crosslet.defaultConfig = {
  map: {
    leaflet: {
      key: "fe623ce312234f8f9333bbee72d4a176",
      styleId: 64657,
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
    },
    view: {
      center: [51.505, -0.09],
      zoom: 11
    },
    geo: {
      url: "please specify correct location of your geojson",
      name_field: "name",
      id_field: "code"
    }
  }
};

({
  data: {
    version: "1.0",
    id_field: "id"
  },
  dimensions: {},
  defaults: {
    colorscale: d3.scale.linear().domain([1, 10, 20]).range(["green", "yellow", "red"]).interpolate(d3.cie.interpolateLab),
    opacity: 0.75,
    order: []
  }
});

crosslet.defaultDimensionConfig = {
  p: {},
  data: {
    interval: null,
    filter: null,
    field: function(d) {
      return d.id;
    },
    dataSet: crosslet.notimplemented,
    method: d3.tsv,
    preformat: function(dd) {
      return function(d) {
        return +d;
      };
    },
    tickSize: 5,
    colorscale: d3.scale.linear().domain([1, 10, 20]).range(["green", "yellow", "red"]).interpolate(d3.cie.interpolateLab)
  },
  format: {
    short: function(d) {
      return d3.format(",.2f");
    },
    long: function(d) {
      return d.format.short(d);
    },
    input: function(d) {
      return d.format.short(d);
    },
    axis: function(d) {
      return d.format.short(d);
    }
  },
  render: {
    legend: function(d, el) {
      var f, html;
      f = d.title ? d.title : d.data.field_func(d);
      html = '<h2>' + f + '<h2>';
      return el.html(html);
    },
    range: function(d, el) {
      var html;
      html = "<p><span class='m0'>" + d.format.short(d)(d.filter[0]) + "</span> &ndash; <span class='m1'>" + d.format.short(d)(d.filter[1]) + "</span></p>";
      return el.html(html);
    },
    form: function(d, el) {
      return el.html("");
    },
    rangeForm: function(d, el) {
      var html, size;
      size = _.max(_.map(d.data.interval, function(dd) {
        return ("_" + d.format.input(d)(dd)).length - 1;
      }));
      html = "Range: <input type='text' name='m0' size='" + size + "' value='" + d.format.input(d)(d.filter[0]) + "'> &ndash; <input type='text' name='m1' size='3' value='" + d.format.input(d)(d.filter[1]) + "'>";
      return el.html(html);
    }
  },
  submitter: function(d, el) {
    var out;
    out = {};
    $(el).find("input, select").each(function(index, el) {
      return out[$(el).attr("name")] = $(el).val();
    });
    console.log(out);
    return out;
  }
};
