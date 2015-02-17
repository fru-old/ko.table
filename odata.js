ko = ko || {};

ko.ui = (function(){
  	
	var OData = function(url, params){
		
		this.filters = [];

		if(params){
			var result = [];
			ko.utils.objectForEach(params, function(value, key){
				result.push(key+"="+OData.value(value));
			});
			url = url + '(' + result.join(',') + ')'; 
		}
		return url;
	};

	var odata = function(url, params){
		return new OData(url, params);
	};

	odata.value = function(value){
		if(value instanceof Date){
			return odata.fromDate(value);
		}
		return JSON.stringify(value);
	};

	odata.toDate = function(iso){

		if(iso instanceof Date)return iso;

		var result =  
			/^(\d{4})-(\d\d)-(\d\d)([T ](\d\d):(\d\d):(\d\d)(\.\d+)?(Z|([+-])(\d\d)(:(\d\d))?)?)?$/
		.exec(iso) || '';

		var year   = +result[1],
			month  = +result[2] - 1,
			day    = +result[3],
			noTime = !result[4],
			hour   = +result[5],
			minute = +result[6],
			second = +result[7],
			ms     = +((result[8] + '000').substr(1, 3)) || 0,
			noZone = !result[9],
			oh     = +(result[10] + result[11]) || 0,
			om     = +(result[10] + result[13]) || 0;

		if (!result) return null;
		if (noTime)  return new Date(year, month, day);
		if (noZone)  return new Date(year, month, day, hour, minute, second, ms);
		
		return new Date(Date.UTC(year, month, day, hour - oh, minute - om, second, ms));
	}

	odata.fromDate = function(date){

	    var zone = -date.getTimezoneOffset(),
	        dif  = zone >= 0 ? '+' : '-';

		function normalize(number) {
	        number = Math.abs(Math.floor(number));
	        return (number < 10 ? '0' : '') + number;
	    };

	    return date.getFullYear() 
	        + '-' + normalize( date.getMonth() + 1 )
	        + '-' + normalize( date.getDate() )
	        + 'T' + normalize( date.getHours() )
	        + ':' + normalize( date.getMinutes() ) 
	        + ':' + normalize( date.getSeconds() ) 
	        + dif + normalize( zone / 60 ) 
	        + ':' + normalize( zone % 60 );
	};

	odate.expression = function(operator, property, value){

	};

	function chain(op, args){
		for(var i = 0; i < args.length; i++){
			args[i] = '(' + args[i] + ')';
		}
		return args.join(op);
	}

	OData.prototype.filter = function(filter){

		var conditions = []; 

		for(var operator in filter){
			for(var property in filter[operator]){
				var value = odata.value(filter[operator][property]),
					condition;
				if(operator === 'contains'){
					condition = operator+'(' + property + ',' + value + ')';
				}else if(operator === 'eq'){
					condition = property + ' ' + operator + ' ' + value;
				}
				conditions.push(condition);
			}
		}
		this.filters.push(chain('or', conditions));

		var result = '';

		if(this.filter){
			this.filter = this.filter
		}else{
			this.filter = result;
		}
		return this;
	};

	OData.prototype.paging = function(take, skip, count){
		this.take  = take;
		this.skip  = skip;
		this.count = count;

		return this;
	};

	OData.prototype.toString = function(){

	};

	OData.prototype.ajax = function(){

	};

	OData.prototype.promise = function(){

	};
	
	return { odata: odata };
}());
