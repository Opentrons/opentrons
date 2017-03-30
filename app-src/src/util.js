module.exports = {addHrefs, processProtocol, processTasks}

function addHrefs (tasks) {
  tasks.deck.map((placeable) => {
    placeable.href = '/calibrate/' + placeable.instruments[0].axis + '/' + placeable.slot + '/' + placeable.label
  })
  tasks.instruments.map((instrument) => {
    instrument.href = '/calibrate/' + instrument.axis
  })
}

function processProtocol (response) {
  let result = {success: true, errors: [], warnings: [], calibrations: []}
  // console.log(response)
  let data = response.body.data
  result.calibrations = data.calibrations || []
  if (data.errors && data.errors.length > 0) {
    result.success = false
  }
  result.fileName = data.fileName
  result.lastModified = data.lastModified
  return result
}

function processTasks (result, commit) {
  let tasks = result.calibrations
  let fileName = result.fileName
  let lastModified = result.lastModified
  addHrefs(tasks)
  commit('UPDATE_FILE_NAME', {'fileName': fileName})
  commit('UPDATE_FILE_MODIFIED', {'lastModified': lastModified})
  return tasks
}
