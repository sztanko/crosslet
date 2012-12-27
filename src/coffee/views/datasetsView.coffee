class crosslet.PanelView extends Backbone.View
	initialize: (el, config,parent) ->
		@config=crosslet.createConfig(crosslet.defaultConfig,config)
		@parent=parent
		@el=el
		@ds=parent.ds
		@boxes={}
		@render()
		@width=200
		@active= if @config.defaults.active then @config.defaults.active else @config.defaults.order[0]
		@numloads=@config.defaults.order.length
		for o in @config.defaults.order
			#console.log(o)
			e=$("<div class='box'></div>")
			@boxes[o]=new crosslet.BoxView(e,@config.dimensions[o],@,o)
			$(@el).append(e)
		@boxes[@active].setActive(true)
		@renderMap=_.debounce(@_renderMap,200)
		return @boxes

	loaded: ()->
		@numloads=@numloads-1
		#console.log("Loads left: "+@numloads)
		@createCube() if @numloads<=0

	_renderMap: ()=>
		abox=@boxes[@active]
		adata=abox.getFilteredData()
		keys=@intersection(_.map(_.values(@boxes),(b) ->_.keys(b.getFilteredData()).sort()))
		out={}
		out[k]=adata[k] for k in keys
		f=abox.config.format.long(abox.config)
		@parent.renderMap(out,((v) -> abox.config.data.colorscale(abox.config.scale(v))),(data,value) => data.properties[@config.map.geo.name_field] + " - " + f(value))
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
		brushevent= (box,ctx) -> 
			() -> box.event_click(); ctx.renderCubes()
		for bName, box of @boxes
			`var chart, js_box,js_bName`
			js_box=box
			js_bName=bName
			d=@cube.dimension((dd) -> dd[bName])
			dg=d.group(getRounder(box.config.data.interval[0],box.config.data.interval[1],@width-20))
			
			box.graph.empty()
			chart=barChart()
				.dimension(d)
				.name_id(bName)
				.group(dg)
				.x(d3.scale.linear().domain(box.config.data.interval).rangeRound([0,@width-20]))
				.tickSize(box.config.data.tickSize)
				.tickFormat(box.config.format.axis(box.config))
				.fill(box.config.data.colorscale)
			chart.on("brush",brushevent(box,@))
			chart.on("brushend",@renderCubes)
			box.chart=chart
			
			@charts[bName]=chart
			#debugger;
		@renderCubes()
		for o in @config.defaults.order
			@boxes[o].setFilter(@config.dimensions[o].filter,true) if @config.dimensions[o].filter
		return @
	
	renderCubes: () =>
		#console.log("renderCubes")
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
		@config=crosslet.createConfig(crosslet.defaultDimensionConfig,config)
		@config.id=name
		@config.data.field_func = if not _.isFunction(@config.data.field) then ((d) -> d.data.field) else @config.data.field
		$(@el).on("mousedown",@event_click)
		$(@el).on("tap",@event_click)
		$(@el)[0].onmousedown = $(@el)[0].ondblclick = L.DomEvent.stopPropagation;
		@legend={}
		@legend.all=$("<div class='legend'></div>")
		@legend.text=$("<div class='legendText'></div>")
		@legend.text_p=$("<div class='legendText'></div>")
		@legend.text_range=$("<div class='legendRange'></div>")
		@legend.text.append(@legend.text_p).append(@legend.text_range)
		@legend.form=$("<div class='legendForm'></div>")
		@legend.form_p=$("<div class='legendForm_p'></div>")
		@legend.form_range=$("<div class='legendForm_range'></div>")
		@legend.form.append(@legend.form_p).append(@legend.form_range)
		@legend.all.append(@legend.text).append(@legend.form)
		$(el).append(@legend.all)

		@graph=$("<div class='graph'></div>")
		$(el).append(@graph)
		@parent=parent
		@ds=parent.ds
		@active=false
		@name=name
		@loadData()
		#debugger;
	loadData: ()->
		if _.isString(@config.data.dataSet)
			#console.log("Thats an url")
			@parent.ds.loadData(@config.data.dataSet, @dataLoaded,@config.data.method)
		else 
			if _.isFunction(@config.data.dataSet)
				#console.log("Thats a function")
				@parent.ds.loadData(@config.data.dataSet(@config), @dataLoaded,@config.data.method)
			else
				#console.log("Thats an array") 
				@parent.ds.addData @config.data.dataSet, @dataLoaded

	dataLoaded: () =>
		@data={}
		f=@config.data.field_func(@config)
		#console.log("Field is "+f)
		preformatter=@config.data.preformat(@config)
		for id, val of @parent.ds.data
			@data[id]=preformatter(val[f]) if _.isNumber(val[f])
		@config.data.interval=[_.min(_.values @data), _.max(_.values @data)] if not @config.data.interval
		@config.filter=[_.min(_.values @data), _.max(_.values @data)] if not @config.filter
		#console.log("Interval is")
		#console.log(@interval)
		@config.scale=d3.scale.quantize().domain(@config.data.interval).range([0..20]) if not @config.scale
		@render()
		@parent.loaded()

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
		#console.log(@filterElements[0].val())
		if redrawCube
		 	@chart.filter(f) 	
		 	@parent.renderCubes()
		if not f
			f=@config.data.interval
		@config.filter=f
		@filterElements[0].val(@config.format.input(@config)(f[0]))
		@filterElements[1].val(@config.format.input(@config)(f[1]))
		$(@legend.text_range).find(".m0").text(@config.format.short(@config)(f[0]))
		$(@legend.text_range).find(".m1").text(@config.format.short(@config)(f[1]))
		return @
	getFilteredData: () ->
		return @data if not @chart.filter()
		f=@chart.filter() ? @config.data.interval
		out={}
		out[k]=v for k,v of @data when f[0]<=v<=f[1]
		return out
	renderRange: () ->
		@config.render.range(@config,@legend.text_range)
		@config.render.rangeForm(@config,@legend.form_range)
	render: () ->
		@config.render.legend(@config,@legend.text_p)
		@config.render.form(@config,@legend.form_p)
		@renderRange()
		$(@legend.form_range).find("input").on("change",()=>
			
			f=[+@filterElements[0].val(),+@filterElements[1].val()]
			f.reverse() if f[0]>f[1]
			f[0]=_.max([@config.data.interval[0],f[0]])
			f[1]=_.min([@config.data.interval[1],f[1]])
			f=null if _.isEqual(f,@config.data.interval)
			@setFilter(f,true)
		)
		$(@legend.form_p).find("input, select").on("change", () =>
			@config.data.interval=null
			@config.scale=null
			@config.filter=null
			p= @config.submitter(@config,@legend.form_p)
			@config.p=p
			console.log(p)
			@loadData()
			)
		@filterElements=[$(@legend.form_range).find("input[name=m0]"),$(@legend.form_range).find("input[name=m1]")]

		#console.log(@filterElements)
