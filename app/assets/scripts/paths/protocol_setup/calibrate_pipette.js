//Display/toggle well z pos diagrams next to save container calibrations
delegateEvent('click', '.position', function(e, el) {
    e.preventDefault();
    var img = document.querySelector('.pipette-pos').firstElementChild;
	img.src="../../img/"+ el.href.split("#")[1]+".png";
});




