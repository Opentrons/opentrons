//Display/toggle well z pos diagrams next to save container calibrations
delegateEvent('click', '.position.top', function(e, el) {
    e.preventDefault();
    var modal = el.parentNode.parentNode;
    console.log(modal.classList);
    if(!modal.classList.contains('mode-top')){
    	modal.classList.remove("mode-bottom");
    	modal.classList.add("mode-top");
    } 
});

delegateEvent('click', '.position.bottom', function(e, el) {
    e.preventDefault();
    var modal = el.parentNode.parentNode;
    if(!modal.classList.contains('mode-bottom')){
    	modal.classList.remove("mode-top");
    	modal.classList.add("mode-bottom");
    }
});

delegateEvent('click', '.save.top', function(e, el) {
	//to-do: send saved positions to labsuite
	//on successful save, apply top class to move to button
	//for now this lives here as a click event.
	var moveto = el.nextElementSibling;
	if(!moveto.classList.contains('top')){
		moveto.classList.add('top');
	}	
});

delegateEvent('click', '.save.bottom', function(e, el) {
	//to-do: send saved positions to labsuite
	//on successful save, apply top class to move to button
	//for now this lives here as a click event.
	var moveto = el.nextElementSibling;
	if(!moveto.classList.contains('bottom')){
		moveto.classList.add('bottom');
	}	
});



