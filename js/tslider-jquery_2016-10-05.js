/*
    - tSlider's main script page
    - tSlider v1.0
    - Under licensed
    - by Herinda
    - 2015
*/

(function($){

	ftSlider=function(element, options){
		this.element = element;
		this.defaults = {
			animationSpeed : 300,
			close : {
				click : true,
				scrollDown : true
			},
			galleryBoxClasses : '.ts-h-scaleIn .m-box',
			boxClasses : '.fadeOutFadeIn',
			elements : {
				overlay : '#ts-o',
				main : '#ts-o-main .ts-main',
				wrapper : '#ts-o-wrapper .ts-wrapper',
				container : '#ts-o-container .ts-container',
				navigation : {
					next : '#ts-o-next',
					prev : '#ts-o-prev'
				},
				counter : '#ts-o-counter',
				viewsTrigger : '#ts-o-views',
				box : '.ts-o-box .ts-box',
				boxContent : '.ts-o-content .ts-content'
			},
			modeClasses : {
				thumbnails : '.ts-o-thumbnail',
				normal : '.ts-o-normal',
				full : '.ts-o-full'
			},
			has_counter : true,
			has_full : true,
			has_thumbnails : true,
			is_slider : true,
			subfolder : '.detail',
			theme : '.ts-ot-dark',
			skippedClasses : '.no-class',
			childClasses : ''
		};

		// - Default classes
		this.d_mainBoxClass = 'ts-box';
		this.d_slideTransition = 'fadeOutFadeIn';
		this.thumbnailsClass = 'ts-o-thumbnail';
		this.normalClass = 'ts-o-normal';
		this.fullClass = 'ts-o-full';
		this.noBackgroundClass = 'ts-ot-noBackground';
		this.settings = $.fn.tSlider.settings = $.extend(this.defaults, options);
		var current = this;

		this.e = {};	// - All HTML element with classes and ID 
		this.ci = {};	// - All HTML elements classes and ID
		this.bodyOverflow = [];

		this.currentSlide = 1;
		this.nbSlides = 0;

		this.$slidesArray = [];
		this.leftArray = []; // - defines the left position of elements (normal mode)

		this.is_slider = true;
		this.subfolder = '';
		this.has_subfolder = typeof this.settings.subfolder == 'string' && this.settings.subfolder !== '';
		this.is_sliding = false;
		this.is_zooming_full = false;
		this.galleryBoxClasses = typeof this.settings.galleryBoxClasses == 'string' && this.settings.galleryBoxClasses !== '' ? this.settings.galleryBoxClasses : this.d_mainBoxClass;
		this.boxClasses = typeof this.settings.boxClasses == 'string' && this.settings.boxClasses !== '' ? this.settings.boxClasses : this.d_slideTransition;

		this.zoomIn_speed = 200;

		this.state = 'normal'; // - thumbnails / full

		this.animationSpeed = typeof this.settings.animationSpeed !== typeof undefined && typeof this.settings.animationSpeed == 'number' ? this.settings.animationSpeed : 300;

		this.init();
	};

	ftSlider.prototype={
		init:function() {

			var current = this,
				$elements = current.e,
				$classesID = current.ci,
				lastMaxHeight = '';		

			current.setElements();

			// - Define if the box has a subfolder
			current.is_slider = (typeof current.defaults.is_slider !== typeof undefined && current.defaults.is_slider);
			current.subfolder = (typeof current.defaults.subfolder !== typeof undefined && typeof current.defaults.subfolder == 'string') ? current.defaults.subfolder : '';

			// - Define mode class 
			current.thumbnailsClass = (typeof current.settings.modeClasses !== typeof undefined && typeof current.settings.modeClasses.thumbnails == 'string') ? current.classChecker(current.settings.modeClasses.thumbnails, true) : current.thumbnailsClass;
			current.normalClass = (typeof current.settings.modeClasses !== typeof undefined && typeof current.settings.modeClasses.normal == 'string') ? current.classChecker(current.settings.modeClasses.normal, true) : current.normalClass;
			current.fullClass = (typeof current.settings.modeClasses !== typeof undefined && typeof current.settings.modeClasses.full == 'string') ? current.classChecker(current.settings.modeClasses.full, true) : current.fullClass;

			// - Append element to view
			var theme = current.classChecker(current.settings.theme, true);
			$elements.overlay.hide().addClass(theme);
			if(!current.settings.close.click)
				$elements.overlay.addClass(current.noBackgroundClass);
			$elements.overlay.append($elements.main);
			$elements.main.append($elements.wrapper);
			$elements.wrapper.append($elements.container);
			if(current.settings.is_slider && current.settings.has_thumbnails)
				$elements.wrapper.append($elements.viewsTrigger);
			$('body').append($elements.overlay);

			current.boxClasses = current.classChecker(current.boxClasses, true);

			// - Construct boxes for the overlay slider
			var i = 0,
				skippedClasses = current.classChecker(current.settings.skippedClasses, true),
				childClasses = current.classChecker(current.settings.childClasses).replace(' ', '');

			$(current.element).children(childClasses).each(function() {
				if(!$(this).hasAnyClass(skippedClasses)) {
					$box = $elements.box.clone();
					$content = $elements.boxContent.clone();
					if(current.has_subfolder && $(this).find(current.subfolder).length > 0 && $(this).find(current.subfolder).children().length > 0) {
						$(this).children(current.subfolder).children().each(function() {
							$content.append($(this).clone().attr('draggable', false));
						});
						$content.append($(this).children().first().clone().attr('draggable', false));
					} else {
						var s = current.classChecker(current.subfolder, true);
						$(this).children().each(function() {
							if($(this).hasClass(s)) {
								$(this).remove();
							} else {
								$content.append($(this).clone());
							}
						});
						$(this).append($('<div class="' + s + '"></div>'));
					}
					var gBoxClass = current.classChecker(current.galleryBoxClasses, true);
					$(this).attr('data-index', i+1).addClass(gBoxClass);
					$box.append($content);
					$box.attr('draggable', false);
					$box.addClass(current.normalClass).css({
			   			left: (100 * i) + '%'
			   		}).addClass(current.boxClasses);			   		
			   		if(current.settings.has_full) {
			   			$box.addClass('cursor-pointer');
			   		}
			   		// $content.fadeIn(600);
			   		$elements.container.append($box);	
			   		current.$slidesArray.push($box);
					i++;			
				}
			});	
			current.nbSlides = i;

			// - Append navigation if slider option is activated.
			if(current.is_slider && current.nbSlides > 1) {
				$elements.overlay.append($elements.next);
				$elements.overlay.append($elements.prev);
				if(current.settings.has_counter) {
					$elements.overlay.append($('<div id="ts-o-counter"><div id="ts-o-counter-currentSlide">0</div> / <span id="ts-o-counter-nbSlides">' + current.nbSlides + '</span></div>'));			
				}
			}

			// - Remove the overlay (if no children)
			if(current.nbSlides === 0) {
				$elements.overlay.remove();
				return false;
			}

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

			// - Open the overlay
			var jBoxClass = current.classChecker(current.galleryBoxClasses).replace(' ', '');
			$(jBoxClass).click(function() {
				if(!$(this).hasClass(skippedClasses)) {
					var index = $(this).attr('data-index');
					$elements.overlay.fadeIn(500);	
					current.updateOverflow(true);
					current.updateSizes();
					current.slideTo(index);
				}
			});

			$(window).resize(function() {
				$(current.ci.box).each(function() {
					if(!$(this).hasClass('active'))
						$(this).css({opacity : 0});
					else 
						$(this).addClass('transition');
				});
				current.updateSizes(0, 500);
				var s = setTimeout(function(){
					var i = 1;
					var l = current.e.container.children().length;
					$(current.ci.box).each(function() {
						$(this).animate({opacity : 1}, 200, function(){
							if($(this).hasClass('active'))
								$(this).removeClass('transition');
							if(i > l)
								clearTimeout(s);
						});
						i++;
					});
				}, 710);
			});

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


			$('body').on('click', $classesID.box, function() {
				if(!swiping) {
					$this = $(this);
					$children = $this.children().children();
					if(current.state == 'thumbnails') {
						var index = $(this).index(),
						 	diff = current.currentSlide - (index + 1);
						if(diff !== 0) {
							var is_next = (diff < 0) ? true : false;
							var leftDirection = (is_next) ? '100' : '-100';
							diff = (diff < 0) ? diff * -1 : diff;
							for (var i = 0; i < diff; i++) {
								$.each(current.leftArray, function(key, val){
									current.leftArray[key] = (parseInt(val) - leftDirection) + '%';
								});
							}
						}
						current.resteThumbnails();
						current.close(false, 500, 300);
						current.currentSlide = index + 1;
						current.navigation();
						current.e.main.removeClass('default-cursor');
						current.state = 'normal';
					} else if (current.settings.has_full && !current.is_zooming_full) {
						current.e.container.children().each(function() {
							if($(this)[0] != $this[0])
								$(this).hide();
						});
						var $c = $(this);
						if(current.state == 'normal') {
							current.is_zooming_full = true;
							current.state = 'full';
							$c = $(this);
							current.e.prev.fadeOut();
							current.e.next.fadeOut();
							current.e.viewsTrigger.fadeOut();
							current.e.overlay.addClass('no-background-img');
							$c.children().animate({padding : 0}, current.zoomIn_speed);
							current.e.wrapper.animate({padding : 0}, current.zoomIn_speed);
							current.updateSizes(current.zoomIn_speed, current.zoomIn_speed);
							$('#ts-o-counter').hide();
							current.e.container.children().each(function() {
								if($c[0] != $(this)[0]) {
									$(this).hide();
								} else {
									$(this).addClass('transition');
								}
								$(this).removeClass(current.normalClass).addClass(current.fullClass);
							});

							// var i = 0;
							$children.each(function(key, val){
								console.log($(this));
								if($(this)[0].tagName.toLowerCase() != 'img') {
									$(this).hide();
									// $this.children().children($(this)[0].tagName.toLowerCase() + ':eq(' + i + ')');
								}
								// i++;
							});

							var s = setTimeout(function() {
								current.e.container.css({overflow:'visible'});
								current.is_zooming_full = false;								
							}, current.zoomIn_speed + 10);


						} else if(current.state == 'full') {
							current.is_zooming_full = true;
							current.state = 'normal';
							var o = false;
							$c = $(this);
							$children.each(function(){
								if($(this)[0].tagName.toLowerCase() != 'img') {
									$(this).fadeIn();
								} else if(!o) {
									var $i = $(this),
										w = (current.e.wrapper.innerWidth() / 100) * (parseInt(paddings.wrapper.horizontal) * 2),
										h = (current.e.wrapper.innerHeight() / 100) * (parseInt(paddings.wrapper.vertical) * 2);
									w += ( ($c.children().innerWidth() - w) / 100) * (parseInt(paddings.content.horizontal) * 2);
									h += ( ($c.children().innerWidth() - h) / 100) * (parseInt(paddings.content.vertical) * 2);
									o = true;
									$c.removeClass('transition');
									$(this).animate({
										maxWidth : '-=' + w + 'px',
										maxHeight : '-=' + h + 'px'
									}, 500, function(){
										current.updateSizes();
										current.e.container.children().each(function() {
											if($c[0] != $(this)[0]) {
												$(this).fadeIn(200);
											}
											$(this).removeClass(current.fullClass).addClass(current.normalClass);
										});
									});
									$c.children().css({padding : paddings.content.all});
									current.e.wrapper.css({padding : paddings.wrapper.all});
									current.e.container.css({overflow : 'hidden'});
									current.e.overlay.toggleClass('no-background-img');
									current.e.prev.fadeIn();
									current.e.next.fadeIn();
									current.e.viewsTrigger.fadeIn();
									current.is_zooming_full = false;
									$('#ts-o-counter').fadeIn();
								}
							});
						}
					}
				} else {
					swiping = false;
				}
			});

			var trigger_view_active = false;
			$('body').on('click', $classesID.viewsTrigger, function() {
				if(!trigger_view_active) {
					trigger_view_active = true;
					var c = this;
					$(this).stop(true, true).animate({opacity : 0.5}, 200).toggleClass('active').addClass('default-cursor');
					current.e.main.addClass('default-cursor');
					current.e.overlay.addClass('no-background-img');
					$elements.overlay.toggleClass('full-color');
					if(current.state == 'normal') {
						current.state = 'thumbnails';
						current.leftArray = [];
						var selectedIndex = current.currentSlide - 1;
						$.each(current.$slidesArray, function(key, val){
							$(this).addClass(current.thumbnailsClass);
							$(this).removeClass(current.normalClass);
							var left = $(this)[0].style.left;
							current.leftArray.push(left);
							left = (parseInt(left) !== 0) ? parseInt(left) / 5 : 0;
							var opacity = (key == selectedIndex) ? 1 : 0.4;
							$(this).animate({left : left + '%'}, 500, function() {
								$(this).animate({top : 0}, 400, function(){
									trigger_view_active = false;
									$(c).animate({opacity : 1}, 200).removeClass('default-cursor');
								});
							});
						});
						current.updateThumbnails(selectedIndex);
					} else {
						var s = setTimeout(function() {
							trigger_view_active = false;
							$(c).animate({opacity : 1}, 200).removeClass('default-cursor');		
							current.e.main.removeClass('default-cursor');						
							current.resteThumbnails();	
							current.state = 'normal';
							clearTimeout(s);
						}, 150);
					}
				}
			});

			// - navigation (next - prev slide)
			if(current.is_slider) {
				$('body').on('click', $classesID.next, function() {
					current.slideRight();
				});
				$('body').on('click', $classesID.prev, function() {
					current.slideLeft();
				});
			}

			// - Keyboard controll
			$('body').on('keyup', function(e) {
				if($(current.e.overlay).is(':visible')) {
					// - Close overlay or return to normal mode
					if(current.state == 'normal' && (e.keyCode == 27 || e.keyCode == 8)) {
						current.closeOverlay();
					} else if(current.state == 'thumbnails') {
						if(e.keyCode == 27 || e.keyCode == 8) {
							$($classesID.viewsTrigger).stop(true, true).animate({opacity : 0.5}, 200).toggleClass('active').addClass('default-cursor');
							current.e.main.addClass('default-cursor');
							current.e.overlay.addClass('no-background-img');
							$elements.overlay.toggleClass('full-color');
							$($classesID.viewsTrigger).animate({opacity : 1}, 200).removeClass('default-cursor');		
							current.e.main.removeClass('default-cursor');						
							current.resteThumbnails();	
							current.state = 'normal';
						} else if(current.state == 'full') {

						}
					}
					// - Navigation
					if(current.is_slider) {
						if(e.keyCode == 39) {
							current.slideRight();
						} else if(e.keyCode == 37) {
							current.slideLeft();
						}
					}
				}

				
			});


			// - Close the overlay (click event)
			if(typeof current.settings.close.click !== typeof undefined && current.settings.close.click) {
				$('body').on('click', $classesID.wrapper, function(e){
					if( (e.toElement == this || e.target == this) && current.state == 'normal') {
						current.closeOverlay();
					}
				});
			}
			// - Close the overlay (scroll down event)
			if(typeof current.settings.close.scrollDown !== typeof undefined && current.settings.close.scrollDown) {
				$(window).bind('mousewheel DOMMouseScroll', function(event){
					if($elements.overlay.is(':visible') && (event.originalEvent.wheelDelta < 0 || event.originalEvent.detail > 0)) {
						if(current.state == 'normal') {
							current.closeOverlay();
						} else {
							switch(current.state) {
								case 'thumbnails' :
									var s = setTimeout(function() {
										current.e.viewsTrigger.toggleClass('active').animate({opacity : 1}, 200).removeClass('default-cursor');		
										current.e.main.removeClass('default-cursor');						
										current.resteThumbnails();	
										current.state = 'normal';
										clearTimeout(s);
									}, 150);
									break;
								default :
									break;
							}
						}
					}
				});
			}
		},
		closeOverlay:function() {
			var current = this;
			$(current.ci.overlay).fadeOut(500, function() {
				current.close(true);
				current.updateOverflow(false);					
			});
		},
		slideRight:function() {
			var current = this;
			if(!$(current.ci.next).hasClass('no-more') && !current.is_sliding) {
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
							if(current.settings.has_counter) {
								$('#ts-o-counter-currentSlide').empty().text(current.currentSlide).removeClass();
							}
						});		
					});

				}
				current.navigation();
			}
		},
		slideLeft:function() {
			var current = this;
			if(!$(current.ci.prev).hasClass('no-more') && !current.is_sliding){
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
							if(current.settings.has_counter) {
								$('#ts-o-counter-currentSlide').empty().text(current.currentSlide).removeClass();
							}
						});	
					});
				}
				current.navigation();
			}
		},
		close:function(empty, leftSpeed, opacitySpeed){
			var current = this,
				$elements = current.e;
				empty = (typeof empty !== typeof undefined && typeof empty == 'boolean') ? empty : false;
				leftSpeed = (typeof leftSpeed !== typeof undefined && typeof leftSpeed == 'number') ? leftSpeed : 10;
				opacitySpeed = (typeof opacitySpeed !== typeof undefined && typeof opacitySpeed == 'number') ? opacitySpeed : 10;
			if(current.state == 'thumbnails') {
				$elements.viewsTrigger.removeClass('active');
				$elements.overlay.removeClass('full-color');
				$.each(current.$slidesArray, function(key, val){
					$(this).removeClass(current.thumbnailsClass + ' selected-slide neighbour-slide');
					var o = (parseInt(current.leftArray[key]) === 0) ? 1 : 0;
					$(this).animate({left : current.leftArray[key], opacity: o}, leftSpeed, function() {
						if(!empty)
							current.updateSizes();
						$(this).animate({opacity : 1}, opacitySpeed);
						current.state = 'normal';
					});
				});
				if(empty) {
					current.leftArray = [];
				}
			}	
		},
		navigation:function() {
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
		},
		resteThumbnails:function() {
			var current = this;
			$(current.ci.box).each(function(key, val) {
				var old_slide = current.currentSlide,
					o = (parseInt(current.leftArray[key]) === 0) ? 1 : 0;
				$(this).addClass(current.normalClass);
				$(this).removeClass(current.thumbnailsClass);
				current.e.overlay.removeClass('no-background-img');
				$(this).removeClass(current.thumbnailsClass + ' selected-slide neighbour-slide');
				$(this).animate({left : current.leftArray[key], opacity : o}, 500, function() {
					$(this).css({opacity : 1}, function() {
						current.state = 'normal';
					});
					if(parseInt(current.leftArray[key]) === 0 && current.settings.has_counter) {
						if(old_slide < current.currentSlide) {
							$('#ts-o-counter-currentSlide').addClass('nextCountSlide');
						} else if (old_slide > current.currentSlide) {
							$('#ts-o-counter-currentSlide').addClass('prevCountSlide');
						}
						var s = setTimeout(function() {
							$('#ts-o-counter-currentSlide').empty().text(key + 1).removeClass();
							clearTimeout(s);
						}, 300);
					}
				});
			});	
		},
		slideTo:function(index) {
			var current = this;
			var diff = current.currentSlide - index;
			if(diff !== 0) {
				var is_next = (diff < 0) ? true : false;
				var leftDirection = (is_next) ? '-=100%' : '+=100%';
				diff = (diff < 0) ? diff * -1 : diff;
				for (var i = 0; i < diff; i++) {
					$.each(current.$slidesArray, function() {
						$(this).animate({
							left: leftDirection
						}, 10);		
					});					
				}
			}
			current.currentSlide = index;
			if(current.settings.has_counter) {
				$('#ts-o-counter-currentSlide').empty().text(index);
			}
			current.navigation();
		},
		// ------------------------------------------------------------------------------------------------------------------------------------
		// - Run through elements to create them
		// ------------------------------------------------------------------------------------------------------------------------------------
		setElements:function(element) {
			var current = this;
			$.each(current.settings.elements, function(key, val){
				if(typeof val == 'object') {
					$.each(val, function(sk, sv){
						current.setIDClass(sk, sv);
					});
				} else {
					current.setIDClass(key, val);
				}
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

		// ------------------------------------------------------------------------------------------------------------------------------------
		// - Set ID and class attribute to elements
		// ------------------------------------------------------------------------------------------------------------------------------------
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
		updateSizes:function(speed, delay, callback) {
			var current = this;
			$(current.ci.box).each(function() {
				current.updateSize($(this), speed, delay, callback);
			});
		},
		updateSize:function($box, speed, delay, callback) {
			var current = this;
			speed = (typeof speed === typeof undefined) ? current.animationSpeed : speed;
			if(typeof delay === typeof undefined)
				delay = 10;
			current.e.container.css({overflow : 'hidden'});
			var s = setTimeout(function() {
				if($box.find('img').length > 0) {	
					var h = 0;
					$box.children().children().each(function(){
						if($(this).is(':visible'))
							h += parseInt($(this).outerHeight(true));
					});
					var $img = $box.find('img').first(),
						img_h = $img.innerHeight(),									// - img height
						img_w = $img.innerWidth(),									// - img width
						cont_h = current.e.container.innerHeight(),					// - container height
						cont_w = current.e.container.innerWidth(),					// - content width
						diff = cont_h - h,											// - blank space free
						v = img_h + diff,											// - variation between the current height and the max height
						maxwidth = (current.state == 'full') ? current.e.main.innerWidth() : (cont_w * 80) / 100;

					if(img_h > img_w)
						$img.css({height: v});
					else
						$img.css({width : maxwidth});

					$img.css({maxWidth : maxwidth});
					$img.stop(true, true).animate({maxHeight : v}, speed, function(){
						if(typeof callback == 'function') {
							callback();
						}
						$box.children().children().each(function() {
													console.log($(this));
							$(this).css({maxWidth : maxwidth});
						});					
						clearTimeout(s);
					});
				}
			}, delay);
		},
		// ------------------------------------------------------------------------------------------------------------------------------------
		// - Update the body overflow style
		// ------------------------------------------------------------------------------------------------------------------------------------	
		updateOverflow:function(open) {
			var current = this;
			if(open) {
				var ox = $('body').css('overflowX'),
					oy = $('body').css('overflowY');
				current.bodyOverflow[0] = (typeof ox !== typeof undefined) ? ox : 'auto';
				current.bodyOverflow[1] = (typeof ox !== typeof undefined) ? oy : 'auto';
				$('body').css('overflow', 'hidden');
			} else {
				$('body').css('overflowX', current.bodyOverflow[0]);
				$('body').css('overflowY', current.bodyOverflow[1]);
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
		}
	};

	ftSlider.prototype.constructor = ftSlider;

	$.fn.tSlider = function(options) {
		return this.each(function() {
       		new ftSlider(this, options);
   		});
   	};

   	$.fn.tSlider.settings = {};

})(jQuery);