import omit from 'lodash/omit'
import * as Fixtures from '../__fixtures__'
import * as StatusFixtures from '../../__fixtures__'
import * as Selectors from '../selectors'
import { selectors as robotSelectors } from '../../../robot'

import wellPlate96Def from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'

import type { State } from '../../../types'
import type { Labware as ProtocolLabware } from '../../../robot/types'

jest.mock('../../../robot')

const robotName = 'robotName'

const getLabware = robotSelectors.getLabware as jest.MockedFunction<
  typeof robotSelectors.getLabware
>
const getModulesBySlot = robotSelectors.getModulesBySlot as jest.MockedFunction<
  typeof robotSelectors.getModulesBySlot
>

describe('labware calibration selectors', () => {
  describe('getLabwareCalibrations', () => {
    it('should return empty array if no robot in state', () => {
      const state: State = { calibration: {} } as any
      expect(Selectors.getLabwareCalibrations(state, robotName)).toEqual([])
    })

    it('should return empty array if robot in state but no calibrations yet', () => {
      const state: State = {
        calibration: {
          robotName: {
            calibrationStatus: null,
            labwareCalibrations: null,
            pipetteOffsetCalibrations: null,
            tipLengthCalibrations: null,
          },
        },
      } as any
      expect(Selectors.getLabwareCalibrations(state, robotName)).toEqual([])
    })

    it('should return list of calibrations if in state', () => {
      const state: State = {
        calibration: {
          robotName: {
            calibrationStatus: StatusFixtures.mockCalibrationStatus,
            labwareCalibrations: Fixtures.mockAllLabwareCalibration,
            pipetteOffsetCalibrations: null,
            tipLengthCalibrations: null,
          },
        },
      } as any
      expect(Selectors.getLabwareCalibrations(state, robotName)).toEqual(
        Fixtures.mockAllLabwareCalibration.data
      )
    })
  })

  describe('getProtocolLabwareList', () => {
    let state: State

    afterEach(() => {
      jest.resetAllMocks()
    })

    beforeEach(() => {
      state = { calibration: {} } as any

      getLabware.mockImplementation(calledState => {
        expect(calledState).toBe(state)

        return [
          {
            type: wellPlate96Def.parameters.loadName,
            definition: wellPlate96Def,
            slot: '3',
            definitionHash: Fixtures.mockLabwareCalibration1.definitionHash,
          } as any,
          {
            type: 'some_v1_labware',
            definition: null,
            slot: '1',
            definitionHash: null,
          } as any,
        ] as ProtocolLabware[]
      })

      getModulesBySlot.mockImplementation(calledState => {
        expect(calledState).toBe(state)

        return {
          '3': {
            model: 'magneticModuleV1',
            slot: '3',
            _id: 1945365648,
            protocolLoadOrder: 0,
          },
        }
      })
    })

    it('returns empty array if no labware in protocol', () => {
      getLabware.mockReturnValue([])
      expect(
        Selectors.getUniqueProtocolLabwareSummaries(state, robotName)
      ).toEqual([])
    })

    it('grabs calibration data for labware if present, rounding to 1 decimal', () => {
      getModulesBySlot.mockReturnValue({})

      const lwCalibration = Fixtures.mockLabwareCalibration1
      const { calibrationData } = lwCalibration

      state = {
        calibration: {
          robotName: {
            calibrationStatus: null,
            pipetteOffsetCalibrations: null,
            tipLengthCalibrations: null,
            labwareCalibrations: {
              data: [
                {
                  ...lwCalibration,
                  loadName: wellPlate96Def.parameters.loadName,
                  namespace: wellPlate96Def.namespace,
                  version: wellPlate96Def.version,
                  parent: '',
                  calibrationData: {
                    ...calibrationData,
                    offset: {
                      ...calibrationData.offset,
                      value: [1.23, 4.56, 7.89],
                    },
                  },
                },
              ],
            },
          },
        },
      } as any

      expect(
        Selectors.getUniqueProtocolLabwareSummaries(state, robotName)
      ).toEqual([
        {
          displayName: wellPlate96Def.metadata.displayName,
          parentDisplayName: null,
          quantity: 1,
          calibration: { x: 1.2, y: 4.6, z: 7.9 },
          calDataAvailable: true,
        },
        {
          displayName: 'some_v1_labware',
          parentDisplayName: null,
          quantity: 1,
          calibration: null,
          calDataAvailable: false,
        },
      ])
    })

    it('grabs calibration data for labware on module if present', () => {
      const lwCalibration = Fixtures.mockLabwareCalibration1
      const { calibrationData } = lwCalibration

      const calNotOnModule = {
        ...lwCalibration,
        parent: '',
        loadName: wellPlate96Def.parameters.loadName,
        namespace: wellPlate96Def.namespace,
        version: wellPlate96Def.version,
        calibrationData: {
          ...calibrationData,
          offset: {
            ...calibrationData.offset,
            value: [0, 0, 0],
          },
        },
      }

      const calOnModule = {
        ...lwCalibration,
        parent: 'magneticModuleV1',
        loadName: wellPlate96Def.parameters.loadName,
        namespace: wellPlate96Def.namespace,
        version: wellPlate96Def.version,
        calibrationData: {
          ...calibrationData,
          offset: {
            ...calibrationData.offset,
            value: [1.23, 4.56, 7.89],
          },
        },
      }

      state = {
        calibration: {
          robotName: {
            calibrationStatus: null,
            pipetteOffsetCalibrations: null,
            tipLengthCalibrations: null,
            labwareCalibrations: {
              data: [calNotOnModule, calOnModule],
            },
          },
        },
      } as any

      expect(Selectors.getProtocolLabwareList(state, robotName)).toEqual([
        {
          type: wellPlate96Def.parameters.loadName,
          definition: wellPlate96Def,
          slot: '3',
          loadName: wellPlate96Def.parameters.loadName,
          namespace: wellPlate96Def.namespace,
          version: wellPlate96Def.version,
          parent: 'magneticModuleV1',
          calibrationData: { x: 1.2, y: 4.6, z: 7.9 },
          definitionHash: lwCalibration.definitionHash,
        },
        {
          type: 'some_v1_labware',
          definition: null,
          slot: '1',
          loadName: 'some_v1_labware',
          namespace: null,
          version: null,
          parent: null,
          calibrationData: null,
          definitionHash: null,
        },
      ])
    })

    it('grabs calibration data for labware not on module even if on-module cal data is also present', () => {
      const lwCalibration = Fixtures.mockLabwareCalibration1
      const { calibrationData } = lwCalibration

      const calNotOnModule = {
        ...lwCalibration,
        parent: '',
        loadName: wellPlate96Def.parameters.loadName,
        namespace: wellPlate96Def.namespace,
        version: wellPlate96Def.version,
        calibrationData: {
          ...calibrationData,
          offset: {
            ...calibrationData.offset,
            value: [1.23, 4.56, 7.89],
          },
        },
      }

      const calOnModule = {
        ...lwCalibration,
        parent: 'magneticModuleV1',
        loadName: wellPlate96Def.parameters.loadName,
        namespace: wellPlate96Def.namespace,
        version: wellPlate96Def.version,
        calibrationData: {
          ...calibrationData,
          offset: {
            ...calibrationData.offset,
            value: [0, 0, 0],
          },
        },
      }

      getModulesBySlot.mockReturnValue({})

      state = {
        calibration: {
          robotName: {
            calibrationStatus: null,
            pipetteOffsetCalibrations: null,
            tipLengthCalibrations: null,
            labwareCalibrations: {
              data: [calOnModule, calNotOnModule],
            },
          },
        },
      } as any

      expect(Selectors.getProtocolLabwareList(state, robotName)).toEqual([
        {
          type: wellPlate96Def.parameters.loadName,
          definition: wellPlate96Def,
          slot: '3',
          loadName: wellPlate96Def.parameters.loadName,
          namespace: wellPlate96Def.namespace,
          version: wellPlate96Def.version,
          parent: null,
          definitionHash: lwCalibration.definitionHash,
          calibrationData: { x: 1.2, y: 4.6, z: 7.9 },
        },
        {
          type: 'some_v1_labware',
          definition: null,
          slot: '1',
          loadName: 'some_v1_labware',
          namespace: null,
          version: null,
          parent: null,
          definitionHash: null,
          calibrationData: null,
        },
      ])
    })

    it('grabs no calibration data for labware if definitionHash not present', () => {
      const lwCalibration = Fixtures.mockLabwareCalibration1
      const { calibrationData } = lwCalibration

      const oldLwCal = {
        ...omit(lwCalibration, 'definitionHash'),
        parent: '',
        loadName: wellPlate96Def.parameters.loadName,
        namespace: wellPlate96Def.namespace,
        version: wellPlate96Def.version,
        calibrationData: {
          ...calibrationData,
          offset: {
            ...calibrationData.offset,
            value: [1.23, 4.56, 7.89],
          },
        },
      }

      getModulesBySlot.mockReturnValue({})

      state = {
        calibration: {
          robotName: {
            calibrationStatus: null,
            pipetteOffsetCalibrations: null,
            tipLengthCalibrations: null,
            labwareCalibrations: {
              data: [oldLwCal],
            },
          },
        },
      } as any

      expect(Selectors.getProtocolLabwareList(state, robotName)).toEqual([
        {
          // No calibrationData
          type: wellPlate96Def.parameters.loadName,
          definition: wellPlate96Def,
          slot: '3',
          loadName: wellPlate96Def.parameters.loadName,
          namespace: wellPlate96Def.namespace,
          version: wellPlate96Def.version,
          parent: null,
          definitionHash: lwCalibration.definitionHash,
          calibrationData: null,
        },
        {
          type: 'some_v1_labware',
          definition: null,
          slot: '1',
          loadName: 'some_v1_labware',
          namespace: null,
          version: null,
          parent: null,
          definitionHash: null,
          calibrationData: null,
        },
      ])
    })
  })

  describe('getUniqueProtocolLabwareSummaries', () => {
    let state: State

    beforeEach(() => {
      state = { calibration: {} } as any

      getLabware.mockImplementation(calledState => {
        expect(calledState).toBe(state)

        return [
          {
            type: wellPlate96Def.parameters.loadName,
            definition: wellPlate96Def,
            slot: '3',
            definitionHash: Fixtures.mockLabwareCalibration1.definitionHash,
          } as any,
          {
            type: 'some_v1_labware',
            definition: null,
            slot: '1',
          } as any,
        ] as ProtocolLabware[]
      })

      getModulesBySlot.mockImplementation(calledState => {
        expect(calledState).toBe(state)

        return {
          '3': {
            model: 'magneticModuleV1',
            slot: '3',
            _id: 1945365648,
            protocolLoadOrder: 0,
          },
        }
      })
    })

    it('returns empty array if no labware in protocol', () => {
      getLabware.mockReturnValue([])
      expect(
        Selectors.getUniqueProtocolLabwareSummaries(state, robotName)
      ).toEqual([])
    })

    it('maps RPC labware to object with displayName', () => {
      getModulesBySlot.mockReturnValue({})

      expect(
        Selectors.getUniqueProtocolLabwareSummaries(state, robotName)
      ).toEqual([
        {
          displayName: wellPlate96Def.metadata.displayName,
          parentDisplayName: null,
          quantity: 1,
          calibration: null,
          calDataAvailable: true,
        },
        {
          displayName: 'some_v1_labware',
          parentDisplayName: null,
          quantity: 1,
          calibration: null,
          calDataAvailable: true,
        },
      ])
    })

    it('sets parentDisplayName if labware has module parent', () => {
      expect(
        Selectors.getUniqueProtocolLabwareSummaries(state, robotName)
      ).toEqual([
        {
          displayName: wellPlate96Def.metadata.displayName,
          parentDisplayName: 'Magnetic Module GEN1',
          quantity: 1,
          calibration: null,
          calDataAvailable: true,
        },
        {
          displayName: 'some_v1_labware',
          parentDisplayName: null,
          quantity: 1,
          calibration: null,
          calDataAvailable: true,
        },
      ])
    })

    it('flattens out duplicate labware using quantity field', () => {
      getLabware.mockReturnValue([
        {
          type: wellPlate96Def.parameters.loadName,
          definition: wellPlate96Def,
          definitionHash: '123fakeDefinitionHash',
          slot: '3',
        } as any,
        {
          type: wellPlate96Def.parameters.loadName,
          definition: wellPlate96Def,
          definitionHash: '123fakeDefinitionHash',
          slot: '4',
        } as any,
      ] as ProtocolLabware[])
      getModulesBySlot.mockReturnValue({})

      expect(
        Selectors.getUniqueProtocolLabwareSummaries(state, robotName)
      ).toEqual([
        {
          displayName: wellPlate96Def.metadata.displayName,
          parentDisplayName: null,
          quantity: 2,
          calibration: null,
          calDataAvailable: true,
        },
      ])
    })

    it('does not aggregate labware across differing parents', () => {
      getLabware.mockReturnValue([
        {
          type: wellPlate96Def.parameters.loadName,
          definition: wellPlate96Def,
          definitionHash: '123fakeDefinitionHash',
          slot: '2',
        } as any,
        {
          type: wellPlate96Def.parameters.loadName,
          definition: wellPlate96Def,
          definitionHash: '123fakeDefinitionHash',
          slot: '3',
        } as any,
      ] as ProtocolLabware[])

      getModulesBySlot.mockImplementation(calledState => {
        return {
          '3': {
            model: 'magneticModuleV1',
            slot: '3',
            _id: 1945365648,
            protocolLoadOrder: 0,
          },
        }
      })

      expect(
        Selectors.getUniqueProtocolLabwareSummaries(state, robotName)
      ).toEqual([
        {
          displayName: wellPlate96Def.metadata.displayName,
          parentDisplayName: null,
          quantity: 1,
          calibration: null,
          calDataAvailable: true,
        },
        {
          displayName: wellPlate96Def.metadata.displayName,
          parentDisplayName: 'Magnetic Module GEN1',
          quantity: 1,
          calibration: null,
          calDataAvailable: true,
        },
      ])
    })
  })
})
