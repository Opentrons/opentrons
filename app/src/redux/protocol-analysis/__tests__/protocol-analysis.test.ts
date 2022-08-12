import * as ProtocolAnalysis from '..'

describe('config', () => {
  describe('actions', () => {
    it('can create a protocol-analysis:OPEN_PYTHON_DIRECTORY action to request the python directory file to open', () => {
      expect(ProtocolAnalysis.openPythonInterpreterDirectory()).toEqual({
        type: ProtocolAnalysis.OPEN_PYTHON_DIRECTORY,
        meta: { shell: true },
      })
    })

    it('can create a protocol-analysis:CHANGE_PYTHON_PATH_OVERRIDE action to change python path override', () => {
      expect(ProtocolAnalysis.changePythonPathOverrideConfig()).toEqual({
        type: ProtocolAnalysis.CHANGE_PYTHON_PATH_OVERRIDE,
        meta: { shell: true },
      })
    })
  })
})
