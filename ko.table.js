(function(ko){

	/**
	 *
	 */
	ko['table'] = {
		'containerClasses': {
	        'wrapper': 'ko-table',
	        'head': 'ko-table-head',
	        'body': 'ko-table-body',
	        'foot': 'ko-table-foot',
	        'corner': 'ko-table-corner',
	        'paging': 'ko-table-paging'
    	},
    	'translation': {
    		'of': 'von',
    		'entries': 'Einträgen'
    	}
	};

	/**
	 *
	 */
	ko['bindingHandlers']['table'] = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

			var root = {
				page: ko.observable(0),
				pagesize: ko.observable(10)
			};
			root.data = ko.observable();

			valueAccessor()['root'] = root;
    		
    		ko.computed(function () {
    			// TODO cleanup and error handling
    			var c = valueAccessor().ajax(root.page(), root.pagesize()).then(function (data) {
    				if(data)for(var i = 0; i < data.length; i++){
    					if(data[i])data[i]['stripe'] = {
    						odd: i % 2 !== 0,
    						even: i % 2 === 0
    					};
    				}

            		root.data(data);
        		});
    		}).extend({ throttle: 300 });

			var dom = scaffoldTable(element);

			if(dom.page){
				var pageCtx = bindingContext.createChildContext(
            		new PagingViewModel(dom.page, valueAccessor, root),
            		null,
            		function(context) {}
            	);
        		ko.applyBindingsToDescendants(pageCtx, dom.page);
			}

			dom.foreach = function(){
				return {
					data: root.data,
		            afterRender: function () {
		                ko['table']['reflow']();
		            }
				};
			};
			ko.utils.domData.set(element, ko['table']['containerClasses']['wrapper'], dom);

			ko.bindingHandlers.foreach.init(dom.body, dom.foreach, allBindingsAccessor, viewModel, bindingContext);
        	return { controlsDescendantBindings: true };
    	}, update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
    		var dom = ko.utils.domData.get(element, ko['table']['containerClasses']['wrapper']);
    		ko.bindingHandlers.foreach.update(dom.body, dom.foreach, allBindingsAccessor, viewModel, bindingContext);
    	}	    	
	};

	var boundResize = false;

	/**
	 *
	 */
	ko['table']['reflow'] = function() {
		if(!boundResize){
			ko.utils.registerEventHandler(window, 'resize', ko['table']['reflow']);	
			boundResize = true;
		}
		// do reflow

		var tables = document.getElementsByClassName(ko['table']['containerClasses']['wrapper']);
		for(var i = 0; i < tables.length; i++){
			var data  = ko.utils.domData.get(tables[i], ko['table']['containerClasses']['wrapper']);
			var table = new TableRepresentation();
			table.addSegment(0, data.head.childNodes);
            table.addSegment(1, data.body.childNodes);	
            table.sizeTable(tables[i].offsetWidth - getScrollbarWidth() - 1);
		}
	};

	var scrollbarWidthCache = null;

	/**
	 * 
	 */
	function getScrollbarWidth() {
		if(scrollbarWidthCache !== null)return scrollbarWidthCache;

	    var outer = document.createElement("div");
	    var inner = document.createElement("div");
		document.body.appendChild(outer);

		// Without scrollbars
	    outer.style.visibility = "hidden";
	    outer.style.width = "100px";
	    var widthNoScroll = outer.offsetWidth;

	    // With scrollbars
	    outer.style.overflow = "scroll";
	    inner.style.width = "100%";
	    outer.appendChild(inner);        
	    var widthWithScroll = inner.offsetWidth;

	    outer.parentNode.removeChild(outer);
	    return scrollbarWidthCache = (widthNoScroll - widthWithScroll);
	}

	/**
	 *
	 */
	function scaffoldTable(table) {
		
		var parts = table.childNodes;
		var parent = table.parentNode;

		var head = null;
		var body = document.createElement('tbody');
		var foot = null;

		var scrollwidth = getScrollbarWidth();

		for(var i = 0; i < parts.length; i++){
			var name = (parts[i].tagName|| '').toLowerCase();
			if(name === 'thead'){
				head = parts[i];
			}else if(name === 'tbody'){
				body = parts[i];
			}else if(name === 'tfoot'){
				foot = parts[i];
			}
		}

		// wrap table containing tbody

		var wrapper = document.createElement('div');
		ko.utils.toggleDomNodeCssClass(wrapper, ko['table']['containerClasses']['wrapper'], true);
		parent.insertBefore(wrapper, table);
		
		var bodyDiv = document.createElement('div');
		ko.utils.toggleDomNodeCssClass(bodyDiv, ko['table']['containerClasses']['body'], true);
		wrapper.appendChild(bodyDiv);
		bodyDiv.appendChild(table);

		// thead to other table and wrap

		if(head) {
			var first = document.createElement('div');
			var headT = table.cloneNode(false);
			first.appendChild(headT);
			headT.appendChild(head);
			wrapper.insertBefore(first, bodyDiv);
			ko.utils.toggleDomNodeCssClass(first, ko['table']['containerClasses']['head'], true);

			// append corner
			var corner = document.createElement('div');
			ko.utils.toggleDomNodeCssClass(corner, ko['table']['containerClasses']['corner'], true);
			first.appendChild(corner);
			corner['style']['width'] = (scrollwidth-1)+'px';
		}

		// tfoot to other table and wrap

		if(foot) {
			var last = document.createElement('div');
			var footT = table.cloneNode(false);
			last.appendChild(footT);
			footT.appendChild(foot);
			wrapper.appendChild(last);
			ko.utils.toggleDomNodeCssClass(last, ko['table']['containerClasses']['foot'], true);
		}

		// Scroll event

		ko.utils.registerEventHandler(bodyDiv, 'scroll', function(event){
			head.parentNode.style['left'] = -bodyDiv.scrollLeft + 'px';
		});	

		// paging controlls

		var pagination = document.createElement('div')
		ko.utils.setHtml(pagination, [
		    '<span class="paging" data-bind="html: state"></span>',
		    '<span class="info">',
		    '  <span></span>',
		    '  <!--ko text: infoItems() --><!--/ko--> ',
		       ko['table']['translation']['of'],
		    '  <!--ko text: infoCount() --><!--/ko--> ',
		       ko['table']['translation']['entries'],
		    '</span>'
		].join(''));
		ko.utils.toggleDomNodeCssClass(pagination, ko['table']['containerClasses']['paging'], true);
		wrapper.appendChild(pagination);

		var result = {
			page: pagination,
			head: head,
			body: body,
			foot: foot
		};
		ko.utils.domData.set(wrapper, ko['table']['containerClasses']['wrapper'], result);
		return result;
	}

	/**
	 *
	 */
	function PagingViewModel(element, valueAccessor, root){
		var self = this;
        this.state = ko.computed(function () {
            var current = root.page();
            var pageCount = Math.max(Math.ceil(valueAccessor().size() / root.pagesize()), 1);
            if (current >= pageCount) {
                root.page(pageCount - 1);
                current = pageCount - 1;
            }
            var result = '';
            result += '<span class="last-left ' + (current > 0 ? '' : 'deactive') + '"></span>';
            result += '<span class="next-left ' + (current > 0 ? '' : 'deactive') + '"></span>';
            if (current > 4) {
                result += '<span class="more-left">...</span>';
            }
            var start = Math.floor(current / 5) * 5;
            var end = Math.min(pageCount, start + 5);
            for (var i = start; i < end; i++) {
                if (i === current) {
                    result += ' <span class="page active">';
                } else {
                    result += ' <span class="page">';
                }
                result += i + 1 + '</span>';
            }
            if (pageCount > start + 5) {
                result += '<span class="more-right">...</span>';
            }
            result += '<span class="next-right ' + (current < pageCount - 1 ? '' : 'deactive') + '"></span>';
            result += '<span class="last-right ' + (current < pageCount - 1 ? '' : 'deactive') + '"></span>';
            return result;
        });

        this.infoCount = function () {
            return valueAccessor().size();
        };
        this.infoItems = function () {
            var start = root.page() * root.pagesize() + 1;
            var end = start + root.pagesize() - 1;
            return start + " - " + end;
        };
        this.pageCount = function () {
            return Math.ceil(valueAccessor().size() / root.pagesize());
        };
        this.moreLeft = function () {
            return Math.floor(root.page() / 5) * 5 - 1;
        };
        this.moreRight = function () {
            return this.moreLeft() + 5 + 1;
        };

        function hasClass(el, cls) {
			return el.className && new RegExp("(\\s|^)" + cls + "(\\s|$)").test(el.className);
		}

        ko.utils.registerEventHandler(element, 'click', function (e) {
        	var targ = e.target || e.srcElement;
			if (targ.nodeType == 3) targ = targ.parentNode; // defeat Safari bug

			if(hasClass(targ, 'last-left')){
				if (root.page() > 0) root.page(0);
			}else if(hasClass(targ, 'next-left')){
				if (root.page() > 0) root.page(root.page() - 1);
			}else if(hasClass(targ, 'last-right')){
				if (root.page() < self.pageCount() - 1) root.page(self.pageCount() - 1);
			}else if(hasClass(targ, 'next-right')){
				if (root.page() < self.pageCount() - 1) root.page(root.page() + 1);
			}else if(hasClass(targ, 'page')){
				var page = root.page();
                var wantedPage = parseInt(targ.innerHTML, 10) - 1;
                if (page !== wantedPage) root.page(wantedPage);
			}else if(hasClass(targ, 'more-left')){
                if (self.moreLeft() >= 0) root.page(self.moreLeft());
			}else if(hasClass(targ, 'more-right')){
                if (self.moreRight() < self.pageCount()) root.page(self.moreRight());
			}
        });
	}

	// Layout algorithm

	function filterNodes(array) {
		var result = [];
		for(var i = 0; i < array.length; i++){
			var name = (array[i].tagName||'').toLowerCase();
			if(name === 'td' || name === 'th' || name === 'tr' ) {
				result.push(array[i]);
			}
		}
		return result;
	}

	/**
     * Contains column layout information
     * @constructor
     */
    function ColumnRepresentation(index) {

        // The index of this column in the table
        this.columnIndex = index;

        // Contains all indexes of columns that share overlapping cells (colspan).
        // Connected columns share the same array.
        this.connectedColumns = [index];

        // This array contains all the cells that are in or span over this column
        // in the order in which they appear.
        this.containsCells = [[]]; // [segment][cellcount] = cell
    }

    function mergeArray(left, right){
    	var result = [];
    	var hashed = {};
    	for(var i = 0; i < left.length; i++){
    		if(!hashed[left[i]])result.push(left[i]);
    		hashed[left[i]] = true;
    	}
    	for(var j = 0; j < right.length; j++){
    		if(!hashed[right[j]])result.push(right[j]);
    		hashed[right[j]] = true;
    	}
    	return result;
    }

    ColumnRepresentation.prototype.connect = function (other) {

        var merged = mergeArray(this.connectedColumns, other.connectedColumns);
        this.connectedColumns = merged;
        other.connectedColumns = merged;
    }

    ColumnRepresentation.prototype.addCell = function (segment, row, cell) {
        if (!this.containsCells[segment]) this.containsCells[segment] = [];
        this.containsCells[segment][row] = cell;
    };

    // Get the first cell which ends in this column. This cell will be styled
    // to have the correct width. Returns array for table segments.
    ColumnRepresentation.prototype.getFirstCellEnding = function () {
        var result = [];
        for (var s = 0; s < this.containsCells.length; s++) {
            var segementCells = this.containsCells[s];
            for (var i = 0; i < segementCells.length; i++) {
                var cell = segementCells[i];
                if (cell && cell.endsInColumn(this.columnIndex)) {
                    result[s] = cell;
                    break;
                }
            }
        }
        return result;
    };

    /**
     * Contains cell information
     * @constructor
     */
    function CellRepresentation(index, segment, row, element) {

        // The column index where this cell starts
        this.index = index;

        // The cell dom element
        this.element = element;

        // Read attributes
        this.colspan = parseInt(element.getAttribute('colspan') || 1);
        var dataWidth = parseFloat(element.getAttribute('data-width'));
        this.expansionFactor = 0;

        // Data width is no number
        if (!dataWidth && dataWidth !== 0) {
            dataWidth = 1;
        }

        // Treat small data width as an expansion factor
        if (dataWidth < 10) {
            this.expansionFactor = this.colspan * Math.max(dataWidth, 0);
            dataWidth = null;
        }

        this.getWidth = function () {
        	element.style['minWidth'] = '';
        	element.style['maxWidth'] = '';
            return dataWidth === null ? element.offsetWidth : dataWidth;
        };

        this.expand = function (maxTotalColspan, columns) {
            var newColspan = maxTotalColspan - this.index;
            element.setAttribute('colspan', newColspan);
            for (var i = 0; i < newColspan - this.colspan; i++) {
                var index = this.index + this.colspan + i - 1;
                columns[index].addCell(segment, row, this);
            }
        };
    }

    CellRepresentation.prototype.endsInColumn = function (index) {
        return index === (this.index + this.colspan - 1);
    };

    /**
     * Used to remember table data
     * @constructor
     */
    function TableRepresentation() {
        var reserved = {};
        var maxTotalColspan = 0;
        this.endingCells = [];
        this.columns = [];
        var segementCounter = 0;

        this.isReserved = function (row, column) {
            return !!reserved[row + "-" + column];
        };

        this.reserve = function (row, column) {
            reserved[row + "-" + column] = true;
        };

        this.startNewTableSegement = function () {
            reserved = {};
            segementCounter++;
        };
    }

    TableRepresentation.prototype.getNextUnreserved = function (row, column) {
        var extra = 0;
        while (this.isReserved(row, column + extra)) {
            extra++;
        }
        return column + extra;
    };

    TableRepresentation.prototype.expandAllLastCells = function () {
        for (var i = 0; i < this.endingCells.length; i++) {
            this.endingCells[i].expand(this.columns.length, this.columns);
        }
    };

    TableRepresentation.prototype.addSegment = function (segment, rows) {
        var self = this;
        for(var rowIndex = 0; rowIndex < rows.length; rowIndex++){
        	var row = rows[rowIndex];
        	var elements = filterNodes(row.childNodes);
            if (!elements.length) continue;
            var colIndex = 0;
            var cell;
            for (var i = 0; i < elements.length; i++) {
                cell = new CellRepresentation(colIndex, segment, rowIndex, elements[i]);
                for (var j = 0; j < cell.colspan; j++) {
                    if (!self.columns[colIndex + j]) {
                        self.columns[colIndex + j] = new ColumnRepresentation(colIndex + j);
                    }
                    self.columns[colIndex + j].addCell(segment, rowIndex, cell);
                }
                colIndex = self.getNextUnreserved(rowIndex, colIndex + cell.colspan);
            }
            self.endingCells.push(cell);
        }
        this.startNewTableSegement();
    };

    TableRepresentation.prototype.findMinWidth = function () {
        var totalWidth = 0;
        var totalExpansionFactor = 0;
        for (var i = 0; i < this.columns.length; i++) {
            var width = 0;
            var factor = 1000;
            if (!this.columns[i]) continue;
            var cells = this.columns[i].getFirstCellEnding();
            for (var j = 0; j < cells.length; j++) {
                width = Math.max(width, cells[j].getWidth());
                factor = Math.min(factor, cells[j].expansionFactor);
            }
            this.columns[i].width = width;
            this.columns[i].expansionFactor = factor;
            totalWidth += width;
            totalExpansionFactor += factor;
        }
        return {
            width: totalWidth,
            expansionFactor: totalExpansionFactor
        };
    };

    TableRepresentation.prototype.distributeExtraWidth = function (tableWidth, total) {
        var totalExtra = tableWidth - total.width;
        var overflow = 0;

        if (totalExtra <= 0) return;
        for (var i = 0; i < this.columns.length; i++) {
            var extra = totalExtra / total.expansionFactor * this.columns[i].expansionFactor;
            extra += overflow;
            overflow = extra % 1;
            if (overflow > 0.99999) {
                overflow = 0;
                extra++;
            }
            this.columns[i].extra = Math.floor(extra);
        }
    };

    TableRepresentation.prototype.sizeTable = function (totalWidth) {
        this.distributeExtraWidth(totalWidth, this.findMinWidth());
        for (var i = 0; i < this.columns.length; i++) {
            if (!this.columns[i]) continue;
            var cells = this.columns[i].getFirstCellEnding();
            for (var j = 0; j < cells.length; j++) {
                var width = this.columns[i].width + (this.columns[i].extra || 0);
                cells[j].element.style['minWidth'] = width + 'px';
                cells[j].element.style['maxWidth'] = width + 'px';
            }
        }
    };

}(ko));