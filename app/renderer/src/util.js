module.exports = {
  instrumentHref,
  placeableHref,
  mapRoutes
}

function placeableHref(placeable, instrument) {
  return '/calibrate/' + instrument.axis + '/' + placeable.label
}

function instrumentHref(instrument) {
  return '/calibrate/' + instrument.axis
}

function mapRoutes(tasks){
	tasks.map((instrument) => {
	    instrument.href = instrumentHref(instrument)
	    instrument.placeables.map((placeable) => {
	      placeable.href = placeableHref(placeable, instrument)
	    })
	  })
	return tasks
}
