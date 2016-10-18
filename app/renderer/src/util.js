module.exports = {
  instrumentHref,
  placeableHref
}

function placeableHref(placeable, instrument) {
  return '/calibrate/' + instrument.axis + '/' + placeable.label
}

function instrumentHref(instrument) {
  return '/calibrate/' + instrument.axis
}
