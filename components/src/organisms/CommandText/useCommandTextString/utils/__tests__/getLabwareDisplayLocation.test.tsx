import { useTranslation } from 'react-i18next'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  FLEX_ROBOT_TYPE,
  getLabwareDefURI,
  getLabwareDisplayName,
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
} from '@opentrons/shared-data'

import { i18n } from '../../../../../i18n'
import { renderWithProviders } from '../../../../../testing/utils'
import { getLabwareDisplayLocation } from '../getLabwareDisplayLocation'
import { getModuleDisplayLocation } from '../getModuleDisplayLocation'
import { getModuleModel } from '../getModuleModel'

import type { ComponentProps } from 'react'
import type {
  LabwareLocation,
  LabwareLocationSequence,
} from '@opentrons/shared-data'

vi.mock('../getModuleModel')
vi.mock('../getModuleDisplayLocation')
vi.mock('@opentrons/shared-data', async () => {
  const actual = await vi.importActual('@opentrons/shared-data')
  return {
    ...actual,
    getModuleDisplayName: vi.fn(),
    getModuleType: vi.fn(),
    getOccludedSlotCountForModule: vi.fn(),
    getLabwareDefURI: vi.fn(),
    getLabwareDisplayName: vi.fn(),
  }
})

const TestWrapper = ({
  location,
  params,
}: {
  location: LabwareLocation | LabwareLocationSequence | null
  params: any
}) => {
  const { t } = useTranslation('protocol_command_text')
  const displayLocation = getLabwareDisplayLocation({ ...params, location, t })
  return <div>{displayLocation}</div>
}

