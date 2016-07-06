(function() {

	function get_closest_matching(el, selector) {
		while (el && el.matches) {
			if(el.matches(selector)) return el;
			el = el.parentNode;
		}
	}

	function delegateEvent(eventType, selector, fun) {
		document.body.addEventListener(eventType, function(e) {
			var el = get_closest_matching(e.target, selector);
			if (el) fun(e, el);
		});
	}

	window.delegateEvent = delegateEvent;

}());