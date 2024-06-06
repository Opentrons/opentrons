import { it, describe } from 'vitest'
// TODO IMMEDIATELY: mock step-generation fns:
// consolidate,
// distribute,
// transfer,
// mix,
// curryCommandCreator,
// getWellsForTips,
// TODO IMMEDIATELY: way to do this using mocks? Or just don't integration test this, too brittle
// exampleDescribe('transferLikeSubsteps integration tests', () => {
//   const testCases = [
//     { testName: '', input: {}, expected: [] }
//   ]
//   testCases.forEach(({ testName, input, expected }) =>
//     exampleTest(testName, () => {
//       expect(foo).toEqual(expected)
//     })
//   )
// })
describe('substep timeline', () => {
  describe('substepTimelineSingleChannel', () => {
    it.todo('returns empty array if initial timeline frame has errors')
  })
  describe('substepTimelineMultiChannel', () => {
    it.todo('returns empty array if initial timeline frame has errors')
  })
  describe('_getNewActiveTips', () => {
    it.todo('gets params of last pickUpTip command in an array of commands')
    it.todo('returns null when there were no pickUpTip commands')
  })
})
