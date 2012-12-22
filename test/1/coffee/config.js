var config;

config = {
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
      url: "data/lsoa.json",
      name_field: "ward",
      id_field: "code"
    }
  },
  data: {
    version: "1.0",
    id_field: "id"
  },
  dimensions: {
    imd: {
      field: "imd",
      title: "Index of Multiple Deprivation",
      load_url: "data/imd.tsv",
      inputformat: function(data) {
        return (function(f) {
          return Math.round(f * 100) / 100;
        });
      },
      axisformat: function(data) {
        return Math.round;
      }
    },
    crime: {
      field: "crime",
      title: "Crime figures",
      load_url: "data/imd.tsv",
      inputformat: function(data) {
        return (function(f) {
          return Math.round(f * 100) / 100;
        });
      }
    },
    income: {
      field: "income",
      title: "Income Deprivation",
      load_url: "data/imd.tsv",
      inputformat: function(data) {
        return (function(f) {
          return Math.round(f * 100) / 100;
        });
      }
    },
    price: {
      p: {
        bedrooms: 1,
        type: "sale"
      },
      load_url: "data/prices.tsv",
      field: function(d) {
        return d.p.type + "_" + d.p.bedrooms;
      },
      renderForm: function(data, container) {
        return $(container).html($("#templates .price").html());
      },
      format: function(data) {
        if (data.p.type === 'sale') {
          return function(v) {
            return "£" + d3.format(",.0f")(v / 1000) + "k";
          };
        } else {
          return function(v) {
            return "£" + d3.format(",.0f")(v) + " per week";
          };
        }
      },
      inputformat: function(data) {
        return Math.round;
      },
      axisformat: function(data) {
        if (data.p.type === 'sale') {
          return function(v) {
            return "£" + d3.format(",.0f")(v / 1000) + "k";
          };
        } else {
          return function(v) {
            return "£" + d3.format(",.0f")(v);
          };
        }
      }
    }
  },
  defaults: {
    colorscale: d3.scale.linear().domain([1, 12, 20]).range(["green", "yellow", "red"]).interpolate(d3.cie.interpolateLab),
    opacity: 0.7,
    order: ["imd", "crime", "income", "price"],
    active: "imd"
  }
};
