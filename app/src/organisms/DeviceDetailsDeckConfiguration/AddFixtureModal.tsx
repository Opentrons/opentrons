import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  FixtureOption,
  Flex,
  ListTable,
  Modal,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useModulesQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  ABSORBANCE_READER_V1,
  DEFAULT_AA_FOR_WASTE_CHUTE,
  FLEX_STACKER_MODULE_V1,
  getAADisplayName,
  getAddressableAreaMatchForAreaId,
  getDeckDefFromRobotType,
  getFixtureDisplayName,
  getFlexDeckDefAAByFixtureIdForCutoutId,
  HEATERSHAKER_MODULE_V1,
  LEFT_AND_CENTER_CUTOUTS,
  MAGNETIC_BLOCK_V1_FIXTURE,
  MODULE_CUTOUT_FIXTURE_ID,
  replaceCutoutFixtureWithComboFixture,
  replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA,
  SINGLE_CENTER_CUTOUTS,
  SINGLE_RIGHT_CUTOUTS,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_CUTOUTS,
  THERMOCYCLER_MODULE_V2,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import { OddModal } from '/app/molecules/OddModal'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration/'

import type { AttachedModule } from '@opentrons/api-client'
import type { ModalProps } from '@opentrons/components'
import type {
  AddressableAreaNamesWithFakes,
  CutoutConfig,
  CutoutConfigMap,
  CutoutFixtureId,
  CutoutFixtureIdsWithFakes,
  CutoutId,
  CutoutIdToCutoutFixtureId,
} from '@opentrons/shared-data'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface AddFixtureModalProps {
  cutoutId: CutoutId
  addressableAreaId: AddressableAreaNamesWithFakes
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
  addressableAreaId,
  closeModal,
  providedFixtureOptions,
  isOnDevice = false,
}: AddFixtureModalProps): JSX.Element {
  const { t } = useTranslation(['device_details', 'shared'])
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const { data: modulesData } = useModulesQuery()
  const deckConfig = useNotifyDeckConfigurationQuery()?.data ?? []

  const deckConfigWithAA = replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA(
    deckConfig
  )
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
      slotName: getAADisplayName(addressableAreaId),
    }),
    hasExitIcon: providedFixtureOptions == null,
    onClick: closeModal,
  }

  const modalProps: ModalProps = {
    title: t('add_to', {
      slotName: getAADisplayName(addressableAreaId),
    }),
    onClose: closeModal,
    closeOnOutsideClick: true,
    childrenPadding: SPACING.spacing24,
    width: '26.75rem',
  }

  const getModuleUnconfiguredFixtures = (
    unconfiguredMods: AttachedModule[],
    cutoutId: CutoutId,
    moduleModel: string
  ): CutoutConfigMap[][] => {
    const addressableAreasById = getFlexDeckDefAAByFixtureIdForCutoutId(
      cutoutId
    )
    const keys = Object.keys(addressableAreasById)
    const filteredMods = unconfiguredMods.filter(
      mod => mod.moduleModel === moduleModel
    )
    const mappedWithAA = filteredMods.map(({ serialNumber, moduleModel }) => {
      const cutoutFixtureId = keys.find(
        key => key === moduleModel
      ) as CutoutFixtureId
      const aaforModule = getAddressableAreaMatchForAreaId(
        cutoutId,
        cutoutFixtureId,
        addressableAreaId
      )
      return {
        serialNumber,
        cutoutFixtureId,
        aaforModule,
      }
    })

    const filteredModsNoMatch = mappedWithAA.filter(
      ({ aaforModule }) => aaforModule != null
    )
    return filteredModsNoMatch.map((mod: any) => [
      {
        cutoutId,
        addressableAreaId: mod.aaforModule,
        cutoutFixtureId: mod.cutoutFixtureId,
        opentronsModuleSerialNumber: mod.serialNumber,
      },
    ])
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
    const fixtureGroupItem = fixtureGroup.filter(x => x.length > 0)
    const fixtureGroupMatch = fixtureGroupItem[0][0] as CutoutIdToCutoutFixtureId[]
    const fixtureGroupKeys = Object.keys(fixtureGroupMatch) as CutoutId[]
    const matrix = unconfiguredMods
      .filter(f => f.moduleModel === THERMOCYCLER_MODULE_V2)
      .map(item =>
        fixtureGroupKeys.map((mod: CutoutId) => ({
          cutoutId: mod,
          addressableAreaId: THERMOCYCLER_MODULE_V2,
          cutoutFixtureId: fixtureGroupItem[0][0][mod] as CutoutFixtureId,
          opentronsModuleSerialNumber: item.serialNumber,
        }))
      )
    return matrix
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

    return availableOptions
  }

  const getModuleOptions = (
    cutoutId: CutoutId,
    unconfiguredMods: AttachedModule[]
  ): CutoutConfigMap[][] => {
    let availableOptions: CutoutConfigMap[][] = []
    const aaMagBlockId = getAddressableAreaMatchForAreaId(
      cutoutId,
      MAGNETIC_BLOCK_V1_FIXTURE,
      addressableAreaId
    )
    if (aaMagBlockId != null) {
      availableOptions.push([
        {
          cutoutId,
          cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
          addressableAreaId: aaMagBlockId,
        },
      ])
    }
    if (unconfiguredMods.length > 0) {
      availableOptions = [
        ...availableOptions,
        ...getUnconfiguredMods(cutoutId, unconfiguredMods),
      ]
    }
    return availableOptions
  }

  const getWasteChuteOptions = (cutoutId: CutoutId): CutoutConfigMap[][] => {
    return [
      [
        {
          cutoutId,
          cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          addressableAreaId: DEFAULT_AA_FOR_WASTE_CHUTE,
        },
      ],
    ]
  }

  const getFixtureOptions = (cutoutId: CutoutId): CutoutConfigMap[][] => {
    let availableOptions: CutoutConfigMap[][] = []
    const TrashBinAA = getAddressableAreaMatchForAreaId(
      cutoutId,
      TRASH_BIN_ADAPTER_FIXTURE,
      addressableAreaId
    )
    if (TrashBinAA != null) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
            addressableAreaId: TrashBinAA,
          },
        ],
      ]
    }

    const stagingAreaAA = getAddressableAreaMatchForAreaId(
      cutoutId,
      STAGING_AREA_RIGHT_SLOT_FIXTURE,
      addressableAreaId
    )
    if (stagingAreaAA != null) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
            addressableAreaId: stagingAreaAA,
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
  ): CutoutConfigMap[][] => {
    if (providedFixtureOptions != null) {
      return providedFixtureOptions?.map((o: CutoutFixtureId) => {
        const addressableAreasById = getFlexDeckDefAAByFixtureIdForCutoutId(
          cutoutId
        )
        const aaProvidedFixtureOptions = addressableAreasById[o]
        if (aaProvidedFixtureOptions != null) {
          const aaForFixture = getAddressableAreaMatchForAreaId(
            cutoutId,
            o,
            addressableAreaId
          )
          if (aaForFixture != null) {
            return [
              {
                cutoutId,
                cutoutFixtureId: o,
                addressableAreaId: aaForFixture,
              },
            ]
          }
        }
        return []
      })
    }
    if (optionStage === 'fixtureOptions') {
      return getFixtureOptions(cutoutId)
    }
    if (optionStage === 'moduleOptions') {
      return getModuleOptions(cutoutId, unconfiguredMods)
    }
    if (optionStage === 'wasteChuteOptions') {
      return getWasteChuteOptions(cutoutId)
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
    cutoutId === WASTE_CHUTE_CUTOUT &&
    addressableAreaId === 'D3'
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
    const addedCutoutConfigsWithCombo = replaceCutoutFixtureWithComboFixture(
      addedCutoutConfigs,
      deckConfigWithAA,
      cutoutId
    )
    const newDeckConfig: CutoutConfig[] = deckConfig.map(fixture => {
      return (
        addedCutoutConfigsWithCombo.find(
          c => c.cutoutId === fixture.cutoutId
        ) ?? fixture
      )
    }) as CutoutConfig[] // we can do this bc we are mapping each aa to the proper fixture

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
            <StyledText oddStyle="bodyTextRegular">
              {t('add_fixture_description')}
            </StyledText>
            <ListTable>
              {fixtureOptions}
              {nextStageOptions}
            </ListTable>
          </Flex>
        </OddModal>
      ) : (
        <Modal {...modalProps}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('add_fixture_description')}
            </StyledText>
            <ListTable>
              {fixtureOptions}
              {nextStageOptions}
            </ListTable>
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
              <StyledText css={GO_BACK_BUTTON_STYLE}>
                {t('shared:go_back')}
              </StyledText>
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
