$(function() {

	// ------------------------------------------------------------------------------------------------------------------------------------
	// - jQuery global vars
	// ------------------------------------------------------------------------------------------------------------------------------------
		
	var $body = $('body');

	// ------------------------------------------------------------------------------------------------------------------------------------
	// - JavaScript string prototype
	// ------------------------------------------------------------------------------------------------------------------------------------
	
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

	// ------------------------------------------------------------------------------------------------------------------------------------
	// - jQuery custom plugins
	// ------------------------------------------------------------------------------------------------------------------------------------
		
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

	// ------------------------------------------------------------------------------------------------------------------------------------
	// - Main plugin
	// ------------------------------------------------------------------------------------------------------------------------------------
		
	$.fn.tGrid = function(options) {
		var settings = $.fn.tGrid.settings = $.extend({}, $.fn.tGrid.defaults, options);
		return this.each(function() {
       		new ftGrid(this, settings);
   		});
   	};	

	$.fn.tGrid.defaults = {
		animation : [

			{				// - Animation per size for init
				xs: '',
				md: 'Animation-1',
				lg: 'Animation-1',
				sm: function($element, queue) {}
			},

			// 'Animation-1', 	// - name or custom function or json object
			300,			// - speed
			true, 			// - alternate
			// {				// - Animation per size for init
			// 	'xs' : 'none',
			// 	'md' : 'Animation-1',
			// 	'lg' : 'Animation-custom'
			// },
		],

		// auto_fill : [true, $('<div class="tgrid-f"></div>')],
		boxClasses: 
		[
			'tg-c-slideRight tg-ct-dark ts-h-fade tg-ht-light tg-cc-animation',		// - classes each size
			// - classes per size (additional)
			{							
				lg: 'ts-h-scaleIn lg',
				md: 'ts-h-scaleOut md',
				sm: 'ts-h-bounce sm',
				xs: 'ts-h-no tg-c-no'
			}
		],
		caption: {
			text_animation: false,
			theme: 'dark',
			effect: 'slide down',
		},
		callbacks : {
			// beforeInit : function() {alert('beforeinit');},
			// beforeResize : function() {alert('beforeResize');},
			// beforeAnimate : function() {alert('before animate');},
			// beforeChangeResponsiveSize : function() {alert('before change responsive size');},
		},
		// slider : [
		// 	true,		// - active
		// 	// {
		// 	// 	// theme : 'mg-ot-light',
		// 	// 	// is_slider : true,
		// 	// 	// has_thumbnails : true,
		// 	// 	// has_full : true
		// 	// }
		// ],

		slider : {},

		responsiveGrid: {
			nb: 12,
			colsPerType: {
				xs: 1,
				sm: 2,
				md: 3,
				lg: 4
			}
		},

		horizontalSpacing : '10px',	// - % or px | You can define vertical spacing with the CSS
		
		limits : {
			xs: 480,
			sm: 768,
			md: 992,
			lg: 1200,			
		},
		progressBar : 'top', // - [auto / bottom / false / true / top / left / right]
		skippedClasses : 'skipped',
		source :

			'HTML' // - JSON / XML / HTML
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
		,  
		zIndex : 200,
		checkMode: {
			console: true,
			screen: true
		}
	};
	$.fn.tGrid.settings = {};
	$.fn.tGrid.currentSize = '';

	// ------------------------------------------------------------------------------------------------------------------------------------
	// - Turtle grid's main code
	// ------------------------------------------------------------------------------------------------------------------------------------
		
	var ftGrid = function(container, settings) {

		// - Plugin's Arguments
		this.container = container;
		this.$container = $(container);
		this.settings = settings;

		// - Size control
		this.currentSize = '';																					// - responsive calculated size
		this.lastSize = '';																						// - last calculated responsive size

		// - Box proprety
		this.spacingUnity = '%';																				// - spacing value type
		this.elementWidth;																						// - Defines the boxes' width
		this.elementLeftPosition = 0;																			// - Defines boxes' left position

		// - Debug
		this.debugData = [];																					// - Contains every errors or misconfiguration
		this.responsiveSizesNames = ['xs', 'sm', 'md', 'lg'];													// - Defines valid responsive names
		this.stop;																								// - Stops plugin's execution
		this.tgGridStyleSheetPath = $('head').find("link[href*='tgrid']").attr('href');							// - Define where's the main style sheet to display errors.

		// - Grid's brain
		this.first = true;																						// - Defines if the plugin is running for the first time
		this.grid = [];																							// - virtual calculated grid
		this.$elements;																							// - Stores each grid box
		this.nbPerLine = 0;																						// - Number of elements per line
		this.nbElements = 0;																					// - Number of grid's elements
		this.nbElementsPlaced = 0;																				// - Define how many elements has been places in the grid
		this.placeData = [];																					// - Main object for calculate the position of each element in the grid
		this.elementsReady = [];																				// - Contains each ready (content is loaded) box
		this.elementsDeleted = [];																				// - Contains each deleted box (invalid content)
		this.animationTime = 0;

		
		this.horizontalSpacing = 0;	
	
		// - Boxes' classes
		this.boxClassesOnce = true;																				// - Define if the user has define classes for every responsive class or for each one.										
		this.boxClasses = '';																					// - All grid's element classes

		// - Progress bar
		this.$progressBar;																						// - progress bar object reference
		this.$progressBarState;																					// - progress bar state object reference
		this.progressBarIsHozizontal = ['right', 'left'].indexOf(this.settings.progressBar) == -1;				// - Define if the progress bar is displayed horizontaly
		this.hasProgressBar = typeof this.settings.progressBar == 'string' || this.settings.progressBar;

		// - Slider
		this.hasSlider = typeof this.settings.slider == 'object';

		this.space;

		this.init();

	};

	ftGrid.prototype = {

		init:function() {
			var self = this;

			self.$container.hide();

			// - Check if the grid's options are valid
			self.controlGridSettings();

			if (self.stop) return;

			// - Callback before init
			if (typeof self.settings.callbacks === 'object' && typeof self.settings.callbacks.beforeInit === 'function') {
				self.settings.callbacks.beforeInit();
			}

			// - Prepare container
			self.$container.css('position', 'relative').hide();

			// - Initialize size control
			self.currentSize = self.lastSize = self.getResponsiveSize();

			// - Add the loader
			if (self.hasProgressBar) {
				self.setProgressBar();
			}

			// - Define the classes of grid elements
			self.setBoxClasses();

			// - Get boxes
			self.setBoxes();

			// - Set grid elements
			var z = self.settings.zIndex;
			self.$container.children().each(function() {
				var $box = $(this);
				if ( (self.settings.skippedClasses == '' || !$box.hasAnyClass(self.settings.skippedClasses)) && !$box.hasClass('tg-skipped') ) {
					$box.addClass('tg ' + self.boxClasses).css({
						zIndex : z,
						opacity : 0
					});
					z++;
				}
			});

			// - Stores grid's elements and controls classes
			self.$elements = self.$container.find('.tg');
			self.nbElements = self.$elements.length;

			self.checkBoxClasses();

			self.createVirtualGrid();

			$(window).resize(function() {

				// - Callback before resize
				if (typeof self.settings.callbacks === 'object' && typeof self.settings.callbacks.beforeResize === 'function') {
					self.settings.callbacks.beforeResize();
				}

				// - Initialize size control
				self.currentSize = self.getResponsiveSize();

				if (self.currentSize != self.lastSize) {

					// - Callback before resize
					if (typeof self.settings.callbacks === 'object' && typeof self.settings.callbacks.beforeChangeResponsiveSize === 'function') {
						self.settings.callbacks.beforeChangeResponsiveSize();
					}

					// - Define the classes of grid elements
					self.setBoxClasses();
					self.checkBoxClasses();

					self.createVirtualGrid();

					self.lastSize = self.currentSize;

				} else {
					self.createVirtualGrid(true);
				}
			});

		},

		// - Define grid elements by source type and construct boxes with XML, JSON or HTML
		setBoxes:function() {
			var self = this;
			var sourceType = typeof self.settings.source == 'object'
				? 'json'
				: self.settings.source.indexOf('.xml') > - 1
					? 'xml'
					: 'html';
			switch (sourceType) {
				case 'xml':
					self.$container.empty();
					$.get(self.settings.source, function(data) {
						$(data).find('box').each(function(data) {
							var $this = $(this);
							var $box = $('<div></div>').addClass(self.boxClasses + ' tg').hide();
							var $content = $this.find('content');
							if ($content.length > 0) {
								$box.append($content.html().trim());
								var $caption = $this.find('caption');
								if ($caption.length > 0) {
									var $type = $this.find('type');
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
								self.$container.append($box);
							}
						});
					}).fail(function() {
						alert('XML error - The following XML file path: ' + self.settings.source + ' doesn\'t exist! A valid path is required.');
						return false;
					});

					break;

				case 'json' : 
					self.$container.empty();
					$.each(self.settings.source, function() {
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
						self.$container.append($box);
					});
					break;
				default:
					break;
			}
		},

		setProgressBar:function() {

			var self = this;

			self.$progressBar = $('#tg_progress_bar');

			// - Create the loader if doesn't exist
			if (self.$progressBar.length == -1) {
				self.$progressBar = $('<div id="tg_progress_bar"></div>');
				self.$progressBar.append($('<div><div id="tg_progress_state</div></div>'));
				self.$container.append(self.$progressBar);
			}	
			self.$progressBarState = $('#tg_progress_state');

			// - Define the position of the progress bar
			var h = +self.$progressBar.outerHeight(true);

			// - Default css
			var css = {
				position: 'absolute',
				top: -h,
				width: '100%',
				left: 0
			};

			// - Style for diffrent progress bar's position
			var css_state = {};
			
			switch(self.settings.progressBar) {
				case 'right':
					css.top = 0;
					css.width = h + 'px';
					css.height = $(window).height();
					css.right = 0;
					css_state.width = '100%';
					css_state.height = '50%';
					delete css.left;
					break;

				case 'bottom':
					delete css.top;
					css.bottom = -h;
					break;

				case 'left':
					css.top = 0;
					css.width = h + 'px';
					css.height = $(window).height();
					css_state.width = '100%';
					css_state.height = '50%';						
					break;

				default:
					break;
			}

			self.$progressBarState.css(css_state);
			self.$progressBar.addClass('tg-skipped').show().css(css);
		},

		updateProgressBar:function() {
			var self = this;
			var percentage = (self.nbElementsPlaced * 100) / (self.nbElements - self.elementsDeleted.length);
			var css = self.progressBarIsHozizontal ? { width: percentage + '%' } : { height: percentage + '%' };
			self.$progressBarState.css(css);
			if (percentage == 100) {
				self.$progressBar.delay(500).fadeOut();
			}
		},

		createVirtualGrid:function(onlyTop) {

			var self = this;

			// - Reste placeData
			self.placeData = [];
			self.placeData['nbPerLine'] = self.settings.responsiveGrid.colsPerType[self.currentSize];
			self.placeData['currentCol'] = self.placeData['currentRow'] = self.placeData['nextColIndex'] = 0;
			self.placeData['cols'] = self.placeData['elements'] = [];
			self.placeData['end'] = false;

			if (self.first) {
				self.$container.css({opacity: 1}).show();
				self.elementsDeleted = [];
				self.elementsReady = [];
				self.placeElements();
				self.$elements.each(function(key) {
					// console.log($(this));
					// console.log(key);
					// return;

					var $element = $(this);
					// - Is main element an image? Need to wait to upload it
					var $mainElement = $element.children().first();
					if ($mainElement[0].tagName.toLowerCase() == 'img') {
						var has_img_error = false;
						$element.imagesLoaded().always(function(instance) {
							if (has_img_error) {
								self.$elements[key].remove();
								self.elementsDeleted.push(key);
							} else {
								self.elementsReady[key] = $element;
							}
						}).progress(function(instance, image) {
							if (!image.isLoaded) {
								has_img_error = true;
							}
						});
					} else {
						self.elementsReady[key] = $element;
					}
				});
			} else { // - Minimal function for update
				if (!onlyTop) {
					self.setElementsWidth();
				}
				self.$elements.each(function(key) {
					self.place(key, onlyTop);
				});
				self.placeData['end'] = true;
			}

			// - Callback when each element has been placed
			var s = setInterval(function() {
				if (self.placeData['end']) {

					// - In the loading mode, such elements could be deleted, so data must be updated
					if (self.first) {

						self.$elements = self.$container.find('.tg');
						self.nbElements = self.$elements.length;

						// - Init the tSlider if required
						if (self.hasSlider) {
							self.$container.tSlider(self.settings.slider);
						}

					}

					// - Update container size
					self.$container.css({
						height: Math.max.apply(Math, self.placeData['cols'])
					});

					self.first = false;

					clearInterval(s);
				}
			}, 100);
		},

		// - Manage place and order of element animation
		placeElements:function() {
			var self = this;
			var i = 0;				

			self.setElementsWidth();

			// - Loop until the next element isn't loaded
			var s = setInterval(function() {
				if (typeof self.elementsReady[self.nbElementsPlaced] !== typeof undefined) {

					// - Update the progress bar
					self.updateProgressBar();

					self.place(self.nbElementsPlaced);
					self.nbElementsPlaced++;
				} else if (self.elementsDeleted.indexOf(self.nbElementsPlaced) > -1) { // - if element has been deleted
					self.nbElementsPlaced++;
				}
				// - Stop the loop when each valid box is procced
				if (self.nbElements - self.elementsDeleted.length + 1 == self.nbElementsPlaced) {
					self.placeData['end'] = true;
					clearInterval(s);
				}

				self.animationTime += 10;

			}, 10);
		},

		// - Define the place of the element
			//  - First row no test place in order
			//  - Second and following rows place the element in the smallest col
			//  - Define the smallest col for the next element
		place:function(key, onlyTop) {

			var self = this;
			var $element = $(self.$elements[key]);

			var element = {
				width: self.elementWidth
			};

			if (!onlyTop) {
				$element.css({
					width: element.width
				});
			}

			// - Init the col array
			if (self.placeData['currentRow'] == 0 && key == 0) {
				var i = 0;
				for (var i = 0; i < self.placeData['nbPerLine']; i++) {
					self.placeData['cols'][i] = 0;
				};
			}

			// - Define the element position into the grid
			var position = {
				top: self.placeData['cols'][self.placeData['nextColIndex']],
				left: (self.placeData['nextColIndex'] * self.elementLeftPosition) + '%'
			};

		
			// if (element_col_span > 1) {

			// 	if (self.placeData['nextColIndex'] + 1 > self.placeData['nbPerLine']) {
			// 		self.placeData['nextColIndex'] = 0;
			// 	}

			// 	position.top = Math.max.apply(Math, [self.placeData['cols'][self.placeData['nextColIndex']], self.placeData['cols'][self.placeData['nextColIndex'] + 1]]);
			// 	position.left = (self.placeData['nextColIndex'] * self.elementLeftPosition) + '%';


			// 	if (!onlyTop) {
			// 		w = self.elementWidth.replace('%', '');
			// 		element.width = (w * 2) + self.space;
			// 		$element.css({
			// 			width: element.width +'%'
			// 		});
			// 	}

			// 	// if (self.placeData['currentRow'] == 0 && element_col_span > 1) {
			// 	// 	self.placeData['cols'][self.placeData['currentCol'] + 1] = 0;
			// 	// }

			// }

			element.height = $element.outerHeight(true);

			// console.log(element.height);

			// - Update the col height
			self.placeData['cols'][self.placeData['nextColIndex']] += element.height;

			// if (element_col_span > 1) {
			// 	self.placeData['cols'][self.placeData['nextColIndex'] + 1] += element.height;
			// }

			// - Define the smallest col for the next element, in the first row the next col index is simply the next row
			if (self.placeData['currentRow'] == 0 && self.placeData['nextColIndex'] < self.placeData['nbPerLine'] - 1) {
				self.placeData['nextColIndex']++;
				// self.placeData['nextColIndex'] += element_col_span;
			} else {
				// - Define the smallest col for the next element
				var smallestCol = 0;
				var selectCol = 0;
				for (var i = 0; i < self.placeData['cols'].length; i++) {
					var e = self.placeData['cols'][i];
					if (i == 0 || smallestCol > e) {
						smallestCol = e;
						selectCol = i;
					} 
				};
				self.placeData['nextColIndex'] = selectCol;
			}

			// - Update the col and row index
			if (self.placeData['currentCol'] == (self.placeData['nbPerLine'] - 1)) {
				self.placeData['currentCol'] = 0;
				self.placeData['currentRow']++;
			} else {
				self.placeData['currentCol']++;
			}

			// - Update the container height
			if (self.first) {

				self.$container.css({
					height: Math.max.apply(Math, self.placeData['cols'])
				});

				// - Callback before animation
				if (key == 0 && typeof self.settings.callbacks === 'object' && typeof self.settings.callbacks.beforeAnimate === 'function') {
					self.settings.callbacks.beforeAnimate();
				}

				// - Animate the element
				var animation = self.settings.animation[0];
				var speed = self.settings.animation[1];
				var is_alternate = self.settings.animation[2];
				var queue = key;
				var typeOfAnimation = typeof animation;

				if (typeOfAnimation == 'string' || (typeOfAnimation == 'object' && typeof animation[self.currentSize] == 'string')) {
					var name = typeOfAnimation == 'string' ? animation : animation[self.currentSize];
					
					name = 'scale up';
					var calc_speed = !is_alternate 
						? speed 
						: (speed * queue) - self.animationTime > speed 
							? (speed * queue) - self.animationTime
							: speed;
					$element.addClass(name.convertToClass('tg-load-'));
					$element.animate({
						opacity: 0,
						left: position.left,
						top: position.top
					}, calc_speed, function() {
						$element.addClass('tg-a').css({opacity: 1});
					});
				} else if (typeOfAnimation == 'function' || (typeOfAnimation == 'object' && typeof animation[self.currentSize] == 'function')) {

					console.log('function');
					var fct = typeOfAnimation == 'function' ? animation : animation[self.currentSize];
					fct($element, queue, position);

				}
			} else {
				$element.css({
					left: position.left,
					top: position.top,
					opacity: 1
				});			
			}

		},

		// - Defines the width of each element of the grid (pixel [px] or pourcentage [%] could be used)
		setElementsWidth:function() {
			var self = this;
			if (self.placeData['nbPerLine'] > 1) {
				var mesure = self.getUnityType(self.settings.horizontalSpacing, true);
				var value = mesure[0];
				var unity = mesure[1];
				self.space = unity == '%' ? value : (value * 100) / self.$container.innerWidth();
				self.elementWidth = (100 - (self.space * (self.placeData['nbPerLine'] - 1))) / self.placeData['nbPerLine'];
				self.elementLeftPosition = self.elementWidth + self.space;
				self.elementWidth += '%';
				self.spacingUnity = unity;
			} else {
				self.elementLeftPosition = 100;
				self.elementWidth = '100%';
			}
		},

		// - Control if the grid options are available.
		controlGridSettings:function() {
			var self = this;
			var nb_errors = 0;
			var option_name = '';

			// - Grid System
			option_name = 'responsiveGrid';
			self.debugData[option_name] = [];
			option = self.settings[option_name];
			optionType = typeof option;
			if (optionType != 'object') {
				self.debugData[option_name].push('The option ' + option_name + ' type must be an object with nb and colsPerType keys');
				nb_errors++;
			} else {
				$.each(option, function(key, val) {
					switch (key) {
						case 'nb':
							if (typeof option.nb != 'number') {
								self.debugData[option_name].push('The nb key value in the ' + option_name + ' option must be a number');
								nb_errors++;
								return false;
							}
							break;
						case 'colsPerType':
							if (typeof option.colsPerType != 'object') {
								self.debugData[option_name].push('The colsPerType element in the ' + option_name + ' option must be an object');
								nb_errors++;
								return;
							} else {
								// - Define if each responsive size is defined
								var has_name_error = false;
								$.each(self.responsiveSizesNames, function(k, v) {
									if (typeof option['colsPerType'][v] != 'number') {
										self.debugData[option_name].push('In the option colsPerType, the responsive size "' + v + '" isn\'t defined or with the bad type');
										nb_errors++;
										has_name_error = true;
									}
								});

								// - Control if grid size are multiple of nb
								if (!has_name_error && typeof option.nb == 'number') {
									$.each(option.colsPerType, function(k, v) {
										if (v > option.nb) {
											self.debugData[option_name].push('Grid system error: ' + k + ' (' + v + ')' + ' is bigger than the ' + option_name + '.nb value ' + '(' + option.nb + ') as defined in your ' + option_name + '.nb option.');
											nb_errors++;
										} else if (option.nb % v !== 0) {
											self.debugData[option_name].push('Grid system error: ' + k + ' (' + v + ')' + ' isn\' t a multiple of ' + option_name + '.nb ' + '(' + option.nb + ') as defined in your ' + option_name + '.nb option.');
											nb_errors++;
										}
									});
								}

							}
							break;
						default:
							self.debugData[option_name].push(key + ' isn\'t a valid option key');
							nb_errors++;
							break;
					}
				});
			}

			// - Animation
			option_name = 'animation';
			self.debugData[option_name] = [];
			option = self.settings[option_name];
			if (optionType != 'object') {
				self.debugData[option_name].push('The option ' + option_name + ' type must be an object');
				nb_errors++;
			} else {
				$.each(option, function(key, val) {
					type = typeof option[key];
					switch (key) {
						case 0:
							if (['string', 'function', 'object'].indexOf(type) == -1) {
								self.debugData[option_name].push('The animation[' + key + '] must be a the name of the function, a custom function or an object with each function per responsive size.');
								nb_errors++;
								return;
							} else if (type == 'object') {
								// - Define if each responsive size is defined
								$.each(self.responsiveSizesNames, function(k, v) {
									if (['string', 'function'].indexOf(typeof option[key][v]) == -1) {
										self.debugData[option_name].push('The animation[' + key + '] responsive size key "' + v + '" isn\'t defined or with the bad type');
										nb_errors++;
										has_name_error = true;
									}
								});
							}
							break;
						case 1:
							if (['number'].indexOf(type)) {
								self.debugData[option_name].push('The animation[' + key + '] must be an number.');
								nb_errors++;
								return;
							}
							break;
						case 2:
							if (['boolean'].indexOf(type)) {
								self.debugData[option_name].push('The animation[' + key + '] must be a boolean.');
								nb_errors++;
								return;
							}
							break;
						default:
							break;
					}
				});
			}

			// - BoxClasses
			option_name = 'boxClasses';
			self.debugData[option_name] = [];
			boxClasses = self.settings[option_name];
			if (typeof boxClasses != 'object' && typeof boxClasses != 'string') {
				self.debugData[option_name].push('The option ' + option_name + ' type must be an object or a string');
				nb_errors++;
			} else if (typeof boxClasses == 'object') {
				$.each(boxClasses, function(key, val) {
					switch (key) {
						case 0:
							if (typeof boxClasses[0] != 'string') {
								self.debugData[option_name].push(option_name + '[0] option must be a string');
								nb_errors++;
								return false;
							}
							break;

						case 1:
							if (typeof boxClasses[1] != 'object' && typeof boxClasses[1] !== typeof undefined) {
								self.debugData[option_name].push(option_name + '[0] option must be an object');
								nb_errors++;
								return false;
							} else {
								// - Define if each responsive size is defined
								var has_name_error = false;
								$.each(self.responsiveSizesNames, function(k, v) {
									if (typeof boxClasses[1][v] != 'string') {
										self.debugData[option_name].push('The responsive size "' + v + '" isn\'t defined or with the bad type');
										nb_errors++;
										has_name_error = true;
									}
								});
							}
							self.boxClassesOnce = false;
							break;

						default:
							self.debugData[option_name].push(key + ' isn\'t a valid option key');
							nb_errors++;
							break;
					}
				});
			}

			// - Limits
			option_name = 'limits';
			self.debugData[option_name] = [];
			option = self.settings[option_name];
			optionType = typeof option;
			if (optionType != 'object') {
				self.debugData[option_name].push(option_name + ' type option is ' + optionType + ', please use only object with responsive size limit.');
				nb_errors++;
			} else {
				$.each(self.responsiveSizesNames, function(k, v) {
					if (typeof option[v] != 'number') {
						self.debugData[option_name].push('The responsive size "' + v + '" isn\'t defined or with the bad type');
						nb_errors++;
					}
				});			
			}

			// - Skipped class
			option_name = 'skippedClasses';
			self.debugData[option_name] = [];
			optionType = typeof self.settings[option_name];
			if (optionType != 'string') {
				self.debugData[option_name].push(option_name + ' type option is ' + optionType + ', please use only string.');
				nb_errors++;
			}

			// - Skipped class
			option_name = 'progressBar';
			self.debugData[option_name] = [];
			option = self.settings[option_name];
			optionType = typeof option;
			if (optionType != 'string' && optionType != 'boolean') {
				self.debugData[option_name].push(option_name + ' type option is ' + optionType + ', please use string to define it position or disabled it by setting false.');
				nb_errors++;
			}

			// - Source
			option_name = 'source';
			self.debugData[option_name] = [];
			optionType = typeof self.settings[option_name];
			if (optionType != 'string' && optionType != 'object') {
				self.debugData[option_name].push(option_name + ' type option is ' + optionType + ', please use only string for HTML or XML and object for JSON.');
				nb_errors++;
			}

			// - zIndex
			option_name = 'zIndex';
			self.debugData[option_name] = [];
			optionType = typeof self.settings[option_name];
			if (optionType != 'number') {
				self.debugData[option_name].push(option_name + ' type option is ' + optionType + ', please use only number');
				nb_errors++;
			}

			// - slider
			option_name = 'slider';
			self.debugData[option_name] = [];
			option = self.settings[option_name];
			optionType = typeof option;
			if (optionType != 'object' && optionType != 'boolean') {
				self.debugData[option_name].push(option_name + ' type option is ' + optionType + ', please use a JSON array or disabled it with the boolean false');
				nb_errors++;
			}

			// - horizontal spacing
			option_name = 'horizontalSpacing';
			self.debugData[option_name] = [];
			option = self.settings[option_name];
			optionType = typeof option;
			unityType = self.getUnityType(option);
			if (optionType != 'string') {
				self.debugData[option_name].push(option_name + ' type option is ' + optionType + ', please use a JSON array or disabled it with the boolean false');
				nb_errors++;
			} else if (unityType != '%' && unityType != 'px') {
				self.debugData[option_name].push(option_name + ' could be used only with px or % and not ' + unityType);
				nb_errors++;
			}

			// console.log(nb_errors);

			// - Display errors and clear the page -> fatal error
			if (nb_errors > 0) {

				// - Console check mode
				if (typeof self.settings.checkMode.console == 'boolean' && self.settings.checkMode.console) {
					console.log(self.debugData);
				}

				// - Screen check mode
				if (typeof self.settings.checkMode.screen == 'boolean' && self.settings.checkMode.screen) {
					var str_error = nb_errors > 1 ? 'errors appear' : 'error appears';
					document.write('<link href="' + self.tgGridStyleSheetPath + '" rel="stylesheet" type="text/css"><section id="checkSection">');
						document.write('<h2>' + nb_errors + ' ' + str_error + ' when I check your TurtleGrid\'s configuration</h2>')
						for (var cat in self.debugData) {
							if (self.debugData[cat] != '') {
								document.write('<h3 style="color:red">' + cat + '  &#10007;</h3><ul style="padding:0;margin:0">');
								for (var key in self.debugData[cat]) {
									document.write('<li style="list-style-type:none">' + self.debugData[cat][key] + '</li>');
								}
								document.write('</ul>');
							} else {
								document.write('<h3 style="color:#7ab638">' + cat + '  &#10004;</h3>');
							}
						}
						document.write('<hr style="margin:50px"><a href="/tg#options"><button>Need help?</button></a>');
					document.write('</section>');
					self.stop = true;
					return;
				}

			}
		},

		// - Get the element's untiy OR an array with the unity and the value (split => true)
		getUnityType:function(element, split) {
			var type = element.replace(/\d/g, '').replace(/\s+/g, '');
			return split ? [element.split(type)[0], type] : type;
		},

		// - Define element's classes
		setBoxClasses:function() {
			var self = this;
			var boxClasses = '';

			// - Define classes by settings
			boxesClasses = typeof self.settings.boxClasses == 'string' ? self.settings.boxClasses : self.settings.boxClasses[0];
			if (!self.boxClassesOnce) {
				boxesClasses += ' ' + self.settings.boxClasses[1][self.currentSize];
			}

			// - Check if the user have use the caption option to define classes. It overrides them define in boxClasses
			if (typeof self.settings.caption !== typeof undefined) {

				// - Search text animation
				if (
					typeof self.settings.caption.text_animation == 'boolean'
					|| (typeof self.settings.caption.text_animation == 'object' && typeof self.settings.caption.text_animation[self.currentSize] == 'boolean')
				) {
					var ref = typeof self.settings.caption.text_animation == 'boolean' ? self.settings.caption.text_animation : self.settings.caption.text_animation[self.currentSize];
					var already_class = boxesClasses.indexOf('tg-cc-animation') > -1;
					// - Add or remove the text animation class
					if (!already_class && ref) {
						boxesClasses += ' tg-cc-animation';
					} else if (already_class && !ref) {
						boxesClasses = boxesClasses.replace('tg-cc-animation', '');
					}	
				}

				// - Search theme
				if (
					typeof self.settings.caption.theme == 'string'
					|| (typeof self.settings.caption.theme == 'object' && self.settings.caption.theme !== null && typeof self.settings.caption.theme[self.currentSize] == 'string')
				) {
					var ref = typeof self.settings.caption.theme == 'string' ? self.settings.caption.theme : self.settings.caption.theme[self.currentSize];
					var is_custom = ref.indexOf('.') > -1;
					boxesClasses = boxesClasses.replace(/tg\-ct\-\w+/ig, '');
					boxesClasses += is_custom ? ' ' + ref.replace('.', '') : ' tg-ct-' + ref; 
				}

				// - Search effect  
				if (
					typeof self.settings.caption.effect == 'string'
					|| (typeof self.settings.caption.effect == 'object' && self.settings.caption.effect !== null && typeof self.settings.caption.effect[self.currentSize] == 'string')
				) {
					var ref = typeof self.settings.caption.effect == 'string' ? self.settings.caption.effect : self.settings.caption.effect[self.currentSize];
					var is_custom = ref.indexOf('.') > -1;
					boxesClasses = boxesClasses.replace(/tg\-c\-\w+/ig, '');
					boxesClasses += ref.indexOf('.') > -1
						? ' ' + ref.replace('.', '')
						: ' ' + ref.convertToClass('tg-c-');
				} else if (
					typeof self.settings.caption.effect === null
					|| (typeof self.settings.caption.effect == 'object' && self.settings.caption.effect !== null && typeof self.settings.caption.effect[self.currentSize] === null)
				) {
					boxesClasses = boxesClasses.replace(/tg\-c\-\w+/ig, '');
					boxesClasses += 'tg-c-no';
				}
			}

			console.log(boxesClasses);

			// - Clean spaces
		 	boxesClasses = boxesClasses.trim().replace(/\s{2,}/ig, ' ');

		 	self.boxClasses = boxesClasses;
		},

		// - Define the current size type
		getResponsiveSize:function() {
			var self = this,
				size = '',
				window_width = $(window).width();

			if (window_width >= self.settings.limits.lg) {
				size = 'lg';				
			} else if (window_width >= self.settings.limits.md && window_width < self.settings.limits.lg) {
				size = 'md';				
			} else if (window_width >= self.settings.limits.sm && window_width < self.settings.limits.md) {
				size = 'sm';				
			} else {
				size = 'xs';
			}

			return $.fn.tGrid.currentSize = size;
		},

		// - Control that every class has a fonction and any class is missing		
		checkBoxClasses:function() {
			var self = this;
			self.$elements.each(function() {
				var $element = $(this);
				var	has_caption = $(this).find('.caption').length > 0;
				var has_zoom = $(this).find('.detail').length > 0;
				var element_classes = $element.attr('class');

				// - Delete classes that haven't any function
				var b = element_classes.split(' ');
				$element.removeClass().addClass('tg');
				$.each(b, function(key, val) {
					if (
						(!has_caption && val.indexOf('tg-c') != -1) 
						|| (!has_zoom && val.indexOf('ts-h') != -1) 
						|| (!self.settings.slider[0] && val.indexOf('ts-h') != -1)
					) {
						b[key] = '';
					}
				});

				b = b.join(' ').trim().replace(/\s{2,}/ig, ' ');
				$element.removeClass().addClass(b);

				// - Add slider class if needed
				if (has_zoom && b.indexOf('ts-h') > -1) {
					$element.addClass('tg-s');
				}
			});
		},

	};


});