module.exports = {addHrefs}

function addHrefs(tasks) {
  tasks.map((instrument) => {
    instrument.href = '/calibrate/' + instrument.axis
    instrument.placeables.map((placeable) => {
      placeable.href = '/calibrate/' + instrument.axis + '/' + placeable.label
    })
  })
}
