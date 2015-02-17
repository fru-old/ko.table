/**
 * 
 */
function normalizeTable(table, invisible){
	var row = table.iterator();

	var eachColSpan = []; // The width of each row
	var lastElement = []; // The last element of each row
	var connections = {}; // Stores connected columns

	var isRow = function(row){ return row.is('tr'); };
	var isCol = function(col){ return col.is('td') 
						           || col.is('th'); };

	// This function returns the first cell that ends at a
	// specific column. These can then be sized.
	var result = []; 

	// This object is used to store rowspan information
	var reserved = []; 
	var colindex = 0;
	var rowindex = 0;

	while(row = row.next(isRow)){

		var col = row.iterator();
		while(col = col.next(isCol)){

			// Iterate reserved: get first unreserved

			if(reserved[rowindex]){
				while(reserved[rowindex][colindex]){
					colindex++;
				}
			}

			var colspan = col.attr('colspan') || 1;
			var rowspan = row.attr('rowspan') || 1;

			// Reserve row spanning cells

			if(rowspan > 1){
				for(var r = 1; r < rowspan; r++){
					for(var c = 0; c < colspan; c++){
						var rcurrent = reserved[r+rowindex] || [];
						rcurrent[c+colindex] = true;
						reserved[r+rowindex] = rcurrent;
					}	
				}
			}

			// Update connection info

			if(colspan > 1){
				for(var c = 0; c < colspan; c++){
					var ccurrent = connections[c+colindex] || {};
					for(var d = 0; d < colspan; d++){
						if(c != d)ccurrent[d+colindex] = true;						
					} 
					connections[c+colindex] = ccurrent;					
				}
			}

			// Disable style

			col.style['minWidth'] = '';
        	col.style['maxWidth'] = '';

			colindex += colspan;

			col.toggleClass('hide-col', invisible[colindex-1]);
			result[colindex-1] = result[colindex-1] || col;

			lastElement[rowindex] = col;
			eachColSpan[rowindex] = colindex;
		}	

		colindex = 0;
		rowindex++;
	}

	// Expand the last cell in a row

	for(var i = 0; i < lastElement.length; i++){
		var difference = eachColSpan[i] - result.length;

		if(lastElement[i] && difference){
			if(!lastElement[i].attr('colspan')){
				lastElement[i].attr('colspan', difference + 1);
			}
		}
	}

	table.data('ko-ui-connections', connections);

	return result;
}




