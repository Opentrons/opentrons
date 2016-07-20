(function() {
	function ModalController() {
		this.mode = "top";
	}

    ModalController.prototype = {
    	setMode: function(modal, mode) {
    		//remove exisitng mode-# class and add new 
    		modal.className = modal.className.replace(/\bmode-(.*?)\b/g, '');
    		modal.classList.add("mode-"+mode);
    	},
    	activateMove: function(el, mode){
    		var moveto = el.nextElementSibling;
			moveto.className = moveto.className.replace(mode, '');
			moveto.classList.add(mode);
    	},
    	activateIncrement: function(target, siblings){
    		for (var i = 0; i < siblings.length; i++){
    			siblings[i].classList.remove('active');
    		}
    		target.classList.add('active');
    	}
    }

	window.ModalController = ModalController;

}());