config=
	map:
		leaflet:
			key: "fe623ce312234f8f9333bbee72d4a176"
			styleId: 64657
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
		view:
			center: [51.505, -0.09]
			zoom: 11
		geo:
			url: "data/lsoa.json"
			name_field: "ward"
			id_field: "code"	
	data:
		version: "1.0"
		id_field: "id"
		
	dimensions: 
		imd:
			title: "Index of Multiple Deprivation"
			data:
				dataSet: "data/imd.tsv"
				field: "imd"
			format: 
				short: (data) -> return ((f) -> Math.round(f*100)/100)
				axis: (data) -> Math.round
			#render: (data,container) -> $(container).html($("#templates .imd").html())
		crime:
			title: "Crime figures"
			data:
				dataSet: "data/imd.tsv"
				field: "crime"
			format:
				short: (data) -> return ((f) -> Math.round(f*100)/100)

		income:
			title: "Income Deprivation"
			data:
				dataSet: "data/imd.tsv"
				field: "income"
			format: 
				short: (data) -> return ((f) -> Math.round(f*100)/100)
		price:
			p:
				bedrooms: 1
				type: "sale"
			data:
				dataSet: "data/prices.tsv"
				field: (d) -> d.p.type+"_"+d.p.bedrooms
				preformat: (d) -> if d.p.type=='rent' then ((dd) -> +dd*12/52) else ((dd) -> +dd)
			render:
				form: (data,container) -> 
					$(container).html($("#templates .price").html())
					crosslet.changeSelect($(container).find("[name=type]"),data.p.type)
					crosslet.changeSelect($(container).find("[name=bedrooms]"),data.p.bedrooms)

			format: 
				short: (data) ->
					if data.p.type=='sale'
						return (v) -> "£"+d3.format(",.0f")(v/1000)+"k"
					else
						return (v) -> "£"+d3.format(",.0f")(v)+" per week"
				input: (data) -> return Math.round
				axis: (data) ->
					if data.p.type=='sale'
						return (v) -> "£"+d3.format(",.0f")(v/1000)+"k"
					else
						return (v) -> "£"+d3.format(",.0f")(v)
	defaults:
		colorscale: d3.scale.linear().domain([1,12,20]).range(["green","yellow", "red"]).interpolate(d3.cie.interpolateLab);
		opacity: 0.7
		order: ["imd","crime","income","price"]
		active: "imd"
