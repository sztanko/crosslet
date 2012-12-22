class crosslet.PanelView extends Backbone.View
	initialize: (el, config,parent) ->
		@config=config
		@parent=parent
		@el=el
		@ds=parent.ds
		@boxes={}
		@render()
		@width=200
		@active= if config.defaults.active then config.defaults.active else config.defaults.order[0]
		@numloads=@config.defaults.order.length
		for o in @config.defaults.order
			#console.log(o)
			e=$("<div class='box'></div>")
			@boxes[o]=new crosslet.BoxView(e,@config.dimensions[o],@,o)
			@boxes[@active].setActive(true)
			$(@el).append(e)
		@renderMap=_.debounce(@_renderMap,200)
		return @boxes

	loaded: ()->
		@numloads=@numloads-1
		#console.log("Loads left: "+@numloads)
		@createCube() if @numloads==0

	_renderMap: ()=>
		abox=@boxes[@active]
		adata=abox.getFilteredData()
		keys=@intersection(_.map(_.values(@boxes),(b) ->_.keys(b.getFilteredData()).sort()))
		out={}
		out[k]=adata[k] for k in keys
		@parent.renderMap(out,((v) -> @config.defaults.colorscale(abox.config.scale(v))),abox.config.hover)
		return @

		#@parent.renderMap(abox.getFilteredData(),(v) -> @config.defaults.colorscale(abox.config.scale(v)))
	setActive: (activeBox)=>
		#console.log("Setting active to "+activeBox)
		if activeBox!=@active
			@boxes[@active].setActive(false)
			@active=activeBox
			@boxes[@active].setActive(true)
			@renderMap()
			

	intersection: (a) ->
		intersect_safe = (a,b) ->
			ai = bi= 0
			result = []
			while  ai < a.length and bi < b.length 
					ai++ if a[ai] < b[bi]
					bi++ if a[ai] > b[bi]
					if a[ai]==b[bi]
						result.push(a[ai])
						ai++
						bi++
			return result
		switch a.length
			when 0 then a
			when 1 then a[0]
			when 2 then intersect_safe(a[0],a[1])
			else
				out=a[0]
				out = intersect_safe(out,o) for o in a[1..]
				return out
	createCube: () =>
		@rows=[]
		

		t1=new Date().getTime()
		#console.log("Starting intesrsection")
		keys=_.map(_.values(@boxes),(b) ->_.keys(b.data).sort())
		t15=new Date().getTime()
		#console.log("keys took "+d3.format(",")(t15-t1)+" ms")
		int=@intersection(keys)
		for key in int
			row={}
			for bName, box of @boxes
				row[bName]=box.data[key]
			@rows.push(row)
		t2=new Date().getTime()
		#console.log("Intersection took "+d3.format(",")(t2-t1)+" ms")
		@cube = crossfilter(@rows)
		getRounder=(m1,m2,w) -> t=10*(m2-m1)/(w); return (d) ->t*Math.floor(+d/t)
		groups={}
		@charts={}
		#renderAll= (method)=> _.each(_.values(@charts),(c)-> c.call(method)); return true
		
		for bName, box of @boxes
			d=@cube.dimension((d) -> d[bName])
			dg=d.group(getRounder(box.interval[0],box.interval[1],@width-20))

			chart=barChart()
				.dimension(d)
				.name_id(bName)
				.group(dg)
				.x(d3.scale.linear().domain(box.interval).rangeRound([0,@width-20]))
				.tickSize(box.config.tickSize)
				.tickFormat(box.config.axisformat(box.config))
				.fill(@config.defaults.colorscale)
			chart.on("brush",@renderCubes)
			chart.on("brushend",@renderCubes)
			@charts[bName]=chart
			box.chart=chart
		@renderCubes()
		return @
	
	renderCubes: () =>
		for bName, box of @boxes
				box.chart(box.graph)
				$(box.el).on("mousedown",box.event_click)
				box.setFilter(box.chart.filter(), false)			
		abox=@boxes[@active]
		abox.setFilter(abox.chart.filter(),false)
		@renderMap()
		return @