const render = (props: ComponentProps<typeof TestWrapper>) => {
  return renderWithProviders(<TestWrapper {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('getLabwareDisplayLocation with translations', () => {
  const defaultParams = {
    loadedLabwares: [],
    loadedModules: [],
    robotType: FLEX_ROBOT_TYPE,
    allRunDefs: [],
  }
  const detailLevels = ['full', 'slot-only']

  describe('for LabwareLocation type', () => {
    it('should return an empty string for null location', () => {
      render({
        location: null,
        params: defaultParams,
      })
      expect(screen.queryByText(/.+/)).toBeNull()
    })

    it('should return "off deck" for offDeck location', () => {
      render({
        location: 'offDeck',
        params: defaultParams,
      })
      screen.getByText('off deck')
    })

    it('should return a slot name for slot location', () => {
      render({
        location: { slotName: 'A1' },
        params: defaultParams,
      })
      screen.getByText('Slot A1')
    })

    it('should return an addressable area name for an addressable area location', () => {
      render({
        location: { addressableAreaName: 'B2' },
        params: defaultParams,
      })
      screen.getByText('Slot B2')
    })

    it('should special case the slotName if it contains "waste chute"', () => {
      render({
        location: { slotName: 'gripperWasteChute' },
        params: defaultParams,
      })
      screen.getByText('Waste Chute')
    })

    it('should special case the slotName if it contains "trash bin"', () => {
      render({
        location: { slotName: 'trashBin' },
        params: defaultParams,
      })
      screen.getByText('Trash Bin')
    })

    describe('module location', () => {
      detailLevels.forEach(detailLevel => {
        it(`should return a module location for a module location with detailLevel "${detailLevel}"`, () => {
          const mockModuleModel = 'temperatureModuleV2'
          vi.mocked(getModuleModel).mockReturnValue(mockModuleModel)
          vi.mocked(getModuleDisplayLocation).mockReturnValue('3')
          vi.mocked(getModuleDisplayName).mockReturnValue('Temperature Module')
          vi.mocked(getModuleType).mockReturnValue('temperatureModuleType')
          vi.mocked(getOccludedSlotCountForModule).mockReturnValue(1)

          render({
            location: { moduleId: 'temp123' },
            params: { ...defaultParams, detailLevel },
          })

          if (detailLevel === 'full') {
            screen.getByText('Temperature Module in Slot 3')
          } else {
            screen.getByText('Slot 3')
          }
        })
      })
    })

    describe('adapter location', () => {
      detailLevels.forEach(detailLevel => {
        it(`should return an adapter location for an adapter location with detailLevel "${detailLevel}"`, () => {
          const mockLoadedLabwares = [
            {
              id: 'adapter123',
              definitionUri: 'adapter-uri',
              location: { slotName: 'D1' },
            },
          ]
          const mockAllRunDefs = [
            { uri: 'adapter-uri', metadata: { displayName: 'Mock Adapter' } },
          ]
          vi.mocked(getLabwareDefURI).mockReturnValue('adapter-uri')
          vi.mocked(getLabwareDisplayName).mockReturnValue('Mock Adapter')

          render({
            location: { labwareId: 'adapter123' },
            params: {
              ...defaultParams,
              loadedLabwares: mockLoadedLabwares,
              allRunDefs: mockAllRunDefs,
              detailLevel,
            },
          })

          if (detailLevel === 'full') {
            screen.getByText('Mock Adapter in Slot D1')
          } else {
            screen.getByText('Slot D1')
          }
        })
      })
    })

    describe('adapter on module location', () => {
      detailLevels.forEach(detailLevel => {
        it(`should handle an adapter on module location with detailLevel "${detailLevel}"`, () => {
          const mockLoadedLabwares = [
            {
              id: 'adapter123',
              definitionUri: 'adapter-uri',
              location: { moduleId: 'temp123' },
            },
          ]
          const mockLoadedModules = [
            { id: 'temp123', model: 'temperatureModuleV2' },
          ]
          const mockAllRunDefs = [
            { uri: 'adapter-uri', metadata: { displayName: 'Mock Adapter' } },
          ]

          vi.mocked(getLabwareDefURI).mockReturnValue('adapter-uri')
          vi.mocked(getModuleModel).mockReturnValue('temperatureModuleV2')
          vi.mocked(getLabwareDisplayName).mockReturnValue('Mock Adapter')
          vi.mocked(getModuleDisplayLocation).mockReturnValue('2')
          vi.mocked(getModuleDisplayName).mockReturnValue('Temperature Module')
          vi.mocked(getModuleType).mockReturnValue('temperatureModuleType')
          vi.mocked(getOccludedSlotCountForModule).mockReturnValue(1)

          render({
            location: { labwareId: 'adapter123' },
            params: {
              ...defaultParams,
              loadedLabwares: mockLoadedLabwares,
              loadedModules: mockLoadedModules,
              allRunDefs: mockAllRunDefs,
              detailLevel,
            },
          })

          if (detailLevel === 'full') {
            screen.getByText('Mock Adapter on Temperature Module in Slot 2')
          } else {
            screen.getByText('Slot 2')
          }
        })
      })
    })
  })

  describe('for LabwareLocationSequence type', () => {
    describe('single sequence component tests', () => {
      it('should handle onAddressableArea sequence', () => {
        const locationSequence: LabwareLocationSequence = [
          { kind: 'onAddressableArea', addressableAreaName: 'A1' },
          {
            kind: 'onCutoutFixture',
            cutoutId: 'cutoutA1',
            possibleCutoutFixtureIds: ['singleLeftSlot'],
          },
        ]
        render({
          location: locationSequence,
          params: defaultParams,
        })
        screen.getByText('Slot A1')
      })

      it('should handle notOnDeck sequence', () => {
        const locationSequence: LabwareLocationSequence = [
          { kind: 'notOnDeck', logicalLocationName: 'offDeck' },
        ]
        render({
          location: locationSequence,
          params: defaultParams,
        })
        screen.getByText('off deck')
      })

      describe('labware on a module', () => {
        detailLevels.forEach(detailLevel => {
          it(`should handle onModule sequence with detailLevel "${detailLevel}"`, () => {
            const locationSequence: LabwareLocationSequence = [
              {
                kind: 'onAddressableArea',
                addressableAreaName: 'thermocyclerModuleV2',
              },
              { kind: 'onModule', moduleId: 'mockModuleId' },
              {
                kind: 'onCutoutFixture',
                cutoutId: 'cutoutId',
                possibleCutoutFixtureIds: ['thermocyclerModuleV2Front'],
              },
            ]

            vi.mocked(getModuleModel).mockReturnValue('thermocyclerModuleV2')
            vi.mocked(getModuleDisplayLocation).mockReturnValue('B1')
            vi.mocked(getModuleDisplayName).mockReturnValue(
              'Thermocycler Module'
            )
            vi.mocked(getModuleType).mockReturnValue('thermocyclerModuleType')

            render({
              location: locationSequence,
              params: { ...defaultParams, detailLevel },
            })

            if (detailLevel === 'full') {
              screen.getByText('Thermocycler Module in Slot A1+B1')
            } else {
              screen.getByText('Slot A1+B1')
            }
          })
        })

        detailLevels.forEach(detailLevel => {
          it(`should handle labware on a stacker module with detailLevel "${detailLevel}"`, () => {
            const locationSequence: LabwareLocationSequence = [
              {
                kind: 'onAddressableArea',
                addressableAreaName: 'flexStackerModuleV1D4',
              },
              { kind: 'onModule', moduleId: 'mockModuleId' },
              {
                kind: 'onCutoutFixture',
                cutoutId: 'cutoutD3',
                possibleCutoutFixtureIds: [
                  'flexStackerModuleV1WithWasteChuteRightAdapterNoCover',
                ],
              },
            ]
            vi.mocked(getModuleModel).mockReturnValue('flexStackerModuleV1')
            vi.mocked(getModuleDisplayLocation).mockReturnValue('D3')
            vi.mocked(getModuleDisplayName).mockReturnValue('Flex Stacker')
            vi.mocked(getModuleType).mockReturnValue('flexStackerModuleType')

            render({
              location: locationSequence,
              params: { ...defaultParams, detailLevel },
            })

            screen.getByText('Slot D4')
          })
        })

        detailLevels.forEach(detailLevel => {
          it(`should handle labware in stacker hopper with detailLevel "${detailLevel}"`, () => {
            const locationSequence: LabwareLocationSequence = [
              { kind: 'inStackerHopper', moduleId: 'UUID' },
            ]

            vi.mocked(getModuleModel).mockReturnValue('flexStackerModuleV1')
            vi.mocked(getModuleDisplayLocation).mockReturnValue('D3')
            vi.mocked(getModuleDisplayName).mockReturnValue('Flex Stacker')
            vi.mocked(getModuleType).mockReturnValue('flexStackerModuleType')

            render({
              location: locationSequence,
              params: { ...defaultParams, detailLevel },
            })

            screen.getByText('Stacker D')
          })
        })
      })

      describe('labware on another labware', () => {
        detailLevels.forEach(detailLevel => {
          it(`should handle onLabware sequence with detailLevel "${detailLevel}"`, () => {
            const locationSequence: LabwareLocationSequence = [
              { kind: 'onLabware', labwareId: 'labwareABC', lidId: null },
              { kind: 'onAddressableArea', addressableAreaName: 'A3' },
              {
                kind: 'onCutoutFixture',
                cutoutId: 'cutoutA3',
                possibleCutoutFixtureIds: [
                  'flexStackerModuleV1',
                  'singleRightSlot',
                ],
              },
            ]
            const mockLoadedLabwares = [
              {
                id: 'labwareABC',
                definitionUri: 'labware-uri',
                location: { slotName: 'A3' },
              },
            ]
            const mockAllRunDefs = [
              { uri: 'labware-uri', metadata: { displayName: 'Mock Labware' } },
            ]

            vi.mocked(getLabwareDefURI).mockReturnValue('labware-uri')
            vi.mocked(getLabwareDisplayName).mockReturnValue('Mock Labware')

            render({
              location: locationSequence,
              params: {
                ...defaultParams,
                detailLevel,
                loadedLabwares: mockLoadedLabwares,
                allRunDefs: mockAllRunDefs,
              },
            })

            if (detailLevel === 'full') {
              screen.getByText('Mock Labware in Slot A3')
            } else {
              screen.getByText('Slot A3')
            }
          })
        })
      })
    })

    describe('complex sequence component tests', () => {
      describe('labware on module sequence', () => {
        detailLevels.forEach(detailLevel => {
          it(`should handle labware on module sequence with detailLevel "${detailLevel}"`, () => {
            const locationSequence: LabwareLocationSequence = [
              { kind: 'onLabware', labwareId: 'adapter1234', lidId: null },
              {
                addressableAreaName: 'temperatureModuleV2C1',
                kind: 'onAddressableArea',
              },
              { kind: 'onModule', moduleId: 'temp123' },
              {
                cutoutId: 'cutoutC1',
                kind: 'onCutoutFixture',
                possibleCutoutFixtureIds: ['temperatureModuleV2'],
              },
            ]

            const mockLoadedLabwares = [
              {
                id: 'adapter1234',
                definitionUri: 'adapter-uri',
                location: { moduleId: 'temp123' },
              },
            ]
            const mockLoadedModules = [
              { id: 'temp123', model: 'temperatureModuleV2' },
            ]
            const mockAllRunDefs = [
              { uri: 'adapter-uri', metadata: { displayName: 'Mock Adapter' } },
            ]

            vi.mocked(getLabwareDefURI).mockReturnValue('adapter-uri')
            vi.mocked(getLabwareDisplayName).mockReturnValue('Mock Adapter')
            vi.mocked(getModuleModel).mockReturnValue('temperatureModuleV2')
            vi.mocked(getModuleDisplayLocation).mockReturnValue('C1')
            vi.mocked(getModuleDisplayName).mockReturnValue(
              'Temperature Module'
            )
            vi.mocked(getModuleType).mockReturnValue('temperatureModuleType')
            vi.mocked(getOccludedSlotCountForModule).mockReturnValue(1)

            render({
              location: locationSequence,
              params: {
                ...defaultParams,
                detailLevel,
                loadedLabwares: mockLoadedLabwares,
                loadedModules: mockLoadedModules,
                allRunDefs: mockAllRunDefs,
              },
            })

            if (detailLevel === 'full') {
              screen.getByText('Mock Adapter on Temperature Module in Slot C1')
            } else {
              screen.getByText('Slot C1')
            }
          })
        })
      })

      it('should only display the top labware in multiple labware stacking sequence', () => {
        const locationSequence: LabwareLocationSequence = [
          { kind: 'onLabware', labwareId: 'topLabware', lidId: null },
          { kind: 'onLabware', labwareId: 'adapter123', lidId: null },
          { kind: 'onAddressableArea', addressableAreaName: 'A3' },
          {
            kind: 'onCutoutFixture',
            cutoutId: 'cutoutA3',
            possibleCutoutFixtureIds: [
              'flexStackerModuleV1',
              'singleRightSlot',
            ],
          },
        ]

        const mockLoadedLabwares = [
          {
            id: 'topLabware',
            definitionUri: 'top-labware-uri',
            location: { labwareId: 'adapter123' },
          },
          {
            id: 'adapter123',
            definitionUri: 'adapter-uri',
            location: { slotName: 'A3' },
          },
        ]
        const mockAllRunDefs = [
          { uri: 'top-labware-uri', metadata: { displayName: 'Top Labware' } },
          { uri: 'adapter-uri', metadata: { displayName: 'Mock Adapter' } },
        ]

        vi.mocked(getLabwareDefURI)
          .mockReturnValueOnce('top-labware-uri')
          .mockReturnValueOnce('adapter-uri')
        vi.mocked(getLabwareDisplayName)
          .mockReturnValueOnce('Top Labware')
          .mockReturnValueOnce('Mock Adapter')

        render({
          location: locationSequence,
          params: {
            ...defaultParams,
            detailLevel: 'full',
            loadedLabwares: mockLoadedLabwares,
            allRunDefs: mockAllRunDefs,
          },
        })

        screen.getByText('Top Labware in Slot A3')
      })

      it('should handle waste chute sequence', () => {
        const locationSequence: LabwareLocationSequence = [
          {
            addressableAreaName: 'gripperWasteChute',
            kind: 'onAddressableArea',
          },
          {
            cutoutId: 'cutoutD3',
            kind: 'onCutoutFixture',
            possibleCutoutFixtureIds: [
              'stagingAreaSlotWithWasteChuteRightAdapterNoCover',
            ],
          },
        ]

        render({
          location: locationSequence,
          params: defaultParams,
        })

        screen.getByText('Waste Chute')
      })

      it('should handle trash bin sequence', () => {
        const locationSequence: LabwareLocationSequence = [
          { kind: 'onAddressableArea', addressableAreaName: 'movableTrashA3' },
          {
            kind: 'onCutoutFixture',
            cutoutId: 'cutoutA3',
            possibleCutoutFixtureIds: ['movableTrashA3'],
          },
        ]

        render({
          location: locationSequence,
          params: defaultParams,
        })
        screen.getByText('Trash Bin')
      })
    })
  })
})
