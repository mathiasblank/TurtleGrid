// - tGrid
// - created by mab
// - version 1.0
// - Responsive grid system

$.fn.hasAnyClass = function() {
    for (var i = 0; i < arguments.length; i++) {
        var classes = arguments[i].split(" ");
        for (var j = 0; j < classes.length; j++) {
            if (this.hasClass(classes[j])) {
                return true;
            }
        }
    }
    return false;
};

(function($) {

	String.prototype.captialize = function() {
		return this.charAt(0).toUpperCase() + this.substring(1, this.length);
	}

	String.prototype.convertToClass = function(prefix, sufix) {
		var words = this.split(' ');
		if (typeof prefix != 'string') {
			prefix = '';
		}
		if (typeof sufix != 'string') {
			sufix = '';
		}
		var c = '';
		for (var i = 0; i < words.length; i++) {
			c += i > 0 ? words[i].captialize() : words[i];
		};
		return prefix + c + sufix; 		
	}

    $.dynamicSort = function(property, order) {
	    var sortOrder = (order == 1 || order == -1) ? order : 1;
	    return function (a,b) {
	        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
	        return result * sortOrder;
	    };
   	};

	$.fn.margin = function() {
		var $this = $(this);
		return {
			top: $this.outerHeight(true) - $this.outerHeight(),
			left: $this.outerWidth(true) - $this.outerWidth()
		};
	}

	var ftGrid = function(container, settings) {

		// - arguments
		this.container = container;
		this.$container = $(container);
		this.settings = settings;

		// - string type
		this.currentSize = '';
		this.lastSize = '';
		this.leftPercentage = '';
		this.debugData = '<h1>tGrid error</h1>';
		this.boxClasses = '';
		this.spacingType = '%';

		// - int type
		this.nbPerLine = 0;
		this.nbChildren = 0;
		this.maxCol = 0;
		this.nbCompactElements = 0;
		this.nbCompactFailed = 0;
		this.sameCompactOccurence = 0;
		this.debug = 0;
		
		// - Array or object type
		this.matrix = [];			// - virtual location of elements
		this.grid = [];				// - elements information
		this.sizes = [];			// - real size of the element (after screen display)
		this.errors = {};
		this.indexes = {};
		this.$loader;

		// - boolean type
		this.isInit = true;
		
		this.init();
	};

	ftGrid.prototype={

		init:function() {
			var current = this;

			current.controlGridSystem();

			// - Callback before init
			if (typeof current.settings.callbacks === 'object' && typeof current.settings.callbacks.beforeInit === 'function') {
				current.settings.callbacks.beforeInit();
			}

			current.currentSize = current.lastSize = current.getResponsiveSize();

			// - Check if elements must be ignored, set the z-index and define if elements are draggable (HTML attribute)
			var z = current.settings.zIndex,
				skippedClasses = typeof current.settings.skippedClasses !== typeof undefined && current.settings.skippedClasses !== '' ? current.settings.skippedClasses : '';
			current.$container.children().each(function() {
				if (skippedClasses === '' || !$(this).hasAnyClass(skippedClasses)) {
					$(this).addClass('tg').css({
						zIndex : z,
						opacity : 0
					});
					if (!current.settings.allowDraggable)
						$(this).children().attr('draggable', false);
					z++;
				}
			});

			// - Set the container to relative
			current.$container.css('position', 'relative');

			current.setBoxes();

			if (current.settings.slider[0]) {
				var o = {};

				if (current.debug > 0) {
					console.log('tSlider has been activated');
				}

				if (typeof current.settings.slider[1] == 'object') {
					o = current.settings.slider[1];
				}
				if (typeof o.childClasses !== typeof undefined) {
					o.childClasses += ' tg-s';
				} else {
					o.childClasses = 'tg-s';
				}
				var slider = function() {
					current.$container.tSlider(o);
				};
				current.updateGrid(false, slider);
			} else {
				current.updateGrid(false);
			}

			$(window).resize(function() {
				current.currentSize = current.getResponsiveSize();

				// - Update the top of each element when they're only one column
				if ($(window).width() > current.$container.width()) {
					current.nbCompactFailed = current.nbCompactElements = 0;
					current.updateGrid(true);
				}
				if (current.currentSize != current.lastSize) {
					// - Callback before resize grid
					if (typeof(current.settings.callbacks) == 'object' && typeof(current.settings.callbacks.beforeResizeGrid) == 'function')
						current.settings.callbacks.beforeResizeGrid();

					var i = 0,
						k = 0,
						l = current.$container.find('.tg').length;
					current.nbCompactFailed = current.nbCompactElements = 0;

					var e = current.setElementsWidth();
					current.setBoxes();

					// current.$container.find('.tg').each(function() {
					// 	$(this).css({
					//  		top : 0,
					//  		left: 0,
					//  		opacity: 0,
					//  		width: e
					//  	});
					// });

					current.lastSize = current.currentSize;
						
				}
				current.updateGrid(true);
			});


			var options = {};

		   	// - overlay detail
		   	if (typeof current.settings.slider !== typeof undefined && current.settings.slider[0]) {
		   		if (typeof current.settings.slider[1] !== typeof undefined && typeof current.settings.slider[1] == 'object' && typeof current.settings.slider[1].theme !== typeof undefined && current.settings.slider[1].theme !== '') {
		   			options.theme = current.settings.slider[1].theme;
		   		}
		   		options = $.extend(current.settings.slider[1], options);
		    }

		    // - Hide the loader when the timeout is reached.
			if ( typeof current.settings.loader !== typeof undefined && 
				typeof current.settings.loader[0] == 'boolean' && 
				current.settings.loader[0] && 
				typeof current.settings.loader[1] == 'object'
			) {
				var delay = (typeof current.settings.loader[2] == 'number') ? parseInt(current.settings.loader[2]) + 3000 : 1500 + 3000;
				var s = setTimeout(function() {
					current.settings.loader[1].fadeOut(300);
					clearTimeout(s);
				}, delay);
			}

		},

		// - Filter boxes' classes
		checkClasses:function(boxesClasses) {
			var current = this;
			current.$container.children().each(function() {
				var $element = $(this);
				var	has_caption = $(this).find('.caption').length > 0,
					has_zoom = $(this).find('.detail').length > 0;
				// - Delete classes that haven't any function
				if (boxesClasses !== '') {
					var b = boxesClasses.split(' ');
					$(this).removeClass().addClass('tg');
					$.each(b, function(key, val) {
						if (
							(!has_caption && val.indexOf('tg-c') != -1) 
							|| (!has_zoom && val.indexOf('ts-h') != -1) 
							|| (!current.settings.slider[0] && val.indexOf('ts-h') != -1)
						) {
							b[key] = '';
						}
					});
					b = b.join(' ').trim();
					$(this).addClass(b);
					if (has_zoom && b.indexOf('ts-h') > -1) {
						$(this).addClass('tg-s');
					}
				}
			});
		},

		// - Control if the grid options are available 
		controlGridSystem:function() {
			var current = this,
				gridsystems = current.settings.gridSystem,
				errors = 0;
			$.each(gridsystems, function(key, val) {
				if (val > current.settings.gridColumns) {
					current.debugData += ('<p>Grid system error: ' + key + ' (' + val + ')' + ' is bigger than the gridColumns value ' + '(' + current.settings.gridColumns + ') as defined in your limits options.</p>');
					errors++;	
				}
				else if (current.settings.gridColumns % val !== 0) {
					current.debugData += ('<p>Grid system error: ' + key + ' (' + val + ')' + ' isn\' t a multiple of gridColumns ' + '(' + current.settings.gridColumns + ') as defined in your limits options.</p>');
					errors++;
				}
			});
			if (errors > 0) {
				document.write(current.debugData);
				return;
			}
		},

		// - Defines the best way to display boxes
		compactElements:function(matrix) {


			console.log(matrix);

			var current = this,
				tmp_col = 0,
				cols = current.getCols(),
			// - Check if they're several higghest cols
				maxHeight = cols[cols.length - 1].height,
				minHeight = cols[0].height,
				nbMaxCol = 0,
				nbMinCol = 0;
			for (var i = 0; i < cols.length; i++) {
				if (cols[i].height == maxHeight)
					nbMaxCol++;
				else if (cols[i].height == minHeight)
					nbMinCol++;
			}

			console.log('compact');

			// - Define the rank of the columns (based on the height)
			var smallest = (nbMinCol > 0) ? cols[nbMinCol - 1] : cols[0],
				biggest = cols[cols.length - 1],
				last_big = biggest.last_element;
				last_big_pos = last_big.dom_pos,
				last_big_h = last_big.height,
				hasElement = current.getElement(matrix, smallest.col, smallest.nb);

			// console.log('---------- new loop ----------');
			// console.log('last big element');
			// console.log(last_big);
			// console.log('matrix');
			// console.log(matrix);
			// console.log('cols');
			// console.log(cols);
			// console.log('smallest');
			// console.log(smallest);
			// console.log(smallest.col);
			// console.log(smallest.nb);	
			// console.log('biggest');
			// console.log(biggest);
			// console.log(biggest.col);
			// console.log(biggest.nb);
			// console.log(last_big_pos);
			// console.log(matrix[last_big_pos]);
			// if (current.nbCompactElements == 3)
			// 	return false;

			// - Test if the the biggest col without the last element is bigger than the smallest col
			if (
				!hasElement &&
				( 
					(biggest.height - last_big_h) > smallest.height 
				 	|| (((biggest.height - last_big_h) >= smallest.height) && biggest.col > smallest.col) 
				)
			) {
				// - Set the new position into the grid
				current.grid[last_big_pos] = {
					top : parseInt(smallest.height),
					left : smallest.col * current.leftPercentage,
				};
				console.log(current.grid);
				console.log('Child: ' +  last_big_pos + ' | Grid position: ' + last_big.element.attr('data-colRow') + ' has been moved to ' + smallest.col + '-' + smallest.nb);
				current.$container.children('.tg').eq(biggest.last_element.dom_pos).attr('data-colRow', smallest.col + '-' + smallest.nb);
			}
			else
				current.nbCompactFailed++;
			current.nbCompactElements++;

			// - recursive function
			if (current.nbCompactElements < current.settings.ecompact[1] && current.nbCompactFailed < current.settings.ecompact[2])
				current.compactElements(matrix);
		},

		// - Animate boxes
		eAnimation:function($element, queue) {
			var current = this;
			if (typeof current.settings.animation !== typeof undefined && current.settings.animation[0] && current.isInit) {
				queue = (current.settings.animation[3]) ? queue : 1;	// - is_alternate
				var animation = current.settings.animation[1],
					speed = current.settings.animation[2];

				if (!current.isInit || !current.settings.animation[0]) {
					animation = 'none';
				} else if (current.isInit && current.settings.animation[0]) { // - Custom per size
					sizeAnimation = current.settings.animation[4];
					if (typeof sizeAnimation !== typeof undefined && typeof sizeAnimation[current.currentSize] !== typeof undefined)
						animation = sizeAnimation[current.currentSize];					
				}

				console.log(animation);

				switch(animation) {



					// - alternate card distribution
					case 'Animation-1' : 
						$element.toggleClass('tg-na').animate({
							opacity: 0
						}, speed * queue, function() {
							$element.toggleClass('tg-na').addClass('tg-a');
						});		
						break;
					// - alternate static rotate opening
					case 'Animation-2' :
						$element.animate({
							opacity: 0
						}, speed * queue, function() {
							$(this).animate({
								marginLeft: 0
							}, speed, function() {
								$element.addClass('tg-a-rotate tg-a');
							});
						});		
						break;
					// - Use your own on animated function
					case 'Animation-custom' : 
						current.settings.animation_custom_fct($element, queue);
						break;
					default : 
						$element.css({opacity:1});
						break;
				}				
			} else {
				$element.css({opacity:1});
			}
		},

		// - Defines the belonging of each box
		getCols:function() {
			var current = this,
				i = 0,
				cols = [];
			current.$container.find('.tg').each(function() {
				var data = $(this).attr('data-colRow').split('-');
				var col = data[0];
				var h = $(this).outerHeight(true);
				var element = $(this);
				if (typeof cols[col] === typeof undefined) {
					cols[col] = {
						nb : 1,
						height : h,
						col : col,
						ele : [element],
						last_element : {element : element, height : h, dom_pos : i}
					};
				}
				else {
					cols[col].nb++;
					cols[col].height += h;	
					cols[col].ele.push(element);
					if (current.grid[i].top > current.grid[cols[col].last_element.dom_pos].top)
						cols[col].last_element = {element : element, height : h, dom_pos : i};
				}
				i++;
			});
			cols.sort($.dynamicSort('height'));
			return cols;
		},

		getIndex:function(methodName) {
			return this.indexes[methodName];
		},

		// - Define the current size type
		getResponsiveSize:function() {
			var current = this,
				size = '',
				window_width = $(window).width();
			if (window_width >= current.settings.limits.lg)
				size = 'lg';
			else if (window_width >= current.settings.limits.md && window_width < current.settings.limits.lg)
				size = 'md';
			else if (window_width >= current.settings.limits.sm && window_width < current.settings.limits.md)
				size = 'sm';
			else
				size = 'xs';
			$.fn.tGrid.currentSize = size;
			return size;
		},

		// - Get an element (based on the data-colrow attribute)
		getElement:function(elements, col, row) {
			var current = this;
			for (var i = 0; i < elements.length; i++) {
				var colRow = current.$container.children('.tg').eq(i).attr('data-colRow');
				if (colRow == col + '-' + row)
					return elements[i];
			}
			return false;
		},

		// - Get the element's untiy OR an array with the unity and the value (split => true)
		getUnityType:function(element, split) {
			var type = element.indexOf('%') != -1 
				? '%' 
				: element.indexOf('px') != -1
					? 'px'
					: '';
			return split ? [element.split(type)[0], type] : type;
		},

		// - Define wherewith the grid system want to be created (HTML, JSON, XML) and prepares boxes
		setBoxes:function() {
			var current = this,
				boxesClasses = '',
				index = 1;
			current.setIndex(arguments.callee.name);
			var init = current.getIndex(arguments.callee.name) == 1;

			if (typeof current.settings.boxClasses !== typeof undefined && typeof current.settings.boxClasses[0] == 'string') {
				var is_custom = (typeof current.settings.boxClasses[2] == 'object' && current.settings.boxClasses[2] !== '');
				boxesClasses = current.settings.boxClasses[0];
				if ( typeof current.settings.boxClasses[1] == 'object' && 
					typeof current.settings.boxClasses[1][current.currentSize] !== typeof undefined
					&& current.settings.boxClasses[1][current.currentSize] !== ''
				) {
					boxesClasses += ' ' + current.settings.boxClasses[1][current.currentSize];
				}
			}

			console.log(boxesClasses);

			// - Check if the user have use the caption option to define classes. It overrides them define in boxClasses
			if (typeof current.settings.caption !== typeof undefined) {

				// - Search text animation
				if (
					typeof current.settings.caption.text_animation == 'boolean'
					|| (typeof current.settings.caption.text_animation == 'object' && typeof current.settings.caption.text_animation[current.currentSize] == 'boolean')
				) {
					var ref = typeof current.settings.caption.text_animation == 'boolean' ? current.settings.caption.text_animation : current.settings.caption.text_animation[current.currentSize];
					var already_class = boxesClasses.indexOf('tg-cc-animation') > -1;
					// - Add or remove the text animation class
					if (!already_class && ref) {
						boxesClasses += ' tg-cc-animation';
					} else if (already_class && !ref) {
						boxesClasses = boxesClasses.replace('tg-cc-animation', '');
					}	
				}

				// - Search theme
				console.log(typeof current.settings.caption.theme);
				if (
					typeof current.settings.caption.theme == 'string'
					|| (typeof current.settings.caption.theme == 'object' && current.settings.caption.theme !== null && typeof current.settings.caption.theme[current.currentSize] == 'string')
				) {
					var ref = typeof current.settings.caption.theme == 'string' ? current.settings.caption.theme : current.settings.caption.theme[current.currentSize];
					var is_custom = ref.indexOf('.') > -1;
					boxesClasses = boxesClasses.replace(/tg\-ct\-\w+/ig, '');
					boxesClasses += is_custom ? ' ' + ref.replace('.', '') : ' tg-ct-' + ref; 
				}

				// - Search effect  
				if (
					typeof current.settings.caption.effect == 'string'
					|| (typeof current.settings.caption.effect == 'object' && current.settings.caption.effect !== null && typeof current.settings.caption.effect[current.currentSize] == 'string')
				) {
					var ref = typeof current.settings.caption.effect == 'string' ? current.settings.caption.effect : current.settings.caption.effect[current.currentSize];
					var is_custom = ref.indexOf('.') > -1;
					boxesClasses = boxesClasses.replace(/tg\-c\-\w+/ig, '');
					boxesClasses += ref.indexOf('.') > -1
						? ' ' + ref.replace('.', '')
						: ' ' + ref.convertToClass('tg-c-');
				} else if (
					typeof current.settings.caption.effect === null
					|| (typeof current.settings.caption.effect == 'object' && current.settings.caption.effect !== null && typeof current.settings.caption.effect[current.currentSize] === null)
				) {
					boxesClasses = boxesClasses.replace(/tg\-c\-\w+/ig, '');
					boxesClasses += 'tg-c-no';
				}

			}

		 	// - Clean spaces
		 	boxesClasses = boxesClasses.trim().replace(/\s{2,}/ig, ' ');


		 	console.log(boxesClasses);


			if (current.isInit) {
				// - Construct boxes with XML, JSON or (default) HTML
				switch (current.settings.source[0].toLowerCase()) {
					case 'xml' :
						if (typeof current.settings.source[1] == 'string') {
							current.$container.empty();
							$.get(current.settings.source[1], function(data) {
								$(data).find('box').each(function(data) {
									var $box = $('<div></div>').addClass(boxesClasses).addClass('tg').hide(),
										$content = $(this).find('content');
									if ($content.length > 0) {
										$box.append($content.html().trim());
										var $caption = $(this).find('caption');
										if ($caption.length > 0) {
											var $type = $(this).find('type');
											if ($type.length > 0) {
												$children = $caption.children();
												if ($children.length > 0) {
													$captionContent = $('<div></div>');
													if ($type.html().trim() == 'slider') {
														$captionContent.addClass('detail');
														$box.addClass('tg-s');
													} else {
														$captionContent.addClass('caption');
													}
													$children.each(function() {
														$captionContent.append($(this)[0]['outerHTML']);
													});	
													$box.append($captionContent);
												}
											}
										}
										current.$container.append($box);
									}
								});
								current.checkClasses(boxesClasses);
							}).fail(function() {
								alert('XML error - The following XML file path: ' + current.settings.source[1] + ' doesn\'t exist! A valid path is required.');
								return false;
							});
						}
						break;
					case 'json' : 
						if (typeof current.settings.source[1] == 'object' && current.settings.source[1].length > 0) {
							current.$container.empty();
							$.each(current.settings.source[1], function() {
								var $obj = $(this)[0],
									$box = $('<div></div>');
								if ((typeof $obj.content == 'string' && $obj.content !== '') || typeof $obj.content == 'object') {
									$box.addClass('tg').hide();
									if (typeof $obj.content == 'string') {
										$box.append($obj.content);
									} else if (typeof $obj.content == 'object') {
										$.each($obj.content, function(key, val) {
											$box.append(val);
										});
									}
									if (typeof $obj.type == 'string' && $obj.type !== '') {
										var $caption = $('<div></div>'),
											count = (typeof $obj.caption == 'object') ? $obj.caption.length : 0,
											has_caption = false;
										if ($obj.type == 'slider') {
											$caption.addClass('detail');
											$box.addClass('tg-s');
											has_caption = true;
										}
										else if ($obj.type == 'gallery') {
											if (count > 0) {
												$caption.addClass('caption');
												has_caption = true;
											}
										}
										if (has_caption && count > 0) {
											$.each($obj.caption, function(key, val) {
												$caption.append(val);
											});
											$box.append($caption);
										}
									}
								}
								current.$container.append($box);
							});
							current.checkClasses(boxesClasses);
						}
						break;
					default :
						current.checkClasses(boxesClasses);
						break;
				}
			} else {
				current.checkClasses(boxesClasses);
			}
		},

		// - Open the container after the matrix has been defined
		setContainerHeight:function(speed) {
			// - Set the max height of the container
			var current = this,
				cols = current.getCols(),
				maxHeight = cols[cols.length - 1].height;

			current.$container.animate({
				height : maxHeight + 'px',
			}, speed);
		},

		// - Place each box on its right place
		setElements:function(init) {

			var current = this,
				col = 0,
				row = 0,
				y = 0, 
				k = 0,
				grid = current.grid,
				is_break = false,
				t = init ? 100 : 500;

			current.$container.show();

			// - Callback before Animated
			if (typeof current.settings.callbacks == 'object' && typeof current.settings.callbacks.beforeAnimated == 'function' && !init)
				current.settings.callbacks.beforeAnimated();

			// - Display each box
			current.$container.find('.tg').each(function() {

				if ($(this).queue().length > 10)
					$(this).stop(true, true);

				current.eAnimation($(this), y);

				var colRow = $(this).attr('data-colRow'),
					dataCol = colRow[0],
					space = (typeof current.settings.horizontalSpacing !== typeof undefined && dataCol > 0) ? (current.settings.horizontalSpacing).replace(current.spacingType, '') : 0,
				 	left = (current.leftPercentage * dataCol) + (space * dataCol) + current.spacingType;
				
				$(this).animate({
					top : grid[y].top,
					left : left
				}, t);				
					
				y++;
				if (col == (current.nbPerLine - 1)) {
					col = 0;
					row++;
				} else {
					col++;
				}
			});
			current.isInit = false;
		},

		// - Defines the width of each element of the grid (pixel [px] or pourcentage [%] could be used)
		setElementsWidth:function() {
			var current = this,
				elementsSpacing = current.settings.horizontalSpacing;
			if (typeof elementsSpacing !== typeof undefined && current.nbPerLine > 1) {
				var widthNoSpacing = 0,
					horizontalSpacing = 0;
				var mesureType = current.getUnityType(elementsSpacing);
				if (mesureType = '%') {
					horizontalSpacing = elementsSpacing.replace('%', '') * 1;
					elementsSpacing = horizontalSpacing;
					widthNoSpacing = 100 - ((current.nbPerLine - 1) * horizontalSpacing);
					current.leftPercentage = widthNoSpacing / current.nbPerLine;
					current.spacingType = mesureType;
				} else if (mesureType = 'px') {
					var containerWidth = current.$container.outerWidth(true);
					horizontalSpacing = elementsSpacing = elementsSpacing.replace('px', '') * 1;
					widthNoSpacing = containerWidth - ((current.nbPerLine - 1) * horizontalSpacing);
					current.leftPercentage = widthNoSpacing / current.nbPerLine;
					current.spacingType = mesureType;
				} else {
					alert('Horizontal spacing: please, use "px" or "%" value!');
				}
				return current.leftPercentage + current.spacingType;
			} else {
				current.spacingType = '%';
				current.leftPercentage = (current.settings.gridSystem[current.currentSize] * 100) / current.settings.gridColumns;
			}
			return (current.settings.gridSystem[current.currentSize] * 100) / current.settings.gridColumns;		
		},

		// - Update the method index (number of use)
		setIndex:function(methodName) {
			if (typeof this.indexes[methodName] === typeof undefined) {
				this.indexes[methodName] = 0;
			}
			this.indexes[methodName]++;
		},

		// - Log system
		setErrors:function(i, key, msg) {

			var current = this;

			if (typeof current.errors[i]=== typeof undefined) {
				current.errors[i] = {};
			}

			current.errors[i][key] = msg;
			console.log(current.errors);
		},

		// - Prepare boxes for the matrix according to the grid size
		updateGrid:function(init, callback) {

			var current = this,
				fctName = arguments.callee.name;

			current.setIndex(fctName);
			var fctID = current.getIndex(fctName);

			if (fctID != current.getIndex(fctName))
				return false;

			current.sizes = [];
			current.nbPerLine = current.settings.gridColumns/current.settings.gridSystem[current.currentSize];
			current.leftPercentage = (current.settings.gridSystem[current.currentSize] * 100) / current.settings.gridColumns;
			current.matrix = [];
			current.grid = [];
			current.nbChildren = current.$container.children().length;
			current.maxCol = Math.ceil(current.nbChildren / current.nbPerLine);		

			// - Create a loader if needed
			if (typeof current.$loader === typeof undefined) {
				if (typeof current.settings.loader !== typeof undefined && current.settings.loader[0] && current.settings.loader[1]) {
					current.$loader = $(current.settings.loader[1]);
					if ($('body').find(current.settings.loader[1]).length === 0)
						current.$container.append(current.$loader);
					else
						current.$loader.fadeIn(200);
				} else {
					current.$loader = $('<div id="t_loader"></div>');
					current.$container.append(current.$loader);
				}
			}

			if (!init) {

				current.$container
				.imagesLoaded()
				.always( function( instance ) {

					// if (current.debug > 0) {
						console.log('Images has been loaded');
					// }

					current.setElementsWidth();



					current.$container.css({opacity : 1}).stop(true, false);

					var $boxes = current.$container.find('.tg');
					var nb_boxes = $boxes.length;
					var cols = [],	
						row = 0,
						col = 0,
						left = 0,
						i = 0;


					$boxes.each(function() {

						var $box = $(this);

						$box.show().animate({
					 		opacity: 0,
					 		width: current.leftPercentage + current.spacingType
					 	}, 501, function() {

						 	current.sizes.push($box.outerHeight(true)); // - add the box's height to the matrix

							if (fctID != current.getIndex(fctName)) return false;

							if (current.settings.grayscale) {
								$box.addClass('grayscale');
							}

							$box.addClass('tg-transition');

							$box.attr('data-colRow', col + '-' + row);

							current.matrix.push({
								element : $box,
								pos : i,
								col : col,
								row : row,
								index: i,
								height : $box.outerHeight(true)
							});

							console.log($box.height());
							console.log($box.outerHeight(true));
							console.log($box);

							
							if (row > 0) {
								if (row == 1)
									cols[col] = colElements = 0;	
								var height = parseInt(current.sizes[i - current.nbPerLine]);
								cols[col] += height;
								var tmp = {'top' : cols[col]};
								current.grid.push(tmp);
							} else {
								$box.css({top: 0});
								current.grid.push({'top' : 0});
							}

							// - update the col and row index
							if (col == (current.nbPerLine - 1)) {
								col = 0;
								row++;
							} else {
								col++;
							}
		
							if (i == $boxes.length - 1) {
								if (current.nbPerLine > 1 && current.settings.ecompact[0]) {
									current.compactElements(current.matrix);
								}

								if (!init) {
									var t = (typeof current.settings.loader !== typeof undefined && typeof current.settings.loader[2] === 'number') ? current.settings.loader[2] : 300;
									current.$loader.fadeOut(t, function() {
										current.setContainerHeight(500);
										current.setElements(init);
									});						
								} else {
									current.setContainerHeight(0);
									current.setElements(init);
								}
							}
							i++;
					 	});
						
					});

					if (typeof callback == 'function') {
						callback();
					}
				})
				.progress( function( instance, image ) {
					var loaded = image.isLoaded;
					console.log('load');
					if (!loaded) {
						var $parent = $(image.img).closest('.tg');
						var index = $parent.index();
						current.setErrors(index, 'image not found', image.img.src);
						$parent.remove();
					}
				});
			} else {

				current.setElementsWidth();
				current.$container.css({opacity : 1}).stop(true, false);

				var $boxes = current.$container.find('.tg');
				var nb_boxes = $boxes.length;
				var cols = [],	
					row = 0,
					col = 0,
					left = 0,
					i = 0;


					// var s = setTimeout(function() {

				$boxes.each(function() {

					var $box = $(this);

					$box.show().css({
				 		opacity: 0,
				 		width: current.leftPercentage + current.spacingType
				 	});

				 	current.sizes.push($box.outerHeight(true)); // - add the box's height to the matrix

					if (fctID != current.getIndex(fctName)) return false;

					if (current.settings.grayscale) {
						$box.addClass('grayscale');
					}

					$box.attr('data-colRow', col + '-' + row);

					current.matrix.push({
						element : $box,
						pos : i,
						col : col,
						row : row,
						index: i,
						height : $box.outerHeight(true)
					});

					
					if (row > 0) {
						if (row == 1)
							cols[col] = colElements = 0;	
						var height = parseInt(current.sizes[i - current.nbPerLine]);
						cols[col] += height;
						var tmp = {'top' : cols[col]};
						current.grid.push(tmp);
					} else {
						$box.css({top: 0});
						current.grid.push({'top' : 0});
					}

					// - update the col and row index
					if (col == (current.nbPerLine - 1)) {
						col = 0;
						row++;
					} else {
						col++;
					}
					i++;
				});

				if (current.nbPerLine > 1 && current.settings.ecompact[0]) {
					console.log(current.matrix);
					current.compactElements(current.matrix);
				}

				current.$loader.fadeOut();
				current.setContainerHeight(0);
				current.setElements(init);

				if (typeof callback == 'function') {
					callback();
				}

						// clearTimeout(s);
					// }, 501);



			}
		}

	}
	ftGrid.prototype.constructor = ftGrid;

	// - Plugin options
	$.fn.tGrid = function(options) {
		var settings = $.fn.tGrid.settings = $.extend({}, $.fn.tGrid.defaults, options);
		return this.each(function() {
       		new ftGrid(this, settings);
   		});
   	};	

	$.fn.tGrid.defaults = {
		allowDraggable : false,
		animation : [
			false, 			// - init active
			'Animation-1', 	// - name
			0,			// - speed
			false, 			// - alternate
			{}
			// {				// - Animation per size for init
			// 	'xs' : 'none',
			// 	'md' : 'Animation-1',
			// 	'lg' : 'Animation-custom'
			// },
		],
		animation_custom_fct : function($element, queue) {
			$element.addClass('tg-a');
			console.log("The custom animation function is now activated, you can now add your own animation. Don't forget to use $element parameter to target the animated object and the queue to make alternate animation!");	
		},
		// auto_fill : [true, $('<div class="tgrid-f"></div>')],
		boxClasses: [
			'tg-c-slideRight tg-ct-dark ts-h-fade tg-ht-light tg-cc-animation',		// - classes each size
			// {}												// - classes per size (additional)
			{							
				lg : 'ts-h-scaleIn lg',
				md : 'ts-h-scaleOut md',
				sm : 'ts-h-bounce sm',
				xs : 'ts-h-no tg-c-no'
			},
		],
		caption: {
			text_animation: false,
			theme: 'dark',
			effect: 'slide down',
		},
		callbacks : {
			// beforeInit : function() {alert('beforeinit');},
			// beforeResizeGrid : function() {alert('beforeResizeGrid');},
			// beforeAnimated : function() {alert('before animated');},
		},
		slider : [
			true,		// - active
			// {
			// 	// theme : 'mg-ot-light',
			// 	// is_slider : true,
			// 	// has_thumbnails : true,
			// 	// has_full : true
			// }
		],
		ecompact : [
			true,	// - active
			20,		// - max tries
			5   	// - max fails
		],	
		grayscale : false,
		gridColumns : 12,
		gridSystem : {
			xs : 6,
			sm : 4,
			md : 3,
			lg : 2
		},
		horizontalSpacing : '3%',	// - % or px
		// - You can define vertical spacing with the CSS
		limits : {
			xs : 480,
			sm : 768,
			md : 992,
			lg : 1200			
		},
		loader : [
			true,	// - activate
			// $('<div id="loader">loading in progress..</div>'),
			'#loader',		// - loader selector
			0	// - delay before display boxes
		],
		skippedClasses : '',
		source : [
			'HTML', // - JSON / XML / HTML
			// 'xml/boxes.xml' // - path
			// [
			// 	{
			// 		content : ['<img src="img/photos/1.jpg">', '<img src="img/photos/1.jpg">'],
			// 		caption : ['<h3>Title</h3>', '<p>description...</p>'],
			// 		type : 'gallery',

			// 	},				
			// 	{
			// 		content : '<img src="img/photos/12.jpg">',
			// 		caption : ['<h3>My title</h3>', '<p>description...</p>'],
			// 		type : 'slider'
			// 	}
			// ]
		],  
		zIndex : 200,
	};
	$.fn.tGrid.settings = {};
	$.fn.tGrid.currentSize = '';

})(jQuery);