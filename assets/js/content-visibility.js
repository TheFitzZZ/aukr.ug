// Removes generated content whose data-visible-until date (YYYY-MM-DD, Europe/Berlin) has passed
// and re-indexes the event carousel. Must run before event-carousel.js.
(function() {
	'use strict';

	function berlinToday() {
		try {
			var parts = {};
			new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' })
				.formatToParts(new Date())
				.forEach(function(part) { parts[part.type] = part.value; });
			return parts.year + '-' + parts.month + '-' + parts.day;
		} catch (error) {
			var now = new Date();
			return now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2);
		}
	}

	var today = berlinToday();

	Array.prototype.forEach.call(document.querySelectorAll('[data-visible-until]'), function(element) {
		if (today <= element.getAttribute('data-visible-until'))
			return;

		if (element.hasAttribute('data-carousel-slide')) {
			var dot = document.querySelector('[data-carousel-dot][aria-controls="' + element.id + '"]');
			if (dot && dot.parentNode) dot.parentNode.removeChild(dot);
		}

		if (element.parentNode) element.parentNode.removeChild(element);
	});

	Array.prototype.forEach.call(document.querySelectorAll('[data-event-carousel]'), function(carousel) {
		var slides = carousel.querySelectorAll('[data-carousel-slide]');
		var dots = carousel.querySelectorAll('[data-carousel-dot]');
		var status = carousel.querySelector('[data-carousel-status]');

		if (slides.length === 0) {
			carousel.parentNode.removeChild(carousel);
			return;
		}

		Array.prototype.forEach.call(slides, function(slide, index) {
			slide.classList.toggle('is-active', index === 0);
			slide.setAttribute('aria-label', (index + 1) + ' von ' + slides.length + ': ' + slide.getAttribute('data-carousel-title'));
		});

		Array.prototype.forEach.call(dots, function(dot, index) {
			dot.setAttribute('data-carousel-dot', String(index));
			dot.classList.toggle('is-active', index === 0);
			if (index === 0) dot.setAttribute('aria-current', 'true');
			else dot.removeAttribute('aria-current');
		});

		if (status) status.textContent = '1 von ' + slides.length;
	});
})();
