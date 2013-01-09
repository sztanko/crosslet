#Class for transforming the data into the usable form
class crosslet.DataStore
	data: {}
	geometries: null
	isGeoLoaded: false
	isDataLoaded: false

	constructor: (initData) ->
		@geoURL=initData.map.geo.url
		@version=initData.data.version
		@idField=initData.data.id_field ? "id"
		@geoIdField=initData.map.geo.id_field ? "id"
		#console.log(@geoIdField)
		window.dataloader = new crosslet.DataLoader() if not window.dataloader
		#@projection=initData.projection
		@l=window.dataloader
		
	addData: (data,callback) ->
		#debugger
		for d in data
			#debugger if d[@idField]=='F85679'
			@data[d[@idField]]={} if not @data[d[@idField]]
			for k,v of d
				@data[d[@idField]][k]=+v if not _.isNaN(+v)
		@isDataLoaded=true
		callback(data) if callback

	loadData: (url, callback, method) ->
		method= d3.tsv if not method
		@l.load url, method, (data) =>
			@addData(data,callback)
		return @

	get_bounds_topo: (c) ->
		o=[]
		for f in [_.min,_.max]
			a=[]
			for i in [0,1]
				a.push(f _.map c,(d) -> f _.map d.coordinates[0],(dd)  ->dd[i])
			o.push(a)
		return o

	loadGeo: (url, geoIdField, callback, topo_objectName) =>
		@l.load url, d3.json, (t) =>
			if t.arcs
				t=topojson.object(t,t.objects[topo_objectName])
				@geometries=t.geometries
				#console.log(@geometries)
				#@bounds=@get_bounds_topo(@geometries)
				#debugger;
			else
				@geometries=t.features
			@bounds=d3.geo.bounds(t)
			#console.log(@bounds)
			for f in @geometries
				#console.log(f)
				if f.properties
					if not @data[f.properties[@geoIdField]]
						@data[f.properties[@geoIdField]]=f.properties
					else 
						@data[f.properties[@geoIdField]]=jQuery.extend(true, @data[f.properties[@geoIdField]], f.properties)
					@data[f.properties[@geoIdField]].bbox=d3.geo.bounds(f)
			#@path = d3.geo.path().projection(@projection)
			@isGeoLoaded=true
			callback(@) if callback
			return @


#Class for loading/caching data
#TODO: add IndexeDB support
class crosslet.DataLoader
	cache: {}
	status: {}
	callbackList: {}
	constructor: (version) ->
		version=1+".0" if not version
		@version=version
		@indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;

	load: (url, method,callback) ->
		urlv=url+@version
		@callbackList[urlv]=[] if not @callbackList[urlv]
		@status[urlv]="init" if not @status[urlv]
		@callbackList[urlv].push(callback) if callback
		#console.log("Status of "+url+" is "+@status[urlv])
		if urlv in @cache
			@executeCallbacks(@callbackList[urlv],@cache[urlv])
			return @
		else
			if @status[urlv]!="loading"
				@status[urlv]="loading"
				method(url, (data) =>
					@cache[urlv]=data
					@executeCallbacks(@callbackList[urlv],@cache[urlv])
					@status[urlv]="done"
					return @
					)

		return @

	executeCallbacks: (list,data) ->
		#console.log("There are "+list.length+" callbacks in the list")
		while list.length>0
			list.pop()(data)
