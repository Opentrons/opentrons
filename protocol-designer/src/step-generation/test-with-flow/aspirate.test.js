// @flow
import aspirate from '../aspirate'
import {getBasicRobotState} from './fixtures' // all8ChTipIds
const AIR = 'air' // TODO get from constants

describe('aspirate', () => {
  const initialRobotState = getBasicRobotState()
  const robotStateWithTip = {
    ...initialRobotState,
    tipState: {
      ...initialRobotState.tipState,
      pipettes: {
        ...initialRobotState.tipState.pipettes,
        p300SingleId: true,
        p300MultiId: true
      }
    }
  }

  test('aspirate with tip', () => {
    const result = aspirate({
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1'
    })(robotStateWithTip)

    expect(result.commands).toEqual([{
      command: 'aspirate',
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1'
    }])

    expect(result.robotState).toEqual(robotStateWithTip)
  })

  test('aspirate with volume > pipette max vol should throw error', () => {
    expect(() => aspirate({
      pipette: 'p300SingleId',
      volume: 10000,
      labware: 'sourcePlateId',
      well: 'A1'
    })(robotStateWithTip)).toThrow(/Attempted to aspirate volume greater than pipette max volume/)
  })

  test('aspirate with invalid pipette ID should throw error', () => {
    expect(() => aspirate({
      pipette: 'badPipette',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1'
    })(robotStateWithTip)).toThrow(/Attempted to aspirate with pipette id .* this pipette was not found/)
  })

  test('aspirate with no tip should throw error', () => {
    expect(() => aspirate({
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1'
    })(initialRobotState)).toThrow(/Attempted to aspirate with no tip on pipette/)
  })

  describe('liquid tracking:', () => {
    // TODO IMMEDIATELY factor up to fixtures
    const initialRobotWithIngred = {
      ...robotStateWithTip,
      liquidState: {
        ...robotStateWithTip.liquidState,
        labware: {
          ...robotStateWithTip.liquidState.labware,
          sourcePlateId: {
            A1: {ingred1: {volume: 300}},
            A2: {ingred1: {volume: 150}, ingred2: {volume: 150}}
          },
          destPlateId: {
            A1: {ingred1: {volume: 200}},
            B1: {ingred1: {volume: 150}},
            A6: {ingred1: {volume: 200}, ingred2: {volume: 100}},
            B6: {ingred1: {volume: 60}, ingred2: {volume: 70}}
          }
        }
      }
    }

    // Assertion for fixture
    if (initialRobotWithIngred.labware.destPlateId.type !== '96-flat') {
      throw new Error('This set of tests expects destPlateId to be "96-flat"')
    }

    if (initialRobotWithIngred.labware.sourcePlateId.type !== 'trough-12row') {
      throw new Error('This set of tests expects sourcePlateId to be "trough-12row"')
    }

    describe('...single-channel pipette', () => {
      test('aspirate from single-ingredient well', () => {
        const result = aspirate({
          pipette: 'p300SingleId',
          volume: 50,
          labware: 'destPlateId',
          well: 'A1'
        })(initialRobotWithIngred)

        expect(result.robotState.liquidState).toEqual({
          pipettes: {
            ...initialRobotWithIngred.liquidState.pipettes,
            p300SingleId: {
              '0': {ingred1: {volume: 50}}
            }
          },
          labware: {
            ...initialRobotWithIngred.liquidState.labware,
            destPlateId: {
              ...initialRobotWithIngred.liquidState.labware.destPlateId,
              A1: {ingred1: {volume: 150}}
            }
          }
        })
      })

      test('aspirate everything + air from a single-ingredient well', () => {
        const result = aspirate({
          pipette: 'p300SingleId',
          volume: 300,
          labware: 'destPlateId',
          well: 'A1'
        })(initialRobotWithIngred)

        expect(result.robotState.liquidState).toEqual({
          pipettes: {
            ...initialRobotWithIngred.liquidState.pipettes,
            p300SingleId: {
              '0': {ingred1: {volume: 200}, [AIR]: {volume: 100}}
            }
          },
          labware: {
            ...initialRobotWithIngred.liquidState.labware,
            destPlateId: {
              ...initialRobotWithIngred.liquidState.labware.destPlateId,
              A1: {ingred1: {volume: 0}}
            }
          }
        })
      })

      test('aspirate from two-ingredient well', () => {
        const result = aspirate({
          pipette: 'p300SingleId',
          volume: 60,
          labware: 'destPlateId',
          well: 'A6'
        })(initialRobotWithIngred)

        expect(result.robotState.liquidState).toEqual({
          pipettes: {
            ...initialRobotWithIngred.liquidState.pipettes,
            p300SingleId: {
              '0': {ingred1: {volume: 40}, ingred2: {volume: 20}}
            }
          },
          labware: {
            ...initialRobotWithIngred.liquidState.labware,
            destPlateId: {
              ...initialRobotWithIngred.liquidState.labware.destPlateId,
              A6: {ingred1: {volume: 200 - 40}, ingred2: {volume: 100 - 20}}
            }
          }
        })
      })

      test('aspirate everything + air from two-ingredient well', () => {
        const result = aspirate({
          pipette: 'p300SingleId',
          volume: 150,
          labware: 'destPlateId',
          well: 'B6'
        })(initialRobotWithIngred)

        expect(result.robotState.liquidState).toEqual({
          pipettes: {
            ...initialRobotWithIngred.liquidState.pipettes,
            p300SingleId: {
              '0': {ingred1: {volume: 60}, ingred2: {volume: 70}, [AIR]: {volume: 20}}
            }
          },
          labware: {
            ...initialRobotWithIngred.liquidState.labware,
            destPlateId: {
              ...initialRobotWithIngred.liquidState.labware.destPlateId,
              A6: {ingred1: {volume: 0}, ingred2: {volume: 0}}
            }
          }
        })
      })
    })

    describe('...8-channel pipette', () => {
      test('aspirate from single-ingredient set of wells (96-flat)', () => {
        const result = aspirate({
          pipette: 'p300MultiId',
          volume: 50,
          labware: 'destPlateId',
          well: 'A1'
        })(initialRobotWithIngred)

        expect(result.robotState.liquidState).toEqual({
          pipettes: {
            ...initialRobotWithIngred.liquidState.pipettes,
            p300MultiId: {
              '0': {ingred1: {volume: 50}},
              '1': {ingred1: {volume: 50}},
              ...(Array.from('234567').reduce((acc, tipId) =>
                ({...acc, [tipId]: {[AIR]: {volume: 50}}}), {})
              )
            }
          },
          labware: {
            ...initialRobotWithIngred.liquidState.labware,
            destPlateId: {
              ...initialRobotWithIngred.liquidState.labware.destPlateId,
              A1: {ingred1: {volume: 150}},
              B1: {ingred1: {volume: 100}}
            }
          }
        })
      })

      test('aspirate everything + air from single-ingredient wells (96-flat)', () => {
        const result = aspirate({
          pipette: 'p300MultiId',
          volume: 250,
          labware: 'destPlateId',
          well: 'A1'
        })(initialRobotWithIngred)

        expect(result.robotState.liquidState).toEqual({
          pipettes: {
            ...initialRobotWithIngred.liquidState.pipettes,
            p300MultiId: {
              ...(Array.from('234567').reduce((acc, tipId) =>
                ({...acc, [tipId]: {[AIR]: {volume: 250}}}), {})
              ),
              '0': {ingred1: {volume: 200}, [AIR]: {volume: 50}},
              '1': {ingred1: {volume: 150}, [AIR]: {volume: 100}}
            }
          },
          labware: {
            ...initialRobotWithIngred.liquidState.labware,
            destPlateId: {
              ...initialRobotWithIngred.liquidState.labware.destPlateId,
              A1: {ingred1: {volume: 0}},
              B1: {ingred1: {volume: 0}}
            }
          }
        })
      })

      test('aspirate from single-ingredient common well (trough-12row)', () => {
        const result = aspirate({
          pipette: 'p300MultiId',
          volume: 150,
          labware: 'sourcePlateId',
          well: 'A1'
        })(initialRobotWithIngred)

        expect(result.robotState.liquidState).toEqual({
          pipettes: {
            ...initialRobotWithIngred.liquidState.pipettes,
            p300MultiId: {
              ...(Array.from('01234567').reduce((acc, tipId) => ({
                ...acc,
                [tipId]: {ingred1: {volume: 150 / 8}} // aspirate volume divided among the 8 tips
              }), {}))
            }
          },
          labware: {
            ...initialRobotWithIngred.liquidState.labware,
            sourcePlateId: {
              ...initialRobotWithIngred.liquidState.labware.sourcePlateId,
              A1: {ingred1: {volume: 150}}
            }
          }
        })
      })
    })
  })
})
