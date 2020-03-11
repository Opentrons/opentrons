// strip 'procedure' from PD JSON protocol file and expect it to be output
// exactly the same, given everything else in the protocol file
import path from 'path'
// import { configureStore } from '../../configureStore'
// import { selectors as fileDataSelectors } from '../../file-data'
// import { actions as loadFileActions } from '../index'

jest.mock('../../labware-defs/utils')

function makeTestCaseFromFixture(fileName) {
  const fullFile = require(path.join(
    __dirname,
    './fixtures/throughMigrationV0',
    fileName
  ))
  const inputFile = { ...fullFile, procedure: [] }
  const expectedProcedure = fullFile.procedure
  return { inputFile, expectedProcedure }
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
    testName:
      'pre-flexible-step grandfathered do-it-all QA protocol (saved off 2b331961cb3629192d804224d8c10490d69838bd 2019-01-24)',
    ...makeTestCaseFromFixture('preFlexGrandfatheredProtocol.json'),
  },
]

// TODO(IL, 2020-02-28): restore these tests, maybe as e2e. See #5123
describe('snapshot integration test: JSON protocol fixture to procedures', () => {
  it.todo('TODO')
  fixtures.forEach(({ testName, inputFile, expectedProcedure }) => {
    // test.todo(testName, () => {
    //   const store = configureStore()
    //   store.dispatch(loadFileActions.loadFileAction(inputFile))
    //   const outputFile = fileDataSelectors.createFile(store.getState())
    //   expect(outputFile.procedure).toEqual(expectedProcedure)
    // })
  })
})
