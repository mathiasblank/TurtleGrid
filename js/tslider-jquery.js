(function ($) {

	ftSlider = function(element, options) {
		this.element = element;
		this.settings = options;

		// - Default classes
		// this.d_mainBoxClass = 'ts-box';
		// this.d_slideTransition = 'fadeOutFadeIn';

		this.thumbnailsClass = 'ts-o-thumbnail';
		this.normalClass = 'ts-o-normal';
		this.fullClass = 'ts-o-full';
		this.noBackgroundClass = 'ts-ot-noBackground';

		this.e = {};	// - All HTML element with classes and ID 
		this.ci = {};	// - All HTML elements classes and ID
		this.bodyOverflow = [];

		this.currentSlide = 1;
		this.lastSlide = null;
		this.nbSlides = 0;

		this.$slidesArray = [];
		this.$boxesArray = [];			// - gallery element which has slider
		this.leftArray = []; // - defines the left position of elements (normal mode)

		this.is_sliding = false;

		// this.subfolder = '';

		// this.has_subfolder = typeof this.settings.subfolder == 'string' && this.settings.subfolder !== '';
		// this.galleryBoxClasses = typeof this.settings.galleryBoxClasses == 'string' && this.settings.galleryBoxClasses !== '' ? this.settings.galleryBoxClasses : this.d_mainBoxClass;
		// this.boxClasses = typeof this.settings.boxClasses == 'string' && this.settings.boxClasses !== '' ? this.settings.boxClasses : this.d_slideTransition;
		// this.zoomIn_speed = 200;

		this.state = 'normal'; // - thumbnails / full

		this.animationSpeed = typeof this.settings.animationSpeed == 'number' ? this.settings.animationSpeed : 300;

		this.init();

	};

	ftSlider.prototype = {

		init: function() {

			var current = this,
				lastMaxHeight = '',
				$body = $('body');	

			// - Slider element are set into virtuals arrays
			$.each(current.settings.elements, function(key, val){
				if(typeof val == 'object') {
					$.each(val, function(sk, sv){
						current.setIDClass(sk, sv);
					});
				} else {
					current.setIDClass(key, val);
				}
			});	

			var $elements = current.e;
			var $classesID = current.ci;

			// - Define mode classes
			if (current.has_thumbnails) {
				current.thumbnailsClass = typeof current.settings.modeClasses !== typeof undefined && typeof current.settings.modeClasses.thumbnails == 'string' ? current.classChecker(current.settings.modeClasses.thumbnails, true) : current.thumbnailsClass;
			}

			current.normalClass = typeof current.settings.modeClasses !== typeof undefined && typeof current.settings.modeClasses.normal == 'string' ? current.classChecker(current.settings.modeClasses.normal, true) : current.normalClass;
			
			if (current.settings.has_full) {
				current.fullClass = typeof current.settings.modeClasses !== typeof undefined && typeof current.settings.modeClasses.full == 'string' ? current.classChecker(current.settings.modeClasses.full, true) : current.fullClass;
			}

			// - Control and set element classes
			var slideClasses = [];
			if (typeof current.settings.slide !== typeof undefined) {

				// - Slide effect
				if (typeof current.settings.slide.effect == 'string') {
					slideClasses['effect'] = current.settings.slide.effect.indexOf('.') > -1 
						? current.settings.slide.effect.replace('.', '')
						: current.settings.slide.effect.convertToClass('ts-e-');
				}

				// - Hover effect
				if (typeof current.settings.slide.hover == 'string') {
					slideClasses['hover'] = current.settings.slide.hover.indexOf('.') > -1
						? current.settings.slide.hover.replace('.', '')
						: current.settings.slide.hover.convertToClass('ts-h-');
				}

				// - Theme
				if (typeof current.settings.slide.theme == 'string') {
					slideClasses['theme'] = current.settings.slide.theme.indexOf('.') > -1 
						? current.settings.slide.theme.replace('.', '')
						: current.settings.slide.theme.convertToClass('ts-t-');				
				}
			}

			console.log(slideClasses);

			// - Create HTML structure
			$elements.overlay.hide();
			$elements.overlay.append($elements.main);
			$elements.main.append($elements.wrapper);
			$elements.wrapper.append($elements.container);
			if(current.settings.is_slider && current.settings.has_thumbnails) {
				$elements.wrapper.append($elements.viewsTrigger);
			}
			$body.append($elements.overlay);

			// - Update design if user can't close overlay by clicking on it
			if (!current.settings.close.click) {
				$elements.overlay.addClass(current.noBackgroundClass);
			}

			$elements.overlay.addClass(slideClasses['theme']);

			// - Construct each slide
			var i = 0; 
			$(current.element).find(current.settings.contentClass).each(function() {

				var $detail = $(this);
				var $box = $elements.box.clone();
				var $content = $elements.boxContent.clone();
				var $back = $('<div class="ts-back"></div>');
				var $back_content = $('<div></div>');
				$back.append($back_content);
				var $front = $('<div class="ts-front"></div>');

				// - Add elements
				// $detail.children().each(function() {
				// 	$content.append($(this).clone());
				// });

				// - Main element
				var $mainElement = $detail.parent().children().first().clone();
				var tag = $mainElement[0].tagName.toLowerCase();

				// - If the main element is an image convert it into a background
				if (tag == 'img') {
					var src = $mainElement.attr('src');
					// $front.css('background-image', 'url(' + src + ')');
					$front.css('background-image', 'url(' + src + ')');
				} else {
					// $front.append($mainElement);
					$front.append($mainElement);
				}

				$detail.children().each(function() {
					// $back.append($(this).clone());
					$back_content.append($(this).clone());
				});

				$content.append($front);
				$content.append($back);



				// - Bound the created slide to the slider
				$detail.attr('data-index', i+1);
				$box.append($content).addClass(current.normalClass).addClass(slideClasses['effect']).css({
		   			left: (100 * i) + '%'
		   		});
		   		if(current.settings.has_full) {
		   			$box.addClass('cursor-pointer');
		   		}
	   			$elements.container.append($box);	
		   		current.$slidesArray.push($box);

		   		var $parent = $detail.parent();

		   		// - Add the hover effet class
		   		var boxClasses = $parent.attr('class').replace(/ts\-h\-\w+/ig, '') + ' ' + slideClasses['hover'];
		   		boxClasses = boxClasses.replace(/\s{2,}/ig, ' ');
		   		$parent.attr('class', boxClasses);

		   		current.$boxesArray.push({box: $parent, detail: $detail});
				i++;

			});
			current.nbSlides = i;

			// - Remove the overlay (if no children)
			if(current.nbSlides === 0) {
				$elements.overlay.remove();
				return false;
			}

			// - Append navigation if slider option is activated.
			if(current.settings.is_slider && current.nbSlides > 1) {
				$elements.overlay.append($elements.next);
				$elements.overlay.append($elements.prev);
				if(current.settings.has_counter) {
					$elements.overlay.append($('<div id="ts_o_counter"><div id="ts_o_counter_currentSlide">0</div> / <span id="ts_o_counter_nbSlides">' + current.nbSlides + '</span></div>'));	
					current.e.counter = $('#ts_o_counter');
					current.e.counterSlide = $('#ts_o_counter_currentSlide');
					$elements = current.e;
				}
			}

			// - Open Overlay by clicking on gallery boxes
			$.each(current.$boxesArray, function(key, val) {
				var $box = val.box;
				var $detail = val.detail;
				$box.on('click', function() {
					var index = $detail.data('index');
					$elements.overlay.fadeIn(500);
					current.slideTo(index);
					current.updateOverflow(true);
				});
			});

			// - Get paddings of the wrapper and the content div
			var paddings = {};
			paddings.wrapper = {};
			paddings.wrapper.vertical = current.e.wrapper.css('padding-top');
			paddings.wrapper.horizontal = current.e.wrapper.css('padding-left');
			paddings.wrapper.all = current.e.wrapper.css('padding');
			paddings.content = {};
			paddings.content.vertical = current.e.container.children().first().children().css('padding-top');
			paddings.content.horizontal = current.e.container.children().first().children().css('padding-left');
			paddings.content.all = current.e.container.children().first().children().css('padding');
			current.paddings = paddings;

			// ------------------------------------------------------------------------------------------------------------------------------------
			// - Navigation
			// ------------------------------------------------------------------------------------------------------------------------------------
				
			// - Touch control
			var swiping = false;
			$('.ts-o-box').on('swipeleft', function(e) {
				if(!$(this).hasClass('ts-o-full')) {
					swiping = true;
					current.slideLeft();
				}
			}).on('swiperight', function(e) {
				if(!$(this).hasClass('ts-o-full')) {
					swiping = true;
					current.slideRight();
				}
			});

			// - Close by swipe down
			if (current.settings.close.swipeDown) {
				$('.ts-o-box').on('swipedown', function() {
					current.closeOverlay();
				});
			}

			// - Arrows next & prev
			if(current.settings.is_slider) {
				$body.on('click', $classesID.next, function() {
					current.slideRight();
				});
				$body.on('click', $classesID.prev, function() {
					current.slideLeft();
				});
			}

			// ------------------------------------------------------------------------------------------------------------------------------------
			// - Trigger Modes
			// ------------------------------------------------------------------------------------------------------------------------------------
				
			var mode_is_changing = false;			// - during mode transition actions are disabled

			var normalToFull = function() {
				if (mode_is_changing) return false;
				changeMode();
				current.state = 'full';
				current.e.wrapper.css({padding : 0});
				current.e.container.css({overflow:'visible'});
				toggleControls();							
			};

			var fullToNormal = function() {
				if (mode_is_changing) return false;
				changeMode();
				current.state = 'normal';
				current.e.wrapper.css({padding : paddings.wrapper.all});
				current.e.container.css({overflow : 'hidden'});
				toggleControls();
			};

			var toggleControls = function() {
				current.e.prev.fadeToggle();
				current.e.next.fadeToggle();
				current.e.viewsTrigger.fadeToggle();
				current.e.counter.fadeToggle();
				current.e.overlay.toggleClass('no-background-img');
			};

			var thumbnailsToNormal = function() {
				if (mode_is_changing) return false;
				changeMode();
				current.e.viewsTrigger.stop(true, true).animate({opacity : 0.5}, 200).toggleClass('active').addClass('default-cursor');
				current.e.main.addClass('default-cursor');
				current.e.overlay.addClass('no-background-img').toggleClass('full-color');
				current.e.viewsTrigger.animate({opacity : 1}, 200).removeClass('default-cursor');		
				current.e.main.removeClass('default-cursor');						
				current.resteThumbnails();
				current.state = 'normal';
			};

			var changeMode = function() {
				mode_is_changing = true;
				var s = setTimeout(function() {
					mode_is_changing = false;
					clearTimeout(s);
				}, 300);
			}

			var trigger_view_active = false;
			$body.on('click', $classesID.viewsTrigger, function() {
				if(trigger_view_active) return false;
				trigger_view_active = true;
				
				var $trigger = $(this);
				$trigger.stop(true, true).animate({opacity : 0.5}, 200).toggleClass('active').addClass('default-cursor');

				current.e.main.addClass('default-cursor');
				current.e.overlay.addClass('no-background-img');
				$elements.overlay.toggleClass('full-color');

				if (current.state == 'normal') {
					current.state = 'thumbnails';
					current.leftArray = [];
					var selectedIndex = current.currentSlide - 1;
					$.each(current.$slidesArray, function(key, val){
						var $slide = $(this);
						$slide.addClass(current.thumbnailsClass);
						$slide.removeClass(current.normalClass);
						var left = $slide[0].style.left;
						current.leftArray.push(left);
						left = (parseInt(left) !== 0) ? parseInt(left) / 5 : 0;
						var opacity = (key == selectedIndex) ? 1 : 0.4;
						$slide.animate({left : left + '%'}, 500, function() {
							$slide.animate({top : 0}, 400, function(){
								trigger_view_active = false;
								$trigger.animate({opacity : 1}, 200).removeClass('default-cursor');
							});
						});
					});
					current.updateThumbnails(selectedIndex);
				} else {
					var s = setTimeout(function() {
						trigger_view_active = false;
						$trigger.animate({opacity : 1}, 200).removeClass('default-cursor');		
						current.e.main.removeClass('default-cursor');						
						current.resteThumbnails();	
						current.state = 'normal';
						clearTimeout(s);
					}, 150);
				}
			});

			// - Actions when user click on slides
			$body.on('click', $classesID.box, function() {

				if (swiping) {
					swiping = false;
					return false;
				}

				var $box = $(this);
				var $children = $box.children().children();
				if (current.state == 'thumbnails' && !mode_is_changing) {
					var index = $box.index(),
					 	diff = current.currentSlide - (index + 1);
					if(diff !== 0) {
						var is_next = diff < 0;
						var leftDirection = is_next ? '100' : '-100';
						diff = diff < 0 ? diff * -1 : diff;
						for (var i = 0; i < diff; i++) {
							$.each(current.leftArray, function(key, val){
								current.leftArray[key] = (parseInt(val) - leftDirection) + '%';
							});
						}
					}
					current.resteThumbnails();
					current.closeThumbnails(false, 500, 300);
					current.currentSlide = index + 1;
					current.navigation();
					current.e.main.removeClass('default-cursor');
					current.state = 'normal';
				} 
				// - Full mode
				else if (current.settings.has_full) {
					if (current.state == 'normal') {
						normalToFull();							
					} else if (current.state == 'full') {
						fullToNormal();
					}
				}
			});

			// ------------------------------------------------------------------------------------------------------------------------------------
			// - Mobile mode
			// ------------------------------------------------------------------------------------------------------------------------------------
				
			// - On mobile they aren't any thumbnails mode or full mode.
			$(window).resize(function() {
				if ($(window).width() < 480 && current.state != 'normal') {
					if (current.state == 'thumbnails') {
						thumbnailsToNormal();
					} else if (current.state == 'full') {
						fullToNormal();	
					}
				}
			});

			// ------------------------------------------------------------------------------------------------------------------------------------
			// - Keyboard control
			// ------------------------------------------------------------------------------------------------------------------------------------
				
			if (current.settings.keyboard) {
				$body.on('keyup', function(e) {
					if ($(current.e.overlay).is(':visible')) {

						// - Close overlay or return to normal mode
						if (e.keyCode == 27 || e.keyCode == 8) {
							if (current.state == 'normal') {
								current.closeOverlay();
							} else if (current.state == 'thumbnails') {
								thumbnailsToNormal();
							} else if (current.state == 'full') {
								fullToNormal();	
							}
						}

						// - Navigation with arrows
						if(current.settings.is_slider && current.state !== 'full') {
							if(e.keyCode == 39) {
								current.slideRight();
							} else if(e.keyCode == 37) {
								current.slideLeft();
							}
						}

						// - Enter
						if (e.keyCode == 13) {

							// - Select a thumbnails
							if (current.state == 'thumbnails') {
								thumbnailsToNormal();
							}

							// - Get full mode 
							else if (current.settings.has_full && current.state == 'normal') {
								normalToFull();
							}							

						}

					}
				});
			}

			// ------------------------------------------------------------------------------------------------------------------------------------
			// - Close overlay mode
			// ------------------------------------------------------------------------------------------------------------------------------------
				
			// - By click
			if (typeof current.settings.close.click !== typeof undefined && current.settings.close.click) {
				$body.on('click', $classesID.wrapper, function(e) {
					if( (e.toElement == this || e.target == this) && current.state == 'normal') {
						current.closeOverlay();
					}
				});
			}

			// - By scroll down
			if (typeof current.settings.close.scrollDown !== typeof undefined && current.settings.close.scrollDown) {
				$(window).bind('mousewheel DOMMouseScroll', function(event){
					if ($elements.overlay.is(':visible') && (event.originalEvent.wheelDelta < 0 || event.originalEvent.detail > 0)) {
						if (current.state == 'normal') {
							current.closeOverlay();
						} else if (current.state == 'thumbnails') {
							var s = setTimeout(function() {
								current.e.viewsTrigger.toggleClass('active').animate({opacity : 1}, 200).removeClass('default-cursor');		
								current.e.main.removeClass('default-cursor');						
								current.resteThumbnails();	
								current.state = 'normal';
								clearTimeout(s);
							}, 150);
						}
					}
				});
			}


			$body.on('click', $classesID.box, function(event) {

				event.preventDefault();

				$(this).children().toggleClass('active');

			});



		},

		// - | remove (boolean) : remove the Class or ID symbol.
		classChecker:function(element, remove) {
			var current = this,
				e = element.trim();
			if (typeof e == 'string') {
				if (e.indexOf(' ') > 0) {
					var a = e.split(' '),
						i = 0,
						l = a.length,
						t = '';
					$.each(a, function(k ,v) {
						var r = current.classChecker(v, remove);
						t += r;
						if(i + 1 < l)
							t+= ' ';
						i++;
					});
					return remove ? t.replace(/\./g, '').replace('#', '') : t;
				} else {
					if(e !== '' && e.indexOf('.') == -1 && e.indexOf('#') == -1) {
						return remove ? e.replace(/\./g, '') : '.' + e.replace('/\./g', '');
					}
					return remove ? e.replace(/\./g, '').replace('#', '') : e;
				}
			}
		},

		closeThumbnails:function(empty, leftSpeed, opacitySpeed){
			var current = this,
				$elements = current.e;
				empty = typeof empty == 'boolean' ? empty : false;
				leftSpeed = typeof leftSpeed == 'number' ? leftSpeed : 10;
				opacitySpeed = typeof opacitySpeed == 'number' ? opacitySpeed : 10;
			if (current.state == 'thumbnails') {
				$elements.viewsTrigger.removeClass('active');
				$elements.overlay.removeClass('full-color');
				$.each(current.$slidesArray, function(key, val) {
					var $this = $(this);
					$this.removeClass(current.thumbnailsClass + ' selected-slide neighbour-slide');
					var o = parseInt(current.leftArray[key]) === 0 ? 1 : 0;
					$this.animate({left : current.leftArray[key], opacity: o}, leftSpeed, function() {
						$this.animate({opacity : 1}, opacitySpeed);
						current.state = 'normal';
					});
				});
				if (empty) {
					current.leftArray = [];
				}
			}	
		},

		closeOverlay:function() {
			var current = this;
			$(current.ci.overlay).fadeOut(500, function() {
				current.closeThumbnails(true);
				current.updateOverflow(false);					
			});
		},

		navigation:function(counterDelay) {

			var current = this;
			$(current.ci.next).removeClass('no-more');
			$(current.ci.prev).removeClass('no-more');

			$c = current.e.container.children();
			$c.removeClass('active');
			$c.eq(current.currentSlide - 1).addClass('active');

			if(current.currentSlide == current.nbSlides) {
				current.currentSlide = current.nbSlides;
				$(current.ci.next).addClass('no-more');
			}
			else if(current.currentSlide <= 1){
				current.currentSlide = 1;
				$(current.ci.prev).addClass('no-more');
			}

			// - Counter
			if (current.settings.has_counter) {
				var $counter = current.e.counterSlide;
				if (typeof counterDelay !== 'number') {
					counterDelay = 0;
				}

				var s = setTimeout(function() {
					if(current.lastSlide < current.currentSlide) {
						$counter.addClass('nextCountSlide');
					} else if (current.lastSlide > current.currentSlide) {
						$counter.addClass('prevCountSlide');
					}
					var s2 = setTimeout(function() {
						$counter.empty().text(current.currentSlide).removeClass();
						current.lastSlide = current.currentSlide;
						clearTimeout(s2);
					}, 300);
					clearTimeout(s);
				}, counterDelay);

			}
		},

		resteThumbnails:function() {
			var current = this;
			$(current.ci.box).each(function(key, val) {
				var $box = $(this);
				var old_slide = current.currentSlide,
					o = (parseInt(current.leftArray[key]) === 0) ? 1 : 0;
				$box.addClass(current.normalClass);
				current.e.overlay.removeClass('no-background-img');
				$box.removeClass(current.thumbnailsClass + ' selected-slide neighbour-slide');
				$box.animate({left : current.leftArray[key], opacity : o}, 500, function() {
					$box.css('opacity', 1);
					current.state = 'normal';
					current.navigation();
				});
			});	
		},

		// - Set ID and class attribute to elements
		setIDClass:function(key, val) {
			var current = this;
			current.e[key] = $('<div></div>');
			current.ci[key] = '';
			var i_array = val.split(" ");
			$.each(i_array, function(k, v){
				var e = v;
				current.ci[key] += e;
				var o = e.substring(1, e.length);
				if (e.indexOf('#') != -1) {
					current.e[key].attr('id', o); 
				} else {
					current.e[key].addClass(o);	
				}		
			});

			if(key != 'overlay')
				current.ci[key] = current.ci.overlay + ' ' + current.ci[key];
		},

		slideTo:function(index, speed) {
			var current = this;
			var diff = current.currentSlide - index;
			speed = typeof speed == 'number' ? speed : 0;
			if(diff !== 0) {
				var is_next = (diff < 0) ? true : false;
				var leftDirection = (is_next) ? '-=100%' : '+=100%';
				diff = (diff < 0) ? diff * -1 : diff;
				for (var i = 0; i < diff; i++) {
					$.each(current.$slidesArray, function() {
						$(this).animate({
							left: leftDirection
						}, speed);		
					});					
				}
			}
			current.currentSlide = index;
			current.navigation();
		},

		slideRight:function() {
			var current = this;
			if($(current.ci.next).hasClass('no-more') || current.is_sliding) return false;
			current.is_sliding = true;
			current.currentSlide++;
			if(current.currentSlide <= current.nbSlides) {
				var left = (current.state == 'thumbnails') ? '-=20%' : '-=100%';
				if(current.settings.has_counter) {
					$('#ts-o-counter-currentSlide').addClass('nextCountSlide');
				}
				if(current.state == 'thumbnails') {
					$.each(current.leftArray, function(key, val){
						current.leftArray[key] = (parseInt(val) - 100) + '%';
					});
					current.updateThumbnails(current.currentSlide - 1);
				}
				var c = (current.state == 'thumbnails') ? 20 : 100;
				$.each(current.$slidesArray, function() {
					var width = $(this).width(),
						before_left_percentage = parseInt($(this)[0].style.left),
						before_left_px = (before_left_percentage * width) / 100,
						new_left_percentage = before_left_percentage - c,
						new_left_px = (new_left_percentage * width) / 100;
					$(this).animate({
						left : new_left_percentage + '%'
					}, 500, function() {
						current.is_sliding = false;
					});		
				});

			}
			current.navigation(500);
		},

		slideLeft:function() {
			var current = this;
			if($(current.ci.prev).hasClass('no-more') || current.is_sliding) return false;

			current.is_sliding = true;
			current.currentSlide--;
			if(current.currentSlide > 0) {
				var left = (current.state == 'thumbnails') ? '+=20%' : '+=100%';
				if(current.settings.has_counter) {
					$('#ts-o-counter-currentSlide').addClass('prevCountSlide');
				}
				if(current.state == 'thumbnails') {
					$.each(current.leftArray, function(key, val){
						current.leftArray[key] = (parseInt(val) + 100) + '%';
					});
					current.updateThumbnails(current.currentSlide - 1);
				}
				var c = (current.state == 'thumbnails') ? 20 : 100;
				$.each(current.$slidesArray, function() {
					var width = $(this).width(),
						before_left_percentage = parseInt($(this)[0].style.left),
						before_left_px = (before_left_percentage * width) / 100,
						new_left_percentage = before_left_percentage + c,
						new_left_px = (new_left_percentage * width) / 100;
					$(this).animate({
						left : new_left_percentage + '%'
					}, 500, function() {
						current.is_sliding = false;
					});	
				});
			}
			current.navigation(500);
		},

		updateOverflow:function(open) {
			var current = this;
			var $body = $('body');
			if (open) {
				var ox = $body.css('overflowX'),
					oy = $body.css('overflowY');
				current.bodyOverflow[0] = typeof ox !== typeof undefined ? ox : 'auto';
				current.bodyOverflow[1] = typeof oy !== typeof undefined ? oy : 'auto';
				$body.css('overflow', 'hidden');
			} else {
				$body.css('overflowX', current.bodyOverflow[0]);
				$body.css('overflowY', current.bodyOverflow[1]);
			}
		},

		updateThumbnails:function(index) {
			$(this.ci.box).each(function(key, val){
				$(this).removeClass('selected-slide neighbour-slide');
				if(index - 1 == key || index + 1 == key) {
					$(this).addClass('neighbour-slide');
				}
				if(index == key) {
					$(this).addClass('selected-slide');
				}
			});
		},

	};


	$.fn.tSlider = function(options) {
		console.log('tSlider');
		var current = this;
		var settings = $.extend( {}, $.fn.tSlider.defaults, options);
		return this.each(function() {
	        new ftSlider(this, settings);
	    });
	}

	$.fn.tSlider.defaults = {

		animationSpeed : 300,

		close : {
			click : true,
			scrollDown : true,
			swipeDown : false
		},

		contentClass : '.detail',

		elements : {
			overlay : '#ts_o',
			main : '#ts_o_main .ts-main',
			wrapper : '#ts_o_wrapper .ts-wrapper',
			container : '#ts_o_container .ts-container',
			navigation : {
				next : '#ts_o_next',
				prev : '#ts_o_prev'
			},
			counter : '#ts_o_counter',
			viewsTrigger : '#ts_o_views',
			box : '.ts-o-box .ts-box',
			boxContent : '.ts-o-content .ts-content'
		},

		has_counter : true,

		has_full : false,

		has_thumbnails : true,

		is_slider : true,

		keyboard: true,

		modeClasses : {
			thumbnails : '.ts-o-thumbnail',
			normal : '.ts-o-normal',
			full : '.ts-o-full'
		},

		slide : {
			effect: 'rotateLeftBefore',
			hover: 'scale Out',
			theme: 'dark'
		}

	};

}(jQuery));
	
/*
    - tSlider's main script page
    - tSlider v1.0
    - Under licensed
    - by Herinda
    - 2015
*/