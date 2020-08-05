// @flow
import * as Fixtures from '../__fixtures__'
import * as StatusFixtures from '../../__fixtures__'
import * as Selectors from '../selectors'
import { selectors as robotSelectors } from '../../../robot'

import wellPlate96Def from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'

import type { State } from '../../../types'
import type { Labware as ProtocolLabware } from '../../../robot/types'

jest.mock('../../../robot')

const robotName = 'robotName'

const getLabware: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getLabware, State>
> = robotSelectors.getLabware

const getModulesBySlot: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getModulesBySlot, State>
> = robotSelectors.getModulesBySlot

describe('labware calibration selectors', () => {
  describe('getLabwareCalibrations', () => {
    it('should return empty array if no robot in state', () => {
      const state: $Shape<State> = { calibration: {} }
      expect(Selectors.getLabwareCalibrations(state, robotName)).toEqual([])
    })

    it('should return empty array if robot in state but no calibrations yet', () => {
      const state: $Shape<State> = {
        calibration: {
          robotName: { calibrationStatus: null, labwareCalibrations: null },
        },
      }
      expect(Selectors.getLabwareCalibrations(state, robotName)).toEqual([])
    })

    it('should return list of calibrations if in state', () => {
      const state: $Shape<State> = {
        calibration: {
          robotName: {
            calibrationStatus: StatusFixtures.mockCalibrationStatus,
            labwareCalibrations: Fixtures.mockAllLabwareCalibraton,
          },
        },
      }
      expect(Selectors.getLabwareCalibrations(state, robotName)).toEqual(
        Fixtures.mockAllLabwareCalibraton.data
      )
    })
  })

  describe('getProtocolLabwareList', () => {
    let state: $Shape<State>

    beforeEach(() => {
      state = { calibration: {} }

      getLabware.mockImplementation(calledState => {
        expect(calledState).toBe(state)

        return [
          ({
            type: wellPlate96Def.parameters.loadName,
            definition: wellPlate96Def,
            slot: '3',
          }: $Shape<ProtocolLabware>),
          ({
            type: 'some_v1_labware',
            definition: null,
            slot: '1',
          }: $Shape<ProtocolLabware>),
        ]
      })

      getModulesBySlot.mockImplementation(calledState => {
        expect(calledState).toBe(state)

        return {
          '3': {
            model: 'magneticModuleV1',
            slot: '3',
            _id: 1945365648,
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
      const { attributes } = lwCalibration
      const { calibrationData } = attributes

      state = ({
        calibration: {
          robotName: {
            calibrationStatus: null,
            labwareCalibrations: {
              meta: {},
              data: [
                {
                  ...lwCalibration,
                  attributes: {
                    ...attributes,
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
                },
              ],
            },
          },
        },
      }: $Shape<State>)

      expect(
        Selectors.getUniqueProtocolLabwareSummaries(state, robotName)
      ).toEqual([
        {
          displayName: wellPlate96Def.metadata.displayName,
          parentDisplayName: null,
          quantity: 1,
          calibration: { x: 1.2, y: 4.6, z: 7.9 },
        },
        {
          displayName: 'some_v1_labware',
          parentDisplayName: null,
          quantity: 1,
          calibration: null,
        },
      ])
    })

    it('grabs calibration data for labware on module if present', () => {
      const lwCalibration = Fixtures.mockLabwareCalibration1
      const { attributes } = lwCalibration
      const { calibrationData } = attributes

      const calNotOnModule = {
        ...lwCalibration,
        attributes: {
          ...attributes,
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
        },
      }

      const calOnModule = {
        ...lwCalibration,
        attributes: {
          ...attributes,
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
        },
      }

      state = ({
        calibration: {
          robotName: {
            calibrationStatus: null,
            labwareCalibrations: {
              meta: {},
              data: [calNotOnModule, calOnModule],
            },
          },
        },
      }: $Shape<State>)

      expect(Selectors.getProtocolLabwareList(state, robotName)).toEqual([
        {
          type: wellPlate96Def.parameters.loadName,
          definition: wellPlate96Def,
          slot: '3',
          loadName: wellPlate96Def.parameters.loadName,
          namespace: wellPlate96Def.namespace,
          version: wellPlate96Def.version,
          parent: 'magneticModuleV1',
          calibration: { x: 1.2, y: 4.6, z: 7.9 },
        },
        {
          type: 'some_v1_labware',
          definition: null,
          slot: '1',
          loadName: 'some_v1_labware',
          namespace: null,
          version: null,
          parent: null,
          calibration: null,
        },
      ])
    })

    it('grabs calibration data for labware not on module if on-module cal data is present', () => {
      const lwCalibration = Fixtures.mockLabwareCalibration1
      const { attributes } = lwCalibration
      const { calibrationData } = attributes

      const calNotOnModule = {
        ...lwCalibration,
        attributes: {
          ...attributes,
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
        },
      }

      const calOnModule = {
        ...lwCalibration,
        attributes: {
          ...attributes,
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
        },
      }

      getModulesBySlot.mockReturnValue({})

      state = ({
        calibration: {
          robotName: {
            calibrationStatus: null,
            labwareCalibrations: {
              meta: {},
              data: [calOnModule, calNotOnModule],
            },
          },
        },
      }: $Shape<State>)

      expect(Selectors.getProtocolLabwareList(state, robotName)).toEqual([
        {
          type: wellPlate96Def.parameters.loadName,
          definition: wellPlate96Def,
          slot: '3',
          loadName: wellPlate96Def.parameters.loadName,
          namespace: wellPlate96Def.namespace,
          version: wellPlate96Def.version,
          parent: null,
          calibration: { x: 1.2, y: 4.6, z: 7.9 },
        },
        {
          type: 'some_v1_labware',
          definition: null,
          slot: '1',
          loadName: 'some_v1_labware',
          namespace: null,
          version: null,
          parent: null,
          calibration: null,
        },
      ])
    })
  })

  describe('getUniqueProtocolLabwareSummaries', () => {
    let state: $Shape<State>

    beforeEach(() => {
      state = { calibration: {} }

      getLabware.mockImplementation(calledState => {
        expect(calledState).toBe(state)

        return [
          ({
            type: wellPlate96Def.parameters.loadName,
            definition: wellPlate96Def,
            slot: '3',
          }: $Shape<ProtocolLabware>),
          ({
            type: 'some_v1_labware',
            definition: null,
            slot: '1',
          }: $Shape<ProtocolLabware>),
        ]
      })

      getModulesBySlot.mockImplementation(calledState => {
        expect(calledState).toBe(state)

        return {
          '3': {
            model: 'magneticModuleV1',
            slot: '3',
            _id: 1945365648,
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
        },
        {
          displayName: 'some_v1_labware',
          parentDisplayName: null,
          quantity: 1,
          calibration: null,
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
        },
        {
          displayName: 'some_v1_labware',
          parentDisplayName: null,
          quantity: 1,
          calibration: null,
        },
      ])
    })

    it('flattens out duplicate labware using quantity field', () => {
      getLabware.mockReturnValue([
        ({
          type: wellPlate96Def.parameters.loadName,
          definition: wellPlate96Def,
          slot: '3',
        }: $Shape<ProtocolLabware>),
        ({
          type: wellPlate96Def.parameters.loadName,
          definition: wellPlate96Def,
          slot: '3',
        }: $Shape<ProtocolLabware>),
      ])
      getModulesBySlot.mockReturnValue({})

      expect(
        Selectors.getUniqueProtocolLabwareSummaries(state, robotName)
      ).toEqual([
        {
          displayName: wellPlate96Def.metadata.displayName,
          parentDisplayName: null,
          quantity: 2,
          calibration: null,
        },
      ])
    })

    it('does not aggregate labware across differing parents', () => {
      getLabware.mockReturnValue([
        ({
          type: wellPlate96Def.parameters.loadName,
          definition: wellPlate96Def,
          slot: '2',
        }: $Shape<ProtocolLabware>),
        ({
          type: wellPlate96Def.parameters.loadName,
          definition: wellPlate96Def,
          slot: '3',
        }: $Shape<ProtocolLabware>),
      ])

      getModulesBySlot.mockImplementation(calledState => {
        return {
          '3': {
            model: 'magneticModuleV1',
            slot: '3',
            _id: 1945365648,
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
        },
        {
          displayName: wellPlate96Def.metadata.displayName,
          parentDisplayName: 'Magnetic Module GEN1',
          quantity: 1,
          calibration: null,
        },
      ])
    })
  })
})
