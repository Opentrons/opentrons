// This file is the only file that gets called by the initial page load.
function Application() {

	function init() {
		initialize_path();
	}

	function initialize_path(path) {
		if (!path) {
			path = window.location.pathname.split('/');
			path.shift();
		}
		load_path_handlers(path);
		load_page_handlers(path);
	}

	function load_path_handlers(path) {
		/**
		 * Path handlers load all the files in the scripts/paths directory and
		 * wraps them into named autoclosures which get called, subsequently,
		 * in a top-down order.
		 *
		 * So if you're at example.com/setup/calibration/volume, this method
		 * would load: setup.js, then setup/calibration.js, then
		 * then setup/calibration/volume.js.
		 */
		var prev_paths = [];
		path.forEach(function(p) {
			prev_paths.push(p.toLowerCase());
			var cur_path = prev_paths.join('/');
			if (PathHandlers[cur_path]) {
				PathHandlers[cur_path]();
			}
		});
	}

	function load_page_handlers(path) {
		/**
		 * Load the first available page handler, starting at the bottom level
		 * and working upwards.
		 *
		 * So if you're at example.com/setup/calibration/volume, this method
		 * would check to se if setup/calibration/volume.js exists, and if
		 * not, try setup/calibration.js, etc.
		 */
		var path_list = [];
		var prev_paths = [];
		path.forEach(function(p) {
			prev_paths.push(p.toLowerCase());
			path_list.push(prev_paths.join('/'))
		});
		path_list.reverse();
		for (var p in path_list) {
			if (PageHandlers[path_list[p]]) {
				PageHandlers[path_list[p]]();
				break;
			}
		}
	}

	init();

}