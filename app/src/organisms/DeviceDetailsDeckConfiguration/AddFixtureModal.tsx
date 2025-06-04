import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cpSync } from 'original-fs'
import { createEpicMiddleware } from 'redux-observable'
import { css } from 'styled-components'
import { a } from 'vitest/dist/chunks/suite.B2jumIFP'

import { AttachedModule } from '@opentrons/api-client'
import {
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  FixtureOption,
  Flex,
  LegacyStyledText,
  Modal,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getAddressableAreaDisplayName } from '@opentrons/components/src/organisms/CommandText/useCommandTextString/utils/getAddressableAreaDisplayName'
import { CUSTOM_LABWARE_PROMPT_W_RESULTS } from '@opentrons/labware-library/src/localization'
import {
  useModulesQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  ABSORBANCE_READER_V1,
  AddressableArea,
  AddressableAreaName,
  AddressableAreaNamesWithFakes,
  AddressableAreaWithFakes,
  CutoutConfigMap,
  FLEX_STACKER_MODULE_V1,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE,
  FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
  getAAByAAId,
  getAADisplayName,
  getDeckDefFromRobotType,
  getFixtureDisplayName,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_CENTER_CUTOUTS,
  SINGLE_LEFT_CUTOUTS,
  SINGLE_RIGHT_CUTOUTS,
  STAGING_AREA_CUTOUTS,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  TEMPERATURE_MODULE_CUTOUTS,
  TEMPERATURE_MODULE_V2,
  TEMPERATURE_MODULE_V2_FIXTURE,
  THERMOCYCLER_MODULE_CUTOUTS,
  THERMOCYCLER_MODULE_V2,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'

import { OddModal } from '/app/molecules/OddModal'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration/'

import { getAddressableAreaNameFrom } from '../LabwarePositionCheck/LPCFlows/hooks/useLPCLabwareInfo/getUniqueValidLwLocationInfoByAnalysis/getLPCUniqValidLabwareLocationInfo/helpers'

import type { ModalProps } from '@opentrons/components'
import type {
  CutoutConfig,
  CutoutFixtureId,
  CutoutId,
} from '@opentrons/shared-data'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface AddFixtureModalProps {
  cutoutId: CutoutId
  addressableArea: AddressableAreaWithFakes
  closeModal: () => void
  providedFixtureOptions?: CutoutFixtureId[]
  isOnDevice?: boolean
}
type OptionStage =
  | 'modulesOrFixtures'
  | 'fixtureOptions'
  | 'moduleOptions'
  | 'wasteChuteOptions'
  | 'providedOptions'

export function AddFixtureModal({
  cutoutId,
  addressableArea,
  closeModal,
  providedFixtureOptions,
  isOnDevice = false,
}: AddFixtureModalProps): JSX.Element {
  const { t } = useTranslation(['device_details', 'shared'])
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const { data: modulesData } = useModulesQuery()
  const deckConfig = useNotifyDeckConfigurationQuery()?.data ?? []
  const unconfiguredMods =
    modulesData?.data.filter(
      attachedMod =>
        !deckConfig.some(
          ({ opentronsModuleSerialNumber }) =>
            attachedMod.serialNumber === opentronsModuleSerialNumber
        )
    ) ?? []

  let initialStage: OptionStage = SINGLE_CENTER_CUTOUTS.includes(cutoutId) // only mag block (a module) can be configured in column 2
    ? 'moduleOptions'
    : 'modulesOrFixtures'
  if (providedFixtureOptions != null) {
    // only show provided options if given as props
    initialStage = 'providedOptions'
  }
  const [optionStage, setOptionStage] = useState<OptionStage>(initialStage)

  const modalHeader: OddModalHeaderBaseProps = {
    title: t('add_to', {
      slotName: getAADisplayName(addressableArea),
    }),
    hasExitIcon: providedFixtureOptions == null,
    onClick: closeModal,
  }

  const modalProps: ModalProps = {
    title: t('add_to', {
      slotName: getAADisplayName(addressableArea),
    }),
    onClose: closeModal,
    closeOnOutsideClick: true,
    childrenPadding: SPACING.spacing24,
    width: '26.75rem',
  }

  const aaNameMapToSlotId = {
    flexStackerModuleV1D4: 'D4',
    flexStackerModuleV1C4: 'C4',
    flexStackerModuleV1B4: 'B4',
    flexStackerModuleV1A4: 'A4',
    magneticBlockV1D1: 'D1',
    magneticBlockV1C1: 'C1',
    magneticBlockV1B1: 'B1',
    magneticBlockV1A1: 'A1',
    magneticBlockV1D2: 'D2',
    magneticBlockV1C2: 'C2',
    magneticBlockV1B2: 'B2',
    magneticBlockV1A2: 'A2',
    magneticBlockV1A3: 'A3',
    magneticBlockV1B3: 'B3',
    magneticBlockV1C3: 'C3',
    magneticBlockV1D3: 'D3',
    '1ChannelWasteChute': 'D3',
    '8ChannelWasteChute': 'D3',
    '96ChannelWasteChute': 'D3',
    gripperWasteChute: 'D3',
    temperatureModuleV2D1: 'D1',
    temperatureModuleV2C1: 'C2',
    temperatureModuleV2B1: 'B1',
    temperatureModuleV2A1: 'A1',
    temperatureModuleV2D3: 'D3',
    temperatureModuleV2C3: 'C3',
    temperatureModuleV2B3: 'B3',
    temperatureModuleV2A3: 'A3',
    heaterShakerV1D1: 'D1',
    heaterShakerV1C1: 'C1',
    heaterShakerV1B1: 'B1',
    heaterShakerV1A1: 'A1',
    heaterShakerV1D3: 'D3',
    heaterShakerV1C3: 'C3',
    heaterShakerV1B3: 'B3',
    heaterShakerV1A3: 'A3',
  } as const

  const MODULE_CUTOUT_FIXTURE_ID = [
    'heaterShakerModuleV1',
    'temperatureModuleV2',
    'magneticBlockV1',
    'stagingAreaSlotWithMagneticBlockV1',
    'thermocyclerModuleV2Rear',
    'thermocyclerModuleV2Front',
    'absorbanceReaderV1',
    'flexStackerModuleV1',
    'flexStackerModuleV1WithMagneticBlockV1',
  ]

  const getModuleUnconfiguredFixtures = (
    unconfiguredMods: AttachedModule[],
    cutoutId: CutoutId,
    moduleModel: string
  ): CutoutConfigMap[][] => {
    const deckDef = getDeckDefFromRobotType('OT-3 Standard')
    const availableCutoutFixtuers = deckDef.cutoutFixtures.filter(
      cf =>
        cf.mayMountTo.includes(cutoutId) &&
        MODULE_CUTOUT_FIXTURE_ID.includes(cf.id)
    )

    const addressableAreasById = availableCutoutFixtuers.reduce(
      (acc, { id, providesAddressableAreas }) => {
        return { ...acc, [id]: providesAddressableAreas[cutoutId] }
      },
      {} as Record<CutoutFixtureId, AddressableAreaNamesWithFakes[]>
    )

    console.log('addressableAreasById: ', addressableAreasById)
    const keys = Object.keys(addressableAreasById)

    const filteredMods = unconfiguredMods.filter(
      mod => mod.moduleModel === moduleModel
    )

    let stackerOptions: CutoutConfigMap[][] = []
    if (moduleModel === FLEX_STACKER_MODULE_V1) {
      filteredMods.forEach((mod: AttachedModule) => {
        stackerOptions.push([
          {
            cutoutId,
            cutoutFixtureId: FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
            opentronsModuleSerialNumber: mod.serialNumber,
          },
        ])
        if (cutoutId == 'cutoutD3') {
          stackerOptions.push(
            [
              {
                cutoutId,
                cutoutFixtureId: FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE,
                opentronsModuleSerialNumber: mod.serialNumber,
              },
            ],
            [
              {
                cutoutId,
                cutoutFixtureId: FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
                opentronsModuleSerialNumber: mod.serialNumber,
              },
            ]
          )
        }
        const cutoutFixtureId = keys.find(
          key => key == moduleModel
        ) as CutoutFixtureId
        const aaList = addressableAreasById[cutoutFixtureId]

        console.log('aaList: ', aaList)
        const aa = aaList.find(
          aa => aaNameMapToSlotId[aa] == addressableArea.id
        )
        console.log('aa', aa)
        if (aa == undefined) {
          console.error(`Was not able to find aa for ${addressableArea.id}`)
        }
        else{
          stackerOptions.push([
            {
              cutoutId,
              addressableAreaId: aa,
              cutoutFixtureId,
              opentronsModuleSerialNumber: mod.serialNumber,
            },
          ])
        }
      })
      return [...stackerOptions]
    } else {
      return filteredMods.map(({ serialNumber, moduleModel }) => {
        const cutoutFixtureId = keys.find(
          key => key == moduleModel
        ) as CutoutFixtureId
        const aaList = addressableAreasById[cutoutFixtureId]

        console.log('aaList: ', aaList)
        const aa = aaList.find(
          aa => aaNameMapToSlotId[aa] == addressableArea.id
        ) as AddressableAreaName
        console.log('aa', aa)
        if (aa == undefined) {
          console.error(`Was not able to find aa for ${addressableArea.id}`)
        }
        return [
          {
            cutoutId,
            addressableAreaId: aa,
            cutoutFixtureId,
            opentronsModuleSerialNumber: serialNumber,
          },
        ]
      })
    }
  }

  const getUnconfiguredMods = (
    cutoutId: CutoutId,
    unconfiguredMods: AttachedModule[]
  ): CutoutConfigMap[][] => {
    let availableOptions: CutoutConfigMap[][] = []
    if (THERMOCYCLER_MODULE_CUTOUTS.includes(cutoutId)) {
      const unconfiguredTCs = getThermoUnconfiguredFixtures(
        unconfiguredMods,
        cutoutId
      )
      availableOptions = [...availableOptions, ...unconfiguredTCs]
    }
    const unconfiguredHeaterShakers = getModuleUnconfiguredFixtures(
      unconfiguredMods,
      cutoutId,
      HEATERSHAKER_MODULE_V1
    )
    availableOptions = [...availableOptions, ...unconfiguredHeaterShakers]
    console.log('unconfiguredHeaterShakers: ', unconfiguredHeaterShakers)

    const unconfiguredTemperatureModules = getModuleUnconfiguredFixtures(
      unconfiguredMods,
      cutoutId,
      TEMPERATURE_MODULE_V2
    )
    availableOptions = [...availableOptions, ...unconfiguredTemperatureModules]

    const unconfiguredAbsorbanceReaders = getModuleUnconfiguredFixtures(
      unconfiguredMods,
      cutoutId,
      ABSORBANCE_READER_V1
    )
    availableOptions = [...availableOptions, ...unconfiguredAbsorbanceReaders]

    const unconfiguredFlexStacker = getModuleUnconfiguredFixtures(
      unconfiguredMods,
      cutoutId,
      FLEX_STACKER_MODULE_V1
    )
    availableOptions = [...availableOptions, ...unconfiguredFlexStacker]

    console.log('availableOptions: ', availableOptions)
    return availableOptions
  }

  const getModuleOptions = (
    cutoutId: CutoutId,
    unconfiguredMods: AttachedModule[]
  ): CutoutConfig[][] => {
    let availableOptions: CutoutConfig[][] = [
      [
        {
          cutoutId,
          cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
        },
      ],
    ]
    if (SINGLE_RIGHT_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
          },
        ],
      ]
    }
    if (unconfiguredMods.length > 0) {
      availableOptions = [
        ...availableOptions,
        ...getUnconfiguredMods(cutoutId, unconfiguredMods),
      ]
    }
    return availableOptions
  }

  const getFixtureOptions = (cutoutId: CutoutId): CutoutConfig[][] => {
    let availableOptions: CutoutConfig[][] = []
    if (
      SINGLE_RIGHT_CUTOUTS.includes(cutoutId) ||
      SINGLE_LEFT_CUTOUTS.includes(cutoutId)
    ) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
          },
        ],
      ]
    }
    if (STAGING_AREA_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
          },
        ],
      ]
    }
    return availableOptions
  }

  const getOptions = (
    cutoutId: CutoutId,
    providedFixtureOptions: CutoutFixtureId[] | undefined,
    unconfiguredMods: AttachedModule[],
    optionStage: string
  ): CutoutConfig[][] => {
    if (providedFixtureOptions != null) {
      return providedFixtureOptions?.map(o => [
        {
          cutoutId,
          cutoutFixtureId: o,
          opentronsModuleSerialNumber: undefined,
        },
      ])
    }
    if (optionStage === 'fixtureOptions') {
      return getFixtureOptions(cutoutId)
    }
    if (optionStage === 'moduleOptions') {
      return getModuleOptions(cutoutId, unconfiguredMods)
    }
    if (optionStage === 'wasteChuteOptions') {
      return WASTE_CHUTE_FIXTURES.map(fixture => [
        {
          cutoutId,
          cutoutFixtureId: fixture,
        },
      ])
    }
    return []
  }

  const availableOptions = getOptions(
    cutoutId,
    providedFixtureOptions,
    unconfiguredMods,
    optionStage
  )

  let nextStageOptions = null
  if (optionStage === 'modulesOrFixtures') {
    console.log('inside modulesOrFixtures')
    nextStageOptions = (
      <>
        {SINGLE_CENTER_CUTOUTS.includes(cutoutId) ? null : (
          <FixtureOption
            key="fixturesOption"
            optionName="Fixtures"
            buttonText={t('add')}
            onClickHandler={() => {
              setOptionStage('fixtureOptions')
            }}
            isOnDevice={isOnDevice}
          />
        )}
        <FixtureOption
          key="modulesOption"
          optionName="Modules"
          buttonText={t('add')}
          onClickHandler={() => {
            setOptionStage('moduleOptions')
          }}
          isOnDevice={isOnDevice}
        />
      </>
    )
    console.log('nextStageOptions: ', nextStageOptions)
  } else if (
    optionStage === 'fixtureOptions' &&
    cutoutId === WASTE_CHUTE_CUTOUT
  ) {
    nextStageOptions = (
      <>
        <FixtureOption
          key="wasteChuteStageOption"
          optionName="Waste chute"
          buttonText={t('select_options')}
          onClickHandler={() => {
            setOptionStage('wasteChuteOptions')
          }}
          isOnDevice={isOnDevice}
        />
      </>
    )
  }

  const handleAddFixture = (addedCutoutConfigs: CutoutConfigMap[]): void => {
    console.log('addedCutoutConfigs: ', addedCutoutConfigs)
    const newDeckConfig: CutoutConfig[] = deckConfig.map(fixture => {
      const replacementCutoutConfig = addedCutoutConfigs.find(
        c => c.cutoutId === fixture.cutoutId
      )
      return replacementCutoutConfig ?? fixture
    })

    updateDeckConfiguration(newDeckConfig)
    closeModal()
  }

  const getThermoUnconfiguredFixtures = (
    unconfiguredMods: AttachedModule[],
    cutoutId: CutoutId
  ): CutoutConfigMap[][] => {
    const deckDef = getDeckDefFromRobotType('OT-3 Standard')

    const availableCutoutFixtuers = deckDef.cutoutFixtures.filter(
      cf =>
        cf.mayMountTo.includes(cutoutId) &&
        MODULE_CUTOUT_FIXTURE_ID.includes(cf.id)
    )
    const fixtureGroup = availableCutoutFixtuers.map(
      mod => mod.fixtureGroup[cutoutId] ?? []
    )
    const fixtureGroupItem = fixtureGroup[0][0]
    const matrix = unconfiguredMods
      .filter(f => f.moduleModel === THERMOCYCLER_MODULE_V2)
      .map(item =>
        Object.keys(fixtureGroupItem).map((mod: string) => ({
          cutoutId: mod as CutoutId,
          addressableAreaId: THERMOCYCLER_MODULE_V2,
          // how can I fix this to only pull the ones that are set?
          cutoutFixtureId:
            fixtureGroupItem[mod as keyof typeof fixtureGroupItem] ??
            ('' as CutoutFixtureId),
          opentronsModuleSerialNumber: item.serialNumber,
        }))
      )
    return matrix
  }

  const fixtureOptions = availableOptions.map(cutoutConfigs => {
    const usbPort = (modulesData?.data ?? []).find(
      m => m.serialNumber === cutoutConfigs[0].opentronsModuleSerialNumber
    )?.usbPort
    const portDisplay =
      usbPort?.hubPort != null
        ? `${usbPort.port}.${usbPort.hubPort}`
        : usbPort?.port

    return (
      <FixtureOption
        key={cutoutConfigs[0].cutoutFixtureId}
        optionName={getFixtureDisplayName(
          cutoutConfigs[0].cutoutFixtureId,
          portDisplay
        )}
        buttonText={t('add')}
        onClickHandler={() => {
          handleAddFixture(cutoutConfigs)
        }}
        isOnDevice={isOnDevice}
      />
    )
  })

  return (
    <>
      {isOnDevice ? (
        <OddModal
          header={modalHeader}
          onOutsideClick={() => {
            if (providedFixtureOptions == null) closeModal()
          }}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
            <LegacyStyledText as="p">
              {t('add_fixture_description')}
            </LegacyStyledText>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              {fixtureOptions}
              {nextStageOptions}
            </Flex>
          </Flex>
        </OddModal>
      ) : (
        <Modal {...modalProps}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
            <LegacyStyledText as="p">
              {t('add_fixture_description')}
            </LegacyStyledText>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              {fixtureOptions}
              {nextStageOptions}
            </Flex>
          </Flex>
          {optionStage === 'wasteChuteOptions' ? (
            <Btn
              onClick={() => {
                setOptionStage('fixtureOptions')
              }}
              aria-label="back"
              paddingX={SPACING.spacing16}
              marginTop="1.44rem"
              marginBottom="0.56rem"
            >
              <LegacyStyledText css={GO_BACK_BUTTON_STYLE}>
                {t('shared:go_back')}
              </LegacyStyledText>
            </Btn>
          ) : null}
        </Modal>
      )}
    </>
  )
}

const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.grey50};

  &:hover {
    opacity: 70%;
  }
`
