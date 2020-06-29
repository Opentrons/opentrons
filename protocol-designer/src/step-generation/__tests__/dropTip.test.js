// @flow
import {
  DEFAULT_PIPETTE,
  FIXED_TRASH_ID,
  getSuccessResult,
  makeContext,
  makeState,
  makeStateArgsStandard,
} from '../__fixtures__'
import { dropTip } from '../commandCreators/atomic/dropTip'

describe('dropTip', () => {
  let invariantContext

  beforeEach(() => {
    invariantContext = makeContext()
  })

  // TODO Ian 2019-04-19: this is a ONE-OFF fixture
  function makeRobotState(args: {
    singleHasTips: boolean,
    multiHasTips: boolean,
  }) {
    const _robotState = makeState({
      ...makeStateArgsStandard(),
      invariantContext,
      tiprackSetting: { tiprack1Id: true },
    })
    _robotState.tipState.pipettes.p300SingleId = args.singleHasTips
    _robotState.tipState.pipettes.p300MultiId = args.multiHasTips
    return _robotState
  }

  describe('replaceTip: single channel', () => {
    it('drop tip if there is a tip', () => {
      const result = dropTip(
        { pipette: DEFAULT_PIPETTE },
        invariantContext,
        makeRobotState({ singleHasTips: true, multiHasTips: true })
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        {
          command: 'dropTip',
          params: {
            pipette: DEFAULT_PIPETTE,
            labware: FIXED_TRASH_ID,
            well: 'A1',
          },
        },
      ])
    })

    it('no tip on pipette, ignore dropTip', () => {
      const initialRobotState = makeRobotState({
        singleHasTips: false,
        multiHasTips: true,
      })
      const result = dropTip(
        { pipette: DEFAULT_PIPETTE },
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([])
    })
  })

  describe('Multi-channel dropTip', () => {
    it('drop tip if there is a tip', () => {
      const result = dropTip(
        { pipette: 'p300MultiId' },
        invariantContext,
        makeRobotState({ singleHasTips: true, multiHasTips: true })
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        {
          command: 'dropTip',
          params: {
            pipette: 'p300MultiId',
            labware: FIXED_TRASH_ID,
            well: 'A1',
          },
        },
      ])
    })

    it('no tip on pipette, ignore dropTip', () => {
      const initialRobotState = makeRobotState({
        singleHasTips: true,
        multiHasTips: false,
      })
      const result = dropTip(
        { pipette: 'p300MultiId' },
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([])
    })
  })
})
