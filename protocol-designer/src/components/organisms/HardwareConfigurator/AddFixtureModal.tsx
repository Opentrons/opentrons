import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'

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
  ABSORBANCE_READER_V1,
  getCutoutDisplayName,
  getFixtureDisplayName,
  getModuleType,
  MAGNETIC_BLOCK_V1,
  MODULE_MODELS,
  SINGLE_CENTER_CUTOUTS,
  THERMOCYCLER_MODULE_V2,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { getSlotInLocationStack, uuid } from '@opentrons/step-generation'

import { editDeckConfiguration } from '../../../step-forms/actions'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { useKitchen } from '../Kitchen/useKitchen'
import { getMainPagePortalEl } from '../Portal'
import { getLabwareCompatibleForEditHardware } from '../utils'
import { getAvailableOptions } from './useDeckConfigurationEditing'

import type { UseFormSetValue } from 'react-hook-form'
import type { ModalProps } from '@opentrons/components'
import type {
  CutoutConfig,
  CutoutId,
  DeckConfiguration,
  FlexModuleCutoutFixtureId,
  ModuleModel,
} from '@opentrons/shared-data'
import type { FormModules, ModuleOnDeck } from '../../../step-forms'
import type { DeckFixture } from '../../../step-forms/actions/additionalItems'
import type { Fixtures, WizardFormState } from '../types'

export interface ModuleExtended extends ModuleOnDeck {
  cutoutId: CutoutId
}
export interface InitialDeckStateModules {
  [moduleId: string]: ModuleExtended
}

interface AddFixtureModalProps {
  cutoutId: CutoutId
  closeModal: () => void
  modules: FormModules | InitialDeckStateModules
  fixtures: Fixtures
  deckConfig: DeckConfiguration
  hasGripper: boolean
  //  used for setting the value in react-hook-form for the onboarding flow
  setValue?: UseFormSetValue<WizardFormState>
  //  used for updating the initialDeckState in redux in overview and
  //  starting deck state
  updateInitialDeckState?: (value: CutoutConfigExtended[]) => void
}
export type OptionStage =
  | 'modulesOrFixtures'
  | 'fixtureOptions'
  | 'moduleOptions'
  | 'wasteChuteOptions'

export interface CutoutConfigExtended extends CutoutConfig {
  type?:
    | DeckFixture
    | ModuleModel
    | 'stagingAreaAndMagneticBlock'
    | 'stagingAreaAndWasteChute'
}

const FIXTURES = [
  'wasteChute',
  'trashBin',
  'stagingArea',
  'stagingAreaAndWasteChute',
]

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
    setValue,
    hasGripper,
    updateInitialDeckState,
  } = props
  const { t, i18n } = useTranslation('shared')
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const { labware } = initialDeckSetup
  const dispatch = useDispatch()
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
        cutoutConfig => cutoutConfig.type === THERMOCYCLER_MODULE_V2
      ) &&
      (Object.values(modules).some(module => module.cutoutId === 'cutoutA1') ||
        Object.values(fixtures).some(
          fixture => fixture.cutoutId === 'cutoutA1'
        ) ||
        Object.values(labware).some(
          lw => getSlotInLocationStack(lw.stack) === 'A1'
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

        setValue?.('modules', updatedModules)
      }
      if (newFixture != null) {
        const isStagingAreaAndWasteChute =
          newFixture.type === 'stagingAreaAndWasteChute'

        const filteredFixtures = Object.fromEntries(
          Object.entries(fixtures).filter(
            ([, fixture]) => fixture.cutoutId !== newFixture.cutoutId
          )
        )

        let additionalFixture: Fixtures | undefined
        if (isStagingAreaAndWasteChute) {
          additionalFixture = {
            [uuid()]: {
              name: 'stagingArea',
              cutoutFixtureId: newFixture.cutoutFixtureId,
              cutoutId: 'cutoutD3',
            },
          }
        }
        let name = newFixture.type as DeckFixture
        if (newFixture.type === 'stagingAreaAndMagneticBlock') {
          name = 'stagingArea'
        } else if (newFixture.type === 'stagingAreaAndWasteChute') {
          name = 'wasteChute'
        }

        const updatedFixtures: Fixtures = {
          ...filteredFixtures,
          [uuid()]: {
            name,
            cutoutFixtureId: newFixture.cutoutFixtureId,
            cutoutId: newFixture.cutoutId,
          },
          ...additionalFixture,
        }
        setValue?.('fixtures', updatedFixtures)
      }
      const labwareCompatible = getLabwareCompatibleForEditHardware(
        labware,
        cutoutId,
        newModule,
        newFixture
      )
      if (labwareCompatible) {
        dispatch(editDeckConfiguration({ deckConfig: newDeckConfig }))
      }
      updateInitialDeckState?.(addedCutoutConfigs)
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

  return createPortal(
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
          <StyledText
            css={GO_BACK_BUTTON_STYLE}
            desktopStyle="bodyDefaultRegular"
          >
            {t('go_back')}
          </StyledText>
        </Btn>
      ) : null}
    </Modal>,
    getMainPagePortalEl()
  )
}

const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.grey50};
  &:hover {
    opacity: 70%;
  }
`
