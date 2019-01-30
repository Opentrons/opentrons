// strip 'procedure' from PD JSON protocol file and expect it to be output
// exactly the same, given everything else in the protocol file
import path from 'path'
import configureStore from '../configureStore'
import {selectors as fileDataSelectors} from '../file-data'

function makeTestCaseFromFixture (fileName) {
  const fullFile = require(path.join(__dirname, './fixtures', fileName))
  const inputFile = {...fullFile, procedure: []}
  const expectedProcedure = fullFile.procedure
  return {inputFile, expectedProcedure}
}

const fixtures = [
  {
    testName: 'empty case: {}',
    inputFile: {},
    expectedProcedure: [],
  },
  {
    testName: 'minimal case: single pre-flexible-step transfer',
    ...makeTestCaseFromFixture('minimalProtocolOldTransfer.json'),
  },
  {
    testName: 'pre-flexible-step grandfathered do-it-all QA protocol (saved off 2b331961cb3629192d804224d8c10490d69838bd 2019-01-24)',
    ...makeTestCaseFromFixture('preFlexGrandfatheredProtocol.json'),
  },
]

// TODO #2917: restore these tests
describe.skip('snapshot integration test: JSON protocol fixture to procedures', () => {
  fixtures.forEach(({testName, inputFile, expectedProcedure}) => {
    test(testName, () => {
      const store = configureStore()
      store.dispatch({type: 'LOAD_FILE', payload: inputFile})
      const outputFile = fileDataSelectors.createFile(store.getState())
      expect(outputFile.procedure).toEqual(expectedProcedure)
    })
  })
})