class crosslet.BoxView extends Backbone.View
	initialize: (el,config, parent,name) ->
		@el=el
		$(@el)[0].onmousedown = $(@el)[0].ondblclick = L.DomEvent.stopPropagation;
		$(@el).on("mousedown",@event_click)
		@legend=$("<div class='legend'></div>")
		@legendForm=$("<div class='legendForm'></div>")
		@legendText=$("<div class='legendText'></div>")
		@legend.append(@legendText).append(@legendForm)
		$(el).append(@legend)

		@graph=$("<div class='graph'></div>")
		$(el).append(@graph)
		@config=config
		id=(d) -> d
		idf=(d) -> id
		@config.format = ((data) -> d3.format(",.2f")) if not @config.format
		@config.axisformat = @config.format if not @config.axisformat
		@config.preformat= idf if not @config.preformat
		@config.inputformat=idf if not @config.inputformat
		@config.renderForm = @defaultRenderForm if not @config.renderForm
		@config.renderText = @defaultRenderText if not @config.renderText
		@config.submitForm = @defaultSubmitForm if not @config.submitForm
		@config.method=d3.tsv if not @config.method
		@config.load_url_func = if _.isFunction(@config.load_url) then @config.load_url else ((d) -> d.load_url)
		@config.field_func= if _.isFunction(@config.field) then @config.field else ((d) -> d.field)
		@config.tickSize = 5 if not @config.tickSize
		@config.cinputformat=@config.inputformat(@config)
		#@config.hover=((data,value) => data.properties[@config.map.geo.name_field] + " - " + @config.format(@config)(value)) if not @config.hover
		@parent=parent
		@ds=parent.ds
		@active=false
		@name=name
		#debugger;
		@parent.ds.loadData(@config.load_url_func(@config), @dataLoaded,@config.method)

	dataLoaded: () =>
		@data={}
		f=@config.field_func(@config)
		console.log("Field is "+f)
		for id, val of @parent.ds.data
			@data[id]=@config.preformat(@config)(val[f]) if val[f]
		@range=[_.min(_.values @data), _.max(_.values @data)]
		@interval=[_.min(_.values @data), _.max(_.values @data)]
		#console.log("Interval is")
		#console.log(@interval)
		@config.scale=d3.scale.quantize().domain(@range).range([0..20]) if not @config.scale
		@render()
		@parent.loaded()

	defaultRenderForm: (d,el) =>
		f= if d.title then d.title else d.field_func(d)
		html='<h2>'+f+'<h2>'
		#' Fucking syntax checker
		size=_.max(_.map(@interval,(d) -> ("_"+d).length-1))
		html=html+"Range: <input type='text' name='m0' size='"+size+"' value='"+@interval[0]+"'> &ndash; <input type='text' name='m1' size='3' value='"+@interval[1]+"'>"
		el.html(html)
	defaultRenderText: (d,el) =>
		f= if d.title then d.title else d.field_func(d)
		html='<h2>'+f+'</h2>'
		#' Fucking syntax checker
		html=html+"<p><span class='m0'>"+d.format(d)(@interval[0])+"</span> &ndash; <span class='m1'>"+d.format(d)(@interval[1])+"</span></p>"
		el.html(html)
	defaultSubmitForm: (d,el)=>
		return {}
	setActive: (isActive) =>
		@active=isActive
		if isActive
			$(@el).addClass("selected")
		else
			$(@el).removeClass("selected")
	
	event_click: (event) =>
		#console.log("Active")
		@parent.setActive(@name) if not @active 
		return true

	setFilter: (f,redrawCube=false) =>
		if f
			@filterElements[0].val(@config.cinputformat(f[0]))
			@filterElements[1].val(@config.cinputformat(f[1]))
			$(@legend).find(".m0").text(@config.format(@config)(f[0]))
			$(@legend).find(".m1").text(@config.format(@config)(f[1]))
		else
			@filterElements[0].val(@config.cinputformat(@interval[0]))
			@filterElements[1].val(@config.cinputformat(@interval[1]))
			$(@legend).find(".m0").text(@config.format(@config)(@interval[0]))
			$(@legend).find(".m1").text(@config.format(@config)(@interval[1]))
		#console.log(@filterElements[0].val())
		if redrawCube
		 	@chart.filter(f) 	
		 	@parent.renderCubes()
		return @
	getFilteredData: () ->
		return @data if not @chart.filter()
		f=@chart.filter() ? @interval
		out={}
		out[k]=v for k,v of @data when f[0]<=v<=f[1]
		return out
	render: () ->
		@config.renderForm(@config,@legendForm)
		@config.renderText(@config,@legendText)
		@filterElements=[$(@legend).find("input[name=m0]"),$(@legend).find("input[name=m1]")]

		#console.log(@filterElements)
