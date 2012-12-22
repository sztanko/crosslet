barChart=function() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 5, right: 10, bottom: 20, left: 10},
        x,
        y = d3.scale.linear().range([20, 0]),
        id = barChart.id++,
        axis = d3.svg.axis().orient("bottom"),
        brush = d3.svg.brush(),
        brushDirty,
        dimension,
        group,
        round,
        tickFormat,
        tickSize,
        filter=null,
        name_id,
        status,
        fill;

    function chart(div) {
      var width = x.range()[1],
          height = y.range()[0];

      y.domain([0, group.top(1)[0].value]);

      div.each(function() {
        var div = d3.select(this),
            g = div.select("g");

        // Create the skeletal chart.
        if (g.empty()) {
          var svg = div.append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .attr("id",name_id)
              if(fill)
              {
              fill_svg=svg.append("defs").append("linearGradient").attr("id","lg-"+id)
               .attr("x1","0%").attr("y1","0%").attr("x2","100%").attr("y2","0%")
               var rr=d3.scale.linear().domain([0,20]).range(x.range)
               for(var i=0;i<20;i++)
               {
                fill_svg.append("stop").attr("stop-color",fill(i)).attr("offset",i*5+"%").attr("stop-opacity","1")
               }
             }
           /*
             <defs>
    <linearGradient id="myLinearGradient1"
                    x1="0%" y1="0%"
                    x2="0%" y2="100%"
                    spreadMethod="pad">
      <stop offset="0%"   stop-color="#00cc00" stop-opacity="1"/>
      <stop offset="100%" stop-color="#006600" stop-opacity="1"/>
    </linearGradient>
  </defs>
           */
           g=svg.append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
          
          /*status=svg.append("text").attr("class","title").attr("x",width-margin.left).attr("y",10)
          .attr("width",150)
          .attr("height",20).text("")*/
          if(filter)
            status.text(axis.tickFormat()(filter[0])+" - "+axis.tickFormat()(filter[1]))
          g.append("clipPath")
              .attr("id", "clip-" + id)
            .append("rect")
              .attr("width", width)
              .attr("height", height);

          g.selectAll(".bar")
              .data(["background", "foreground"])
            .enter().append("path")
              .attr("class", function(d) { return d + " bar"; })
              .datum(group.all());

          g.selectAll(".foreground.bar")
              .attr("clip-path", "url(#clip-" + id + ")")
              .attr("fill","url(#lg-"+id+")");

          g.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(0," + height + ")")
              .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          div.select(".title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
                .attr("x", 0)
                .attr("width", width);
          } else {
            var extent = brush.extent();
            g.selectAll("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        var path = [],
            i = -1,
            n = groups.length,
            d;
        //console.log("ha")
        while (++i < n) {
          d = groups[i];
          //console.log(d.value)
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
        }
        return path.join("");
      }

      function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
          extent = brush.extent();
      if (round) g.select(".brush")
          .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
          .style("display", null);
      g.select("#clip-" + id + " rect")
          .attr("x", x(extent[0]))
          .attr("width", x(extent[1]) - x(extent[0]));
      
        dimension.filterRange(extent);
        filter=extent
      if(extent[1]-extent[0]>0)    
        {
          if(status)
           status.text(axis.tickFormat()(extent[0])+" - "+axis.tickFormat()(extent[1]))
      }
      else
      {
        if(status)
          status.text("")
      }
    });

    brush.on("brushend.chart", function() {
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();
        filter=null
      }
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.tickFormat = function(_) {
      if (!arguments.length) return tickFormat;
      tickFormat = _;
      axis.tickFormat(tickFormat)
      return chart;
    };

    chart.name_id = function(_) {
      if (!arguments.length) return name_id;
      name_id = _;
      return chart;
    };

    chart.tickSize = function(_) {
      if (!arguments.length) return tickSize;
      tickSize = _;
      axis.ticks(tickSize)
      return chart;
    };
    
    chart.fill = function(_) {
      if (!arguments.length) return fill;
      fill = _;
      return chart;
    };


    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (!arguments.length) return filter;
      if (_) {
        filter=_
        brush.extent(_);
        dimension.filterRange(_);
        if(status)
               status.text(axis.tickFormat()(filter[0])+" - "+axis.tickFormat()(filter[1]))
      } else {
        brush.clear();
        filter=null
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  }