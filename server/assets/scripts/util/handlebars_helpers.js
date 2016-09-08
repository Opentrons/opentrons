Handlebars.registerHelper('class_if', function() {
	var checks = [],
	    args = Array.prototype.slice.call(arguments),
	    classes = [];
	while (args.length > 0) {
		checks.push(args.splice(0, 2));
	}
	for (var k in checks) {
		if (checks[k][1]) classes.push(checks[k][0]);
	}
	if (classes.length > 0) {
		return 'class="'+classes.join(' ')+'"';
	} else {
		return '';
	}
});