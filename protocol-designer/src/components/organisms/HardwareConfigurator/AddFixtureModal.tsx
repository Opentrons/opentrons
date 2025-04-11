import { useState } from 'react'
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
  ABSORBANCE_READER_V1,
  SINGLE_CENTER_CUTOUTS,
  WASTE_CHUTE_CUTOUT,
  getFixtureDisplayName,
  MAGNETIC_BLOCK_V1,
  getModuleType,
  MODULE_MODELS,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'
import { useKitchen } from '../Kitchen/hooks'
import { getAvailableOptions } from './util'

import type { UseFormSetValue } from 'react-hook-form'
import type { Dispatch, SetStateAction } from 'react'
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
export type OptionStage =
  | 'modulesOrFixtures'
  | 'fixtureOptions'
  | 'moduleOptions'
  | 'wasteChuteOptions'

export interface CutoutConfigExtended extends CutoutConfig {
  type?: FixtureName | ModuleModel | 'stagingAreaAndMagneticBlock'
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
  const { t, i18n } = useTranslation('shared')
  const { makeSnackbar } = useKitchen()
  const initialStage: OptionStage = SINGLE_CENTER_CUTOUTS.includes(cutoutId) // only magnetic block can be configured in column 2
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

  const availableOptions = getAvailableOptions({ optionStage, cutoutId })

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
      <FixtureOption
        key="wasteChuteOption"
        optionName="Waste chute"
        buttonText={t('select_options')}
        onClickHandler={() => {
          setOptionStage('wasteChuteOptions')
        }}
        isOnDevice={false}
      />
    )
  }

  const handleAddFixture = (
    addedCutoutConfigs: CutoutConfigExtended[]
  ): void => {
    //  only allow 1 trashBin
    if (
      addedCutoutConfigs.some(
        cutoutConfig => cutoutConfig.type === 'trashBin'
      ) &&
      Object.values(fixtures).some(fixture => fixture.name === 'trashBin')
    ) {
      makeSnackbar(t('only_one_trash') as string)
      //  only allow absorbance reader if gripper is attached
    } else if (
      !hasGripper &&
      addedCutoutConfigs.some(
        cutoutConfig => cutoutConfig.type === ABSORBANCE_READER_V1
      )
    ) {
      makeSnackbar(t('add_gripper_for_plate') as string)
      //  block thermocycler from being added if there is something in slot A1
    } else if (
      addedCutoutConfigs.some(
        cutoutConfig => cutoutConfig.type === 'thermocyclerModuleV2'
      ) &&
      (Object.values(modules).some(module => module.cutoutId === 'cutoutA1') ||
        Object.values(fixtures).some(
          fixture => fixture.cutoutId === 'cutoutA1'
        ))
    ) {
      makeSnackbar(t('thermocycler_blocked') as string)
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
          (cutoutConfig.type != null && FIXTURES.includes(cutoutConfig.type)) ||
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
            slot:
              newModule.type === THERMOCYCLER_MODULE_V2
                ? 'B1'
                : newModule.cutoutId.split('cutout')[1],
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
        buttonText={i18n.format(t('add'), 'capitalize')}
        onClickHandler={() => {
          handleAddFixture(cutoutConfigs)
        }}
        isOnDevice={false}
      />
    )
  })

  return (
    <Modal {...modalProps}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        {fixtureOptions}
        {nextStageOptions}
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
  )
}

const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.grey50};
  &:hover {
    opacity: 70%;
  }
`
