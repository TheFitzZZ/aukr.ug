(function() {
	'use strict';

	var carousels = document.querySelectorAll('[data-event-carousel]');

	Array.prototype.forEach.call(carousels, function(carousel) {
		var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-carousel-slide]'));
		var viewport = carousel.querySelector('[data-carousel-viewport]');
		var previousButton = carousel.querySelector('[data-carousel-prev]');
		var nextButton = carousel.querySelector('[data-carousel-next]');
		var autoplayButton = carousel.querySelector('[data-carousel-autoplay]');
		var autoplayLabel = carousel.querySelector('[data-carousel-autoplay-label]');
		var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-carousel-dot]'));
		var status = carousel.querySelector('[data-carousel-status]');
		var announcement = carousel.querySelector('[data-carousel-announcement]');
		var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		var supportsInert = 'inert' in HTMLElement.prototype;
		var autoplayDelay = 8000;
		var currentIndex = 0;
		var timer = null;
		var userPaused = false;
		var pointerInside = false;
		var focusInside = false;
		var touchStartX = null;
		var touchStartY = null;

		if (slides.length < 2 || !viewport || !previousButton || !nextButton || !autoplayButton)
			return;

		viewport.setAttribute('tabindex', '0');
		viewport.setAttribute('aria-label', 'Veranstaltungen; mit den Pfeiltasten wechseln');

		function setFallbackInteractivity(slide, active) {
			var focusable = slide.querySelectorAll('a[href], button, input, select, textarea, [tabindex]');

			Array.prototype.forEach.call(focusable, function(element) {
				if (!active) {
					if (!element.hasAttribute('data-carousel-original-tabindex')) {
						element.setAttribute(
							'data-carousel-original-tabindex',
							element.hasAttribute('tabindex') ? element.getAttribute('tabindex') : '__none__'
						);
					}
					element.setAttribute('tabindex', '-1');
				} else if (element.hasAttribute('data-carousel-original-tabindex')) {
					var originalTabindex = element.getAttribute('data-carousel-original-tabindex');

					if (originalTabindex === '__none__')
						element.removeAttribute('tabindex');
					else
						element.setAttribute('tabindex', originalTabindex);

					element.removeAttribute('data-carousel-original-tabindex');
				}
			});
		}

		function setSlideState(slide, active) {
			slide.classList.toggle('is-active', active);
			slide.setAttribute('aria-hidden', active ? 'false' : 'true');

			if (supportsInert)
				slide.inert = !active;
			else
				setFallbackInteractivity(slide, active);
		}

		function announceCurrentSlide() {
			var title = slides[currentIndex].getAttribute('data-carousel-title');

			announcement.textContent = '';
			window.setTimeout(function() {
				announcement.textContent = 'Veranstaltung ' + (currentIndex + 1) + ' von ' + slides.length + ': ' + title;
			}, 20);
		}

		function updateControls() {
			status.textContent = (currentIndex + 1) + ' von ' + slides.length;

			Array.prototype.forEach.call(dots, function(dot, index) {
				var active = index === currentIndex;

				dot.classList.toggle('is-active', active);

				if (active)
					dot.setAttribute('aria-current', 'true');
				else
					dot.removeAttribute('aria-current');
			});
		}

		function clearAutoplay() {
			if (timer !== null) {
				window.clearTimeout(timer);
				timer = null;
			}
		}

		function canAutoplay() {
			return !userPaused && !pointerInside && !focusInside && !document.hidden && !reducedMotion.matches;
		}

		function scheduleAutoplay() {
			clearAutoplay();

			if (!canAutoplay())
				return;

			timer = window.setTimeout(function() {
				showSlide(currentIndex + 1, false);
			}, autoplayDelay);
		}

		function showSlide(index, shouldAnnounce) {
			currentIndex = (index + slides.length) % slides.length;

			Array.prototype.forEach.call(slides, function(slide, slideIndex) {
				setSlideState(slide, slideIndex === currentIndex);
			});

			updateControls();

			if (shouldAnnounce)
				announceCurrentSlide();
			else
				announcement.textContent = '';

			scheduleAutoplay();
		}

		function updateAutoplayButton() {
			var disabledByPreference = reducedMotion.matches;

			autoplayButton.disabled = disabledByPreference;
			autoplayButton.setAttribute('aria-pressed', userPaused ? 'true' : 'false');

			if (disabledByPreference) {
				autoplayLabel.textContent = 'Automatik aus';
				autoplayButton.setAttribute('aria-label', 'Automatischer Wechsel wegen reduzierter Bewegung deaktiviert');
			} else if (userPaused) {
				autoplayLabel.textContent = 'Abspielen';
				autoplayButton.setAttribute('aria-label', 'Automatischen Wechsel starten');
			} else {
				autoplayLabel.textContent = 'Pause';
				autoplayButton.setAttribute('aria-label', 'Automatischen Wechsel pausieren');
			}
		}

		autoplayButton.addEventListener('click', function(event) {
			userPaused = !userPaused;

			if (!userPaused && event.detail > 0)
				autoplayButton.blur();

			updateAutoplayButton();
			announcement.textContent = userPaused ? 'Automatischer Wechsel pausiert' : 'Automatischer Wechsel gestartet';
			scheduleAutoplay();
		});

		previousButton.addEventListener('click', function() {
			showSlide(currentIndex - 1, true);
		});

		nextButton.addEventListener('click', function() {
			showSlide(currentIndex + 1, true);
		});

		Array.prototype.forEach.call(dots, function(dot) {
			dot.addEventListener('click', function() {
				showSlide(parseInt(dot.getAttribute('data-carousel-dot'), 10), true);
			});
		});

		viewport.addEventListener('keydown', function(event) {
			if (event.key === 'ArrowLeft') {
				event.preventDefault();
				showSlide(currentIndex - 1, true);
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				showSlide(currentIndex + 1, true);
			}
		});

		viewport.addEventListener('touchstart', function(event) {
			if (event.touches.length !== 1)
				return;

			touchStartX = event.touches[0].clientX;
			touchStartY = event.touches[0].clientY;
		}, { passive: true });

		viewport.addEventListener('touchend', function(event) {
			if (touchStartX === null || touchStartY === null || event.changedTouches.length !== 1)
				return;

			var deltaX = event.changedTouches[0].clientX - touchStartX;
			var deltaY = event.changedTouches[0].clientY - touchStartY;

			touchStartX = null;
			touchStartY = null;

			if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY))
				return;

			showSlide(deltaX > 0 ? currentIndex - 1 : currentIndex + 1, true);
		}, { passive: true });

		carousel.addEventListener('mouseenter', function() {
			pointerInside = true;
			clearAutoplay();
		});

		carousel.addEventListener('mouseleave', function() {
			pointerInside = false;
			scheduleAutoplay();
		});

		carousel.addEventListener('focusin', function() {
			focusInside = true;
			clearAutoplay();
		});

		carousel.addEventListener('focusout', function() {
			window.setTimeout(function() {
				focusInside = carousel.contains(document.activeElement);
				scheduleAutoplay();
			}, 0);
		});

		document.addEventListener('visibilitychange', scheduleAutoplay);

		function handleMotionPreference() {
			updateAutoplayButton();
			scheduleAutoplay();
		}

		if (typeof reducedMotion.addEventListener === 'function')
			reducedMotion.addEventListener('change', handleMotionPreference);
		else
			reducedMotion.addListener(handleMotionPreference);

		carousel.classList.add('event-carousel--ready');
		updateAutoplayButton();
		showSlide(0, false);
	});
})();
