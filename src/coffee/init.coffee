crosslet={}
if not _
	console.log("Please include underscore.js")

crosslet.createConfig= (defaultConfig,config) ->
	c=jQuery.extend(true,jQuery.extend(true, {}, defaultConfig),config)

crosslet.id= (d) -> d
crosslet.idf= (d) -> id
crosslet.notimplemented = () -> throw("This function is not set. Please check your config."); 
crosslet.changeSelect= (select, val) ->
	$(select).find("option").filter(() ->
		console.log($(this).val())
    	return $(this).val() == val
		).attr('selected', true)
crosslet.defaultConfig=
		map:
			leaflet:
				key: "fe623ce312234f8f9333bbee72d4a176"
				styleId: 64657
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
			view:
				center: [51.505, -0.09]
				zoom: 11
			geo:
				url: "please specify correct location of your geojson"
				name_field: "name"
				id_field: "code"	
	data:
		version: "1.0"
		id_field: "id"
	dimensions: {}
	defaults:
		colorscale: d3.scale.linear().domain([1,10,20]).range(["green","yellow", "red"]).interpolate(d3.cie.interpolateLab);
		opacity: 0.75
		order: []

crosslet.defaultDimensionConfig=
	p: {}
	data:
		interval: null
		filter: null
		field: (d) -> d.id
		dataSet: crosslet.notimplemented
		method: d3.tsv
		preformat: (dd) -> ((d) -> +d)
		tickSize: 5
		colorscale: d3.scale.linear().domain([1,10,20]).range(["green","yellow", "red"]).interpolate(d3.cie.interpolateLab);
	format:
		short: (d) -> d3.format(",.2f")
		long: (d) -> d.format.short(d)
		input: (d) -> d.format.short(d)
		axis: (d) -> d.format.short(d)
	render:
		legend: (d,el) ->
			f= if d.title then d.title else d.data.field_func(d)
			html= '<h2>' +f+ '<h2>' 
			el.html(html)			
		range: (d,el) ->
			html= "<p><span class='m0'>"+d.format.short(d)(d.filter[0])+"</span> &ndash; <span class='m1'>"+d.format.short(d)(d.filter[1])+"</span></p>"
			el.html(html)
		form: (d,el) ->
			el.html("")
		rangeForm: (d,el) ->
			size=_.max(_.map(d.data.interval,(dd) ->("_"+d.format.input(d)(dd)).length-1))
			html= "Range: <input type='text' name='m0' size='"+size+"' value='"+d.format.input(d)(d.filter[0])+"'> &ndash; <input type='text' name='m1' size='3' value='"+d.format.input(d)(d.filter[1])+"'>"
			el.html(html)
	submitter: (d,el) -> 
		out={}
		$(el).find("input, select").each((index,el) -> out[$(el).attr("name")]=$(el).val())
		#console.log(out)
		return out
