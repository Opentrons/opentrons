import { Dispatch, SetStateAction, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { uuid } from '@opentrons/step-generation'
import {
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  FixtureOption,
  Flex,
  Modal,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getCutoutDisplayName,
  ABSORBANCE_READER_CUTOUTS,
  ABSORBANCE_READER_V1_FIXTURE,
  ABSORBANCE_READER_V1,
  HEATER_SHAKER_CUTOUTS,
  HEATERSHAKER_MODULE_V1_FIXTURE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_CENTER_CUTOUTS,
  SINGLE_LEFT_CUTOUTS,
  SINGLE_RIGHT_CUTOUTS,
  STAGING_AREA_CUTOUTS,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  TEMPERATURE_MODULE_CUTOUTS,
  TEMPERATURE_MODULE_V2_FIXTURE,
  THERMOCYCLER_MODULE_CUTOUTS,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
  getFixtureDisplayName,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  MAGNETIC_BLOCK_V1,
  THERMOCYCLER_MODULE_V1,
  TEMPERATURE_MODULE_V1,
  getModuleType,
  MODULE_MODELS,
} from '@opentrons/shared-data'
import { useKitchen } from '../Kitchen/hooks'

import type { UseFormSetValue } from 'react-hook-form'
import type {
  CutoutConfig,
  CutoutId,
  DeckConfiguration,
  FlexModuleCutoutFixtureId,
  ModuleModel,
} from '@opentrons/shared-data'
import type { ModalProps } from '@opentrons/components'
import type { FormModules } from '../../../step-forms'
import type {
  FixtureName,
  WizardFixtureType,
  WizardFormState,
} from '../../../pages/Onboarding/types'

interface AddFixtureModalProps {
  cutoutId: CutoutId
  closeModal: () => void
  modules: FormModules
  fixtures: WizardFixtureType
  deckConfig: DeckConfiguration
  setUpdatedDeckConfig: Dispatch<SetStateAction<DeckConfiguration>>
  setValue: UseFormSetValue<WizardFormState>
  hasGripper: boolean
}
type OptionStage =
  | 'modulesOrFixtures'
  | 'fixtureOptions'
  | 'moduleOptions'
  | 'wasteChuteOptions'
  | 'providedOptions'

interface CutoutConfigExtended extends CutoutConfig {
  type: FixtureName | ModuleModel | 'stagingAreaAndMagneticBlock'
}

const FIXTURES = ['wasteChute', 'trashBin', 'stagingArea']

//  TODO: this is similar to the AddFixtureModal in the app but logic varies
//  quite a bit. Would be ideal to merge them together but not sure how to do
//  so cleanly.
export function AddFixtureModal(props: AddFixtureModalProps): JSX.Element {
  const {
    cutoutId,
    closeModal,
    modules,
    fixtures,
    deckConfig,
    setUpdatedDeckConfig,
    setValue,
    hasGripper,
  } = props
  const { t } = useTranslation('shared')
  const { makeSnackbar } = useKitchen()
  let initialStage: OptionStage = SINGLE_CENTER_CUTOUTS.includes(cutoutId) // only magnetic block can be configured in column 2
    ? 'moduleOptions'
    : 'modulesOrFixtures'

  const [optionStage, setOptionStage] = useState<OptionStage>(initialStage)

  const modalProps: ModalProps = {
    title: t('add_to_slot', {
      slotName: getCutoutDisplayName(cutoutId),
    }),
    onClose: closeModal,
    closeOnOutsideClick: true,
    childrenPadding: SPACING.spacing24,
    width: '26.75rem',
  }

  let availableOptions: CutoutConfigExtended[][] = []
  if (optionStage === 'fixtureOptions') {
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
            type: 'trashBin',
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
            type: 'stagingArea',
          },
        ],
      ]
    }
  } else if (optionStage === 'moduleOptions') {
    availableOptions = [
      ...availableOptions,
      [
        {
          cutoutId,
          cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
          type: MAGNETIC_BLOCK_V1,
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
            type: 'stagingAreaAndMagneticBlock',
          },
        ],
      ]
    }
    if (THERMOCYCLER_MODULE_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId: THERMOCYCLER_MODULE_CUTOUTS[1],
            cutoutFixtureId: THERMOCYCLER_V2_FRONT_FIXTURE,
            type: THERMOCYCLER_MODULE_V1,
          },
        ],
      ]
    }
    if (HEATER_SHAKER_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: HEATERSHAKER_MODULE_V1_FIXTURE,
            type: HEATERSHAKER_MODULE_V1,
          },
        ],
      ]
    }
    if (TEMPERATURE_MODULE_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
            type: TEMPERATURE_MODULE_V1,
          },
        ],
      ]
    }
    if (ABSORBANCE_READER_CUTOUTS.includes(cutoutId)) {
      availableOptions = [
        ...availableOptions,
        [
          {
            cutoutId,
            cutoutFixtureId: ABSORBANCE_READER_V1_FIXTURE,
            type: ABSORBANCE_READER_V1,
          },
        ],
      ]
    }
  } else if (optionStage === 'wasteChuteOptions') {
    availableOptions = [
      WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
      STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
    ].map(fixture => [
      {
        cutoutId,
        cutoutFixtureId: fixture,
        type: 'wasteChute',
      },
    ])
  }

  let nextStageOptions = null
  if (optionStage === 'modulesOrFixtures') {
    nextStageOptions = (
      <>
        {SINGLE_CENTER_CUTOUTS.includes(cutoutId) ? null : (
          <FixtureOption
            key="fixturesOption"
            optionName="Fixtures"
            buttonText={t('select_options')}
            onClickHandler={() => {
              setOptionStage('fixtureOptions')
            }}
            isOnDevice={false}
          />
        )}
        <FixtureOption
          key="modulesOption"
          optionName="Modules"
          buttonText={t('select_options')}
          onClickHandler={() => {
            setOptionStage('moduleOptions')
          }}
          isOnDevice={false}
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
          key="wasteChuteOption"
          optionName="Waste chute"
          buttonText={t('select_options')}
          onClickHandler={() => {
            setOptionStage('wasteChuteOptions')
          }}
          isOnDevice={false}
        />
      </>
    )
  }

  const handleAddFixture = (
    addedCutoutConfigs: CutoutConfigExtended[]
  ): void => {
    if (
      addedCutoutConfigs.some(
        cutoutConfig => cutoutConfig.type === 'trashBin'
      ) &&
      Object.values(fixtures).some(fixture => fixture.name === 'trashBin')
    ) {
      makeSnackbar(t('only_one_trash') as string)
    } else if (
      !hasGripper &&
      addedCutoutConfigs.some(
        cutoutConfig => cutoutConfig.type === 'absorbanceReaderV1'
      )
    ) {
      makeSnackbar(t('add_gripper_for_plate') as string)
    } else {
      const newDeckConfig = deckConfig.map(fixture => {
        const replacementCutoutConfig = addedCutoutConfigs.find(
          c => c.cutoutId === fixture.cutoutId
        )
        return replacementCutoutConfig ?? fixture
      })
      const newModule = addedCutoutConfigs.find(
        cutoutConfig =>
          MODULE_MODELS.includes(cutoutConfig.type as ModuleModel) ||
          cutoutConfig.type === 'stagingAreaAndMagneticBlock'
      )
      const newFixture = addedCutoutConfigs.find(
        cutoutConfig =>
          FIXTURES.includes(cutoutConfig.type) ||
          cutoutConfig.type === 'stagingAreaAndMagneticBlock'
      )
      if (newModule != null) {
        const filteredModules = Object.fromEntries(
          Object.entries(modules).filter(
            ([, module]) => module.cutoutId !== newModule.cutoutId
          )
        )

        const updatedModules: FormModules = {
          ...filteredModules,
          [uuid()]: {
            model:
              newModule.type === 'stagingAreaAndMagneticBlock'
                ? MAGNETIC_BLOCK_V1
                : (newModule.type as ModuleModel),
            type: getModuleType(
              newModule.type === 'stagingAreaAndMagneticBlock'
                ? MAGNETIC_BLOCK_V1
                : (newModule.type as ModuleModel)
            ),
            slot: newModule.cutoutId.split('cutout')[1],
            cutoutFixtureId: newModule.cutoutFixtureId as FlexModuleCutoutFixtureId,
            cutoutId: newModule.cutoutId,
          },
        }

        setValue('modules', updatedModules)
      }
      if (newFixture != null) {
        const filteredFixtures = Object.fromEntries(
          Object.entries(fixtures).filter(
            ([, fixture]) => fixture.cutoutId !== newFixture.cutoutId
          )
        )

        const updatedFixtures: WizardFixtureType = {
          ...filteredFixtures,
          [uuid()]: {
            name:
              newFixture.type === 'stagingAreaAndMagneticBlock'
                ? 'stagingArea'
                : (newFixture.type as FixtureName),
            cutoutFixtureId: newFixture.cutoutFixtureId,
            cutoutId: newFixture.cutoutId,
          },
        }
        setValue('fixtures', updatedFixtures)
      }

      setUpdatedDeckConfig(newDeckConfig)
      closeModal()
    }
  }

  const fixtureOptions = availableOptions.map(cutoutConfigs => {
    return (
      <FixtureOption
        key={cutoutConfigs[0].cutoutFixtureId}
        optionName={getFixtureDisplayName(cutoutConfigs[0].cutoutFixtureId)}
        buttonText={t('add')}
        onClickHandler={() => {
          handleAddFixture(cutoutConfigs)
        }}
        isOnDevice={false}
      />
    )
  })

  return (
    <>
      <Modal {...modalProps}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('add_fixture_description')}
          </StyledText>
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
            <StyledText css={GO_BACK_BUTTON_STYLE}>{t('go_back')}</StyledText>
          </Btn>
        ) : null}
      </Modal>
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
