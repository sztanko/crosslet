crosslet={}
if not _
	console.log("Please include underscore.js")

crosslet.createConfig= (defaultConfig,config) ->
	c=jQuery.extend(true,jQuery.extend(true, {}, defaultConfig),config)

crosslet.id= (d) -> d
crosslet.idf= (d) -> crosslet.id
crosslet.notimplemented = () -> throw("This function is not set. Please check your config."); 
crosslet.changeSelect= (select, val) ->
	$(select).find("option").filter(() ->
		#console.log($(this).val())
		return $(this).val() == val
		).attr('selected', true)
crosslet.defaultConfig=
		map:
			leaflet:
				key: "--your key--" #Obtain your own key at http://developers.cloudmade.com/projects
				styleId: 64657 #Get any style from here: http://maps.cloudmade.com/editor
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
			view:
				center: [51.505, -0.09] #thats center of London. 
				zoom: 11 #zoomlevel for abig city
			geo:
				url: "please specify correct location of your geojson" #the geojson file. Please make sure it is not larger then 2-3MB. 
				name_field: "name" #the field in properties of each feature that is a name of the area
				id_field: "code" # code of the area. This will be the join key of the data
				topo_object: "please specify correct object name"
	data:
		version: "1.0" # data will be kept in cache. Increase the number if you want to use new datasets
		id_field: "id" # area code will be used for joining with geo.id_field
	dimensions: {} # see crosslet.defaultDimensionConfig
	defaults:
		colorscale: d3.scale.linear().domain([1,10,20]).range(["green","yellow", "red"]).interpolate(d3.cie.interpolateLab);
		opacity: 0.75
		order: [] # order of data boxes

crosslet.defaultDimensionConfig=
	p: {} # here we store parameters of the box. That's for advanced usage.
	filter: null #initial filter of the data
	data:
		interval: null
		filter: null
		field: (d) -> d.id
		dataSet: crosslet.notimplemented # this can be either a url, a function that returns a url or an object
		method: d3.tsv # what is the data format of the file? Use d3.tsv or d3.csv
		preformat: (dd) -> ((d) -> +d)
		ticks: 4 # how many ticks do you want to see on the scale. 
		colorscale: d3.scale.linear().domain([1,10,20]).range(["green","yellow", "red"]).interpolate(d3.cie.interpolateLab) # color scale of data
		exponent: 1
	format:
		short: (d) -> d3.format(",.2f") # used to display in ranges
		long: (d) -> d.format.short(d) # use to display on hover
		input: (d) -> d.format.short(d) # how to show it in the filter inputs
		axis: (d) -> d.format.short(d) # the format of axis
	render:
		legend: (d,el) -> # thats the title of the box
			f= if d.title then d.title else d.data.field_func(d)
			html= '<h2>' +f+ '</h2>' 
			el.html(html)			
		range: (d,el) -> # that's the part which shows the current range
			html= "<p><span class='m0'>"+d.format.short(d)(d.filter[0])+"</span> &ndash; <span class='m1'>"+d.format.short(d)(d.filter[1])+"</span></p>"
			el.html(html)
		form: (d,el) ->	# the part that renders the parameter form. By default there are no parameters.
			d.render.legend(d,el)
		rangeForm: (d,el) -> # form for rendering the range inputs
			size=_.max(_.map(d.data.interval,(dd) ->("_"+d.format.input(d)(dd)).length-1))
			html= "Range: <input type='text' name='m0' size='"+size+"' value='"+d.format.input(d)(d.filter[0])+"'> &ndash; <input type='text' name='m1' size='3' value='"+d.format.input(d)(d.filter[1])+"'>"
			el.html(html)
	submitter: (d,el) -> 
		out={}
		$(el).find("input, select").each((index,el) -> out[$(el).attr("name")]=$(el).val())
		#console.log(out)
		return out
