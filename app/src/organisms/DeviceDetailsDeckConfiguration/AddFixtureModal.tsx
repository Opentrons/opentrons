import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cpSync } from 'original-fs'
import { createEpicMiddleware } from 'redux-observable'
import { css } from 'styled-components'

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
import { CUSTOM_LABWARE_PROMPT_W_RESULTS } from '@opentrons/labware-library/src/localization'
import {
  useModulesQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  ABSORBANCE_READER_CUTOUTS,
  ABSORBANCE_READER_V1,
  ABSORBANCE_READER_V1_FIXTURE,
  AddressableAreaName,
  CutoutFixture,
  FLEX_STACKER_MODULE_V1,
  FLEX_STACKER_V1_FIXTURE,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE,
  FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
  getCutoutDisplayName,
  getDeckDefFromRobotType,
  getFixtureDisplayName,
  HEATER_SHAKER_CUTOUTS,
  HEATERSHAKER_MODULE_V1,
  HEATERSHAKER_MODULE_V1_FIXTURE,
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

import type { ModalProps } from '@opentrons/components'
import type {
  CutoutConfig,
  CutoutFixtureId,
  CutoutId,
} from '@opentrons/shared-data'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface AddFixtureModalProps {
  cutoutId: CutoutId
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
    title: t('add_to_slot', {
      slotName: getCutoutDisplayName(cutoutId),
    }),
    hasExitIcon: providedFixtureOptions == null,
    onClick: closeModal,
  }

  const modalProps: ModalProps = {
    title: t('add_to_slot', {
      slotName: getCutoutDisplayName(cutoutId),
    }),
    onClose: closeModal,
    closeOnOutsideClick: true,
    childrenPadding: SPACING.spacing24,
    width: '26.75rem',
  }

  const availableOptions = getOptions(
    cutoutId,
    providedFixtureOptions,
    unconfiguredMods,
    optionStage
  )

  let nextStageOptions = null
  if (optionStage === 'modulesOrFixtures') {
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

  const handleAddFixture = (addedCutoutConfigs: CutoutConfig[]): void => {
    const newDeckConfig = deckConfig.map(fixture => {
      const replacementCutoutConfig = addedCutoutConfigs.find(
        c => c.cutoutId === fixture.cutoutId
      )
      return replacementCutoutConfig ?? fixture
    })

    updateDeckConfiguration(newDeckConfig)
    closeModal()
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

export const getFixtureOptions = (cutoutId: CutoutId): CutoutConfig[][] => {
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

export const getThermoUnconfiguredFixtures = (
  unconfiguredMods: AttachedModule[],
  cutoutId: CutoutId
): CutoutConfig[][] => {
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
        // how can I fix this to only pull the ones that are set?
        cutoutFixtureId:
          fixtureGroupItem[mod as keyof typeof fixtureGroupItem] ??
          ('' as CutoutFixtureId),
        opentronsModuleSerialNumber: item.serialNumber,
      }))
    )
  return matrix
}

const getModuleUnconfiguredFixtures = (
  unconfiguredMods: AttachedModule[],
  cutoutId: CutoutId,
  moduleModel: string
): CutoutConfig[][] => {
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
    {} as Record<CutoutFixtureId, AddressableAreaName[]>
  )

  console.log('addressableAreasById: ', addressableAreasById)
  const keys = Object.keys(addressableAreasById)

  const filteredMods = unconfiguredMods.filter(
    mod => mod.moduleModel === moduleModel
  )
  console.log('unconfiguredMods: ', unconfiguredMods)
  console.log('filteredMods: ', filteredMods)
  let stackerWithMagBlock: CutoutConfig[][] = [],
    stackerWithWasteChute: CutoutConfig[][] = [],
    stackerOptions: CutoutConfig[][] = []
  if (moduleModel === FLEX_STACKER_MODULE_V1) {
    filteredMods.forEach((mod: AttachedModule) => {
      stackerWithMagBlock = [
        [
          {
            cutoutId,
            cutoutFixtureId: FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
            opentronsModuleSerialNumber: mod.serialNumber,
          },
        ],
      ]
      if (cutoutId == 'cutoutD3') {
        stackerWithWasteChute = [
          [
            {
              cutoutId,
              cutoutFixtureId: FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE,
              opentronsModuleSerialNumber: mod.serialNumber,
            },
            {
              cutoutId,
              cutoutFixtureId: FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
              opentronsModuleSerialNumber: mod.serialNumber,
            },
          ],
        ]
      }
      stackerOptions.push([
        {
          cutoutId,
          cutoutFixtureId: keys.find(
            key => key == moduleModel
          ) as CutoutFixtureId,
          opentronsModuleSerialNumber: mod.serialNumber,
        },
      ])
      console.log('module: ', moduleModel)
      console.log('stackerWithMagBlock: ', stackerWithMagBlock)
      console.log('stackerWithWasteChute: ', stackerWithWasteChute)
      return [
        {
          cutoutId,
          cutoutFixtureId: keys.find(
            key => key == moduleModel
          ) as CutoutFixtureId,
          opentronsModuleSerialNumber: mod.serialNumber,
        },
        ...stackerWithMagBlock,
        ...stackerWithWasteChute,
      ]
    })
    console.log('stackerOptions: ', stackerOptions)
    return [...stackerOptions, ...stackerWithMagBlock, ...stackerWithWasteChute]
  } else {
    return filteredMods.map(({ serialNumber, moduleModel }) => {
      return [
        {
          cutoutId,
          cutoutFixtureId: keys.find(
            key => key == moduleModel
          ) as CutoutFixtureId,
          opentronsModuleSerialNumber: serialNumber,
        },
      ]
    })
  }
}

export const getUnconfiguredMods = (
  cutoutId: CutoutId,
  unconfiguredMods: AttachedModule[]
): CutoutConfig[][] => {
  let availableOptions: CutoutConfig[][] = []
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
  console.log('unconfiguredFlexStacker: ', unconfiguredFlexStacker)
  availableOptions = [...availableOptions, ...unconfiguredFlexStacker]

  console.log('availableOptions: ', availableOptions)
  return availableOptions
}

export const getModuleOptions = (
  cutoutId: CutoutId,
  unconfiguredMods: AttachedModule[]
): CutoutConfig[][] => {
  // let availableOptions2 = getModuleOptionsForCutoutId(cutoutId)
  // console.log("availableOptions: ", availableOptions)
  let availableOptions: CutoutConfig[][] = [
    [
      {
        cutoutId,
        cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
      },
    ],
  ]
  // console.log("availableOptions 2: ", availableOptions)
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

export const getOptions = (
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
  console.error(`Was not able to find options for ${cutoutId}`)
  return []
}
