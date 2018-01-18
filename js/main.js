$(document).ready(function() {

	// ------------------------------------------------------------------------------------------------------------------------------------
	// - jQuery Object
	// ------------------------------------------------------------------------------------------------------------------------------------
	var $body = $('body');


	$body.on('mouseover', '#tgrid-caption-sample', function(){
   		$(this).children('.tg-c').clearQueue().removeClass('tg-a-reste').addClass('tg-c-hover');
   	}).on('mouseleave', '#tgrid-caption-sample', function(){
   		$(this).children('.tg-c').toggleClass('tg-a-reste tg-c-hover');
   	});

   	$.fn.containAnyClasses = function(c) {
   		var classes = c.split(" ");
   		var $t = $(this);
   		var tc = $t.attr('class');
   		var ok = false;
   		$.each(classes, function(key, cl) {
   			if (tc.search(cl) >= 0) {
   				ok = true;
   				return;
   			};
   		});
   		return ok;
   	}

	$.fn.hasAnyClass = function() {
	    for (var i = 0; i < arguments.length; i++) {
	        var classes = arguments[i].split(" ");
	        for (var j = 0; j < classes.length; j++) {
	            if ($(this).hasClass(classes[j])) {
	                return true;
	            }
	        }
	    }
	    return false;
	};

// ------------------------------------------------------------------------------------------------------------------------------------
// - framework's options
// ------------------------------------------------------------------------------------------------------------------------------------

	var optionsDoc=function(container){
		this.container = container;
		this.is_options = false;
		this.init();
	};
	optionsDoc.prototype={
		init:function(){
			var current = this;
			$(current.container + ' .options li').click(function(){
				var self = this,
					t = (current.is_options) ? 0 : 500;
				$(this).clearQueue();
				if(!$(self).hasClass('selected')) {
					$(current.container + ' .options').animate({marginLeft : 0}, t, function(){
						$(current.container + ' .options li').each(function(){
							$(this).removeClass('selected');
						});
						$(self).addClass('selected');
						$(current.container + ' #options-body-container').fadeOut(200, function(){
							$(this).empty();
							id = $(self).attr('data-content');
							$clone = $('#'+id).clone().removeAttr('id').attr('data-content', id);
							$(current.container + ' #options-body-container').css({position : 'relative', opacity : 1}).stop(true, true).fadeIn(200, function(){
								$(this).append($clone);
								$(this).children('.options-body').slideDown().animate({opacity : 1}, 200);
							});
						});
						current.is_options = true;
					});

				} else {
					var ml = ($(window).width() > 480) ? '25%' : '';
					$(current.container + ' .options').animate({opacity : 1, marginLeft: ml}, t, function(){
						$(current.container + ' .options li').each(function(){
							$(this).removeClass('selected');
						});
						$(current.container + ' #options-body-container').empty().hide();
					});
					current.is_options = false;
				}
			});
		}
	};
	optionsDoc.prototype.constructor = optionsDoc;
	var sliderOptions = new optionsDoc('#slider_options');
	var generalOptions = new optionsDoc('#options');

// ------------------------------------------------------------------------------------------------------------------------------------
// - Bind a link with a sub options
// ------------------------------------------------------------------------------------------------------------------------------------

	$('.sub-option').click(function(){
		var subOption = $(this).attr('data-suboption'),
			container = $(this).attr('href'),
			containerObj = '',
			objects = [sliderOptions, generalOptions];

		$.each(objects, function(key, obj){
			if(obj.container == container) {
				containerObj = obj;
			}
		});

		if(typeof containerObj == 'object') {
			var is_already = $(container + ' #options-body-container > div').attr('data-content') == subOption;
			if(!is_already) {
				$(container + ' .options').animate({marginLeft : 0}, 500, function(){
					$(container + ' .options li').each(function(){
						$(this).removeClass('selected');
						if($(this).attr('data-content') == subOption) {
							$(this).addClass('selected');
						}
					});
					$(self).addClass('selected');
					$(container + ' #options-body-container').fadeOut(200, function(){
						$(this).empty();
						$clone = $('#'+subOption).clone().removeAttr('id').attr('data-content', subOption);
						$(container + ' #options-body-container').css({position : 'relative', opacity : 1}).stop(true, true).fadeIn(200, function(){
							$(this).append($clone);
							$(this).children('.options-body').slideDown().animate({opacity : 1}, 200);
						});
					});
					containerObj.is_options = true;
				});				
			}
		}
	});

	$.fn.smoothScroll = function(options) {
		var defaults = {
			min: 800,
			max: 2000,
			diff_div: 10
		};
		var settings = $.extend( {}, defaults, options);
		var $anchor = $(this);
		var scroll = $(window).scrollTop();
		var el_pos = $anchor.offset().top;
		var diff = scroll > el_pos ? scroll - el_pos : el_pos - scroll;
		var t = (diff / settings.diff_div) + settings.min;
		if (t > settings.max) {
			t = settings.max;
		}
		$('html, body').animate({scrollTop: $anchor.offset().top - 10}, t, 'linear');
	}


	$body.on('click', 'a', function(){
		if(!$(this).hasClass('no-scroll')) {
			if (typeof $(this).attr('href') === typeof undefined) return;
			var anchor = $(this).attr('href');
			$(anchor).smoothScroll();
		}
	});

	$(window).scroll(function(){
		if($(window).scrollTop() > 800) {
			$('#btn-top').stop(true, true).fadeIn();
		} else {
			$('#btn-top').stop(true, true).fadeOut();
		}
	});

	$('.radio-buttons').on('click', 'button', function() {
		var $button = $(this);
		var $parent = $button.parent();
		var pid = $parent.attr('id');
		var $buttons = $parent.children('button');
		$buttons.removeClass('active');
		$button.addClass('active');

		// - Toggles classes, based on the parent ID
		var toggleClasses = '';
		switch(pid) {
			case 'caption_theme_switcher':
				$('#caption .box-demo').toggleClass('tg-ct-dark tg-ct-light');
				break;
			case 'caption_animation_switcher':
				$('#caption .box-demo').toggleClass('tg-c-animation');
				break;
			case 'slider_theme_switcher':
				var $imgs = $('#slider_themes_mode').find('img');
				var is_dark = $imgs.first().attr('src').indexOf('dark') > 0;
				var theme = $button.data('theme');
				if ((theme == 'dark' && is_dark) || (theme == 'light' && !is_dark)) return;
				$imgs.each(function() {
					$img = $(this);
					path = $img.attr('src');
					new_path = is_dark ? path.replace('dark', 'light') : path.replace('light', 'dark');
					$img.attr('src', new_path);
				});
				break;
			case 'slider_theme_hover_switcher':
				var theme = $button.data('theme');
				var is_dark = $('#slider_hoverEffects').find('.box-demo').first().hasClass('ts-ht-dark');
				if ((theme == 'dark' && is_dark) || (theme == 'light' && !is_dark)) return;
				$('#slider').find('.box-demo').each(function() {
					$box = $(this);
					$box.toggleClass('tg-zt-dark tg-zt-light');
					$box.animate({
						opacity: 1
					}, 550, function(){
						$box.removeClass('blinking-t');
					});
				});

				break;
		}
	});

	// - Themes switch
	// $('#btn-zt-switcher').click(function() {

	// });

	// var dark = false;
	// $('#btn-slider-theme-switcher').click(function() {
	// 	var path = $('#slider_themes_mode > div').first().children('img').attr('src');
	// 	var dark = true;
	// 	if(path.indexOf('light') > 0) {
	// 		dark = false;
	// 	}
	// 	$('#slider_themes_mode > div').each(function(){
	// 		var path = $(this).children('img').attr('src'),
	// 			new_path = (dark) ? path.replace('dark', 'light') : path.replace('light', 'dark');
	// 		$(this).children('img').animate({
	// 			opacity : 0
	// 		}, 200, function(){
	// 			$(this).css('opacity', 1).attr('src', new_path);
	// 		});
	// 	});
	// });


	$('#btn-top').click(function(){
		$('html, body').animate({
			scrollTop : 0
		}, 1000);
	});

	/************** copy to clipboard *****************/

	var copyToClipBoard=function(no_copy_class){
		this.no_copy_class = no_copy_class;
		this.is_copy = false;
		this.dataArray = [];
		this.init();
	};

	copyToClipBoard.prototype={
		init:function(){
			var current = this;
			if (navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0) {
				$body.addClass(current.no_copy_class);       
			} else {
				current.copy($('#zoom_end'));
				$('h6 span').click(function(){
					current.copy($(this));
				});
			}

			// - filing the generator data
			current.dataArray[0] = [];
			current.dataArray[1] = [];
			current.dataArray[2] = 'tg-c-animation';
			current.dataArray[3] = ['light', 'dark'];
			$('#caption h6 span').each(function(){
				var c = $(this).text().replace('.', '');
				current.dataArray[0].push(c);
			});
			$('#slider h6 span').each(function(){
				var c = $(this).text().replace('.', '');
				current.dataArray[1].push(c);
			});
			$('#btnRdmClasses').click(function(){
				current.generator();
			});
			current.generator();
		},
		copy:function($element) {
			var current = this;
			if(!current.is_copy && !$body.hasClass(current.no_copy_class)) {
				current.is_copy = true;
				var text = $element.text();
				var width = $element.outerWidth();
				$body.append('<input type="text" id="temp" style="position:absolute;opacity:0;">');
			  	$('#temp').val(text.replace('.', '')).select();
				try {
				  	document.execCommand('copy');
				  	$element.css({minWidth : width + 'px'}).empty().html('copied').addClass('copied').animate({
				  		opacity : 1
				  	}, 500, function(){
				  		$element.empty().html(text).removeClass('copied').css({width:'auto', minWidth : 0});
				  	});
			  	} catch(err) {
			  		$body.addClass(current.no_copy_class);
			  		current.is_copy = false;
			  	} finally {
			  		$('#temp').remove();
			  		var s = setTimeout(function(){
			  			if(current.is_copy)
			  				current.is_copy = false;
			  			clearTimeout(s);
			  		}, 500);
			  	}
		  	}
		},
		generator:function() {
			var current = this,
				caption_effect = current.dataArray[0][Math.floor(Math.random() * ((current.dataArray[0].length)))],
				caption_theme = current.dataArray[3][Math.floor(Math.random() * ((current.dataArray[3].length)))],
				caption_text = (Math.floor(Math.random() * (2))) ? 'tg-c-animation ' : '',
				zoom_effect = current.dataArray[1][Math.floor(Math.random() * ((current.dataArray[1].length)))],
				zoom_theme = current.dataArray[3][Math.floor(Math.random() * ((current.dataArray[3].length)))];
			$('#rdmClasses').empty()
						    .append(caption_effect + ' ')
						    .append('tg-ct-' + caption_theme + ' ')
					        .append(caption_text)
						    .append(zoom_effect + ' ')
						    .append('tg-ht-' + zoom_theme);			
		}
	};
	
	copyToClipBoard.prototype.constructor = copyToClipBoard;
	var ctc = new copyToClipBoard('no-copy');

	if ($('#captionSamples').length > 0) {
		var has_show_tip_copy = false;
		$(window).scroll(function(){
			var wScroll = $(window).scrollTop();
			var cTop = $('#captionSamples').position().top;
			var zBottom = $('#zoom_end').position().top;
			if(!has_show_tip_copy && wScroll > cTop && wScroll < zBottom) {
				$('#copy_tip').fadeIn(500, function(){
					var s = setTimeout(function(){
						$('#copy_tip').fadeOut(500, function(){
							clearTimeout(s);
						});
					}, 2500);
				});
				has_show_tip_copy = true;	
			} else if (wScroll < cTop || wScroll > zBottom){
				$('#copy_tip').fadeOut();
			}
		});
		$('#copy_tip').click(function(){
			$(this).fadeOut();
		});
	}

	// ------------------------------------------------------------------------------------------------------------------------------------
	// - Basic demo slider
	// ------------------------------------------------------------------------------------------------------------------------------------
		
	var demo_slider=function(container, sliderContainer, boxClass, triggerClass){
		this.container = container;
		this.sliderContainer = sliderContainer;
		this.boxClass = boxClass;
		this.triggerClass = triggerClass;

		this.index = 1;
		this.effect = '';
		this.maxSlides = 0;
		this.sliding = false;

		this.init();
	};

	demo_slider.prototype={
		init:function(){
			var current = this;
			current.effect = $(current.container + ' ' + current.triggerClass).first().text().replace('.', '');
			$(current.sliderContainer + ' ' + current.boxClass).each(function(){
				$(this).addClass('ts-e-' + current.effect);
				current.maxSlides++;
			});
			
			$(current.triggerClass).click(function() {
				$('html, body').animate({scrollTop: $(current.sliderContainer).offset().top}, 300);
			});

			$('#next').click(function(){
				if(!current.sliding)
					current.navigation(true);
			});
			$('#prev').click(function(){
				if(!current.sliding)
					current.navigation(false);
			});

			current.updateArrow();
			current.updateTriggers();
		},
		navigation:function(next){
			var current = this,
				left = (next) ? '-=100%' : '+=100%',
				i = 1;
			current.sliding = true;
			$(current.sliderContainer + ' ' + current.boxClass).each(function(){
				$(this).animate({left: left}, 1000, function(){
					console.log(i);
					console.log(current.maxSlides);
					if(i == current.maxSlides)
						current.sliding = false;
					i++;
				});
			});
			current.index = (next) ? current.index + 1 : current.index - 1;
			$(current.sliderContainer + ' ' + current.boxClass).removeClass('active');
			$(current.sliderContainer + ' ' + current.boxClass).eq(current.index - 1).addClass('active');
			current.updateArrow();
		},
		updateArrow:function() {
			var current = this;
			$('#prev').show();
			$('#next').show();
			if(current.index == 1) {
				$('#prev').hide();
			} else if(current.index == current.maxSlides) {
				$('#next').hide();
			}
		},
		updateTriggers:function() {
			var current = this;
			$(current.container + ' ' + current.triggerClass).click(function(){
				if(!$(this).hasClass('active')) {
					$(current.container + ' ' + current.triggerClass).each(function(){
						$(this).removeClass('active');
					});
					$(this).addClass('active');
					var new_effect = 'ts-e-' + $(this).text().replace('.', '');
					$(current.sliderContainer + ' ' + current.boxClass).each(function(){
						$(this).removeClass(current.effect).addClass(new_effect);
					});
					current.effect = new_effect;
					$(current.sliderContainer + ' ' + '#message').stop(true, false).empty().html('.' + new_effect).fadeIn(500).delay(1000).fadeOut(500);
				}
			});			
		}
	};
	
	demo_slider.prototype.constructor = demo_slider;
	var basicSlider = new demo_slider('#slideEffects', '#slideEffects_slider', '.ts-box', '.button');

	// - Show or hide more ways content by clicking
	$('.more-ways').children('a').on('click', function() {
		var $parent = $(this).closest('.more-ways');
		$parent.find('div').slideToggle();
	});

	// - Question system
	var question_system_in_use = false;
	$('.question-system').on('click', 'button', function() {
		if (question_system_in_use) return;
		question_system_in_use = true;
		var $button = $(this);
		var $parent = $button.closest('.question-system');
		var $answers = $parent.children('article');
		if ($button.hasClass('active')) {
			$answers.slideUp();
			question_system_in_use = false;
			$parent.find('button').removeClass('active');
		} else {
			var i = $button.data('val');
			$answers.not('[data-val="' + i + '"]').slideUp(300 ,function() {
				$answers.filter('[data-val="' + i + '"]').slideDown();
				$parent.find('button').removeClass('active');
				$button.addClass('active');
				question_system_in_use = false;
			});
		}
	});

	// - Menu
	
	var $openMenu = $('#menu_btn');
	var $menu = $('#t_menu');

	var toggleMenu = function() {
		$openMenu.toggleClass('active');
		$menu.toggleClass('active');
		$body.toggleClass('no-scroll');
	};

	$openMenu.on('click', function() {
		toggleMenu();
	});

	$menu.on('click', 'a', function(e) {
		toggleMenu();
	});

	// - Sub menus
	$menu.on('click', 'li > span', function() {
		var $span = $(this);
		var $li = $span.parent();
		var $subMenu = $li.children('ol');
		if ($subMenu.length > 0) {
			$subMenu.slideToggle();
			$span.toggleClass('icon-circle-down icon-circle-up');
		}
	});

	$menu.on('click', 'ol li', function() {
		var $li = $(this);
		var $ol = $li.parent();
		var $pli = $ol.parent();
		var ref = $pli.children('a').attr('href');
		var $article = $(ref).children('article').filter(':eq(' + $li.index() + ')');
		$article.smoothScroll();
		toggleMenu();
	});

	$body.on('keypress', function(e) {
		var key = e.which ? e.which : e.keyCode;
	});

	// - Animation du loader svg
	var $logo_loader = $('#logo_loader');
	$logo_loader.find('.logo-piece').attr('class', 'logo-piece logo-piece-anim');
	setInterval(function(){
		if (!$logo_loader.is(':visible')) return;
		$logo_loader.find('.logo-piece').attr('class', 'logo-piece');
		var t = setTimeout(function() {
			$logo_loader.find('.logo-piece').attr('class', 'logo-piece logo-piece-anim');
			clearTimeout(t);
		}, 100);
	}, 14000);





});