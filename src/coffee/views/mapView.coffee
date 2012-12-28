class crosslet.MapView extends Backbone.View
	initialize: (el,config) ->
		@config=crosslet.createConfig(crosslet.defaultConfig,config)
		@geoURL=@config.map.geo.url
		#@config.data.id_field = "id" if not @config.data.id_field
		#@config.map.geo.id_field = "id" if not @config.map.geo.id_field

		@opacity=@config.defaults.opacity
		@ds=new crosslet.DataStore(@config)
		@el=el
		@hoverFunc=@default_hover
		$(@el).attr("class","crosslet")
		@map= L.map(el[0]).setView(@config.map.view.center, @config.map.view.zoom)
	
		L.tileLayer("http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png", @config.map.leaflet).addTo(@map);
		@control=$("<div class='crosslet_panel'></div>")
		
		@info = L.Control.extend(
			options: { position: 'topright'  },
			onAdd : (map) =>
				#@control[0].onmousedown = @control[0].ondblclick = L.DomEvent.stopPropagation;
				return @control[0];
			)
		#$(".leaflet-map-pane").css("-webkit-transform","")
		@map.addControl(new @info())
		@panel=new crosslet.PanelView(@control,@config,@)
		@renderMap=@_renderMap #_.debounce(@_renderMap,200)
		#console.log(@panel)
		#debugger;
		#console.log
		@ds.loadGeo(@geoURL, @config.map.geo.id_field, (ds) =>
			@bounds = @ds.bounds
			@path = d3.geo.path().projection(@project)
			@svg = d3.select(@map.getPanes().overlayPane).append("svg")
			@g = @svg.append("g")
			@g.attr("class","crosslet_geometry")
			#@g.style("fill-opacity",@opacity)
			@feature = @g.selectAll("path")
				.data(ds.geometries).enter()
				.append("path")
				.attr("id",(d) => "path_"+d.properties[@config.map.geo.id_field])
				.on("mouseover",(d) => @hover(d))
				.on("mousemove",@moveMove)
			@reset()
			@map.on("viewreset", @reset)
			@map.on("zoomstart", @beforezoom)
			@hoverElement=@svg.append("g").attr("class","hover")
			@hoverElementRect = @hoverElement.append("svg:rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", 10)
			.attr("height", 30)
			.attr("rx",5)
			.attr("ry",5)
			@hoverElementText=@hoverElement.append("text").attr("x",0).attr("y",0)
			#@hoverElementTextBB=@hoverElementText.node().getBBox() - firefox will hate this, see https://bugzilla.mozilla.org/show_bug.cgi?id=612118
			@hoverElementTextBB={width: 0, height:0, x:0, y:0}
			@panel.createCube() if @panel.numloads<=0
		, @config.map.geo.topo_object)
	


	project: (x) =>
			point = @map.latLngToLayerPoint(new L.LatLng(x[1], x[0]))
			return [point.x, point.y]		
					
	beforezoom: () =>
		#console.log("before zoom")
		@g.style("display","none")
		#debugger;
	reset: () =>
		bottomLeft = @project(@bounds[0])
		topRight = @project(@bounds[1])
		@svg.attr("width", topRight[0] - bottomLeft[0])
		.attr("height", bottomLeft[1] - topRight[1])
		.style("margin-left", bottomLeft[0] + "px")
		.style("margin-top", topRight[1] + "px")
		@g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")")
		@feature.attr("d", @path)
		@g.style("display","inline")
		#	@path_done=true
		return true
	moveMove: () =>
		br=jQuery.browser
		pos=d3.mouse(@svg.node())
		if br.mozilla
			trp=@svg.node().parentNode.parentNode.parentNode
			matrix=$(trp).css("transform").split('(')[1].split(')')[0].split(',');
			#console.log(matrix)
			dx=+matrix[4]
			dy=+matrix[5]
			pos[0]-=dx
			pos[1]-=dy
		#console.log(pos)
		pos[0]+=30
		pos[1]+=30
		#console.log()
		if @hoverElementTextBB.width+pos[0]>=@svg.attr("width")
			pos[0]-=@hoverElementTextBB.width+60
		if @hoverElementTextBB.height+pos[1]>=@svg.attr("height")
			pos[1]-=@hoverElementTextBB.height+60
		#console.log(d3.mouse(@svg[0][0]))
		@hoverElement.attr("transform","translate(" + pos[0] + "," + pos[1] + ")")
	hover: (data) =>
		text=@hoverFunc(data,data.properties.value)
		@hoverElementText.text(text)
		@hoverElementTextBB=@hoverElementText.node().getBBox()
		@hoverElementRect.attr("width",@hoverElementTextBB.width+10)
		.attr("height",@hoverElementTextBB.height+10)
		.attr("x",@hoverElementTextBB.x-5)
		.attr("y",@hoverElementTextBB.y-5)
		#console.log(text)

	default_hover: (data,value) ->
		##console.log(@config.map.geo.name_field)
		data.properties[@config.map.geo.name_field] + " - " + value

	_renderMap: (data,formatter,hoverFunc) =>
		#console.log("Rendering map")
		@hoverFunc=hoverFunc if hoverFunc
		@feature.attr("style",(d) =>
			id=d.properties[@config.map.geo.id_field]
			d.properties.value=data[id]
			if _.isNumber(data[id])
				"fill: "+formatter(d.properties.value)
			else
				"display:none"
			)
		return this



