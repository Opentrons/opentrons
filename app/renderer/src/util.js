module.exports = {addHrefs, processProtocol}

function addHrefs(tasks) {
  tasks.map((instrument) => {
    instrument.href = '/calibrate/' + instrument.axis
    instrument.placeables.map((placeable) => {
      placeable.href = '/calibrate/' + instrument.axis + '/' + placeable.label
    })
  })
}

function processProtocol(response) {
  let result = {success: true, errors: [], warnings: [], calibrations: []}
  let data = response.body.data
  result.calibrations = data.calibrations || []
  if (data.errors && data.errors.length > 0) {
    result.success = false
  }
  result.fileName = data.fileName
  result.lastModified = data.lastModified
  return result
}
