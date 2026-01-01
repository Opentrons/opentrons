import { useEffect, useState } from 'react'
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
  ABSORBANCE_READER_ADDRESSABLE_AREAS,
  FLEX_ROBOT_TYPE,
  FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
  getAADisplayName,
  getDeckDefFromRobotType,
  getFixtureDisplayName,
  getModuleType,
  getSlotFromAddressableAreaName,
  getWasteChuteOptions,
  MODULE_MODELS,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  replaceCutoutFixtureWithComboFixture,
  replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA,
  SINGLE_CENTER_CUTOUTS,
  THERMOCYCLER_ADDRESSABLE_AREA,
  WASTE_CHUTE_ADDRESSABLE_AREAS,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { getSlotInLocationStack, uuid } from '@opentrons/step-generation'

import { getEnableStacking } from '/protocol-designer/feature-flags/selectors'
import { editDeckConfiguration } from '/protocol-designer/step-forms/actions'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import { useKitchen } from '../Kitchen/useKitchen'
import { getMainPagePortalEl } from '../Portal'
import { getLabwareCompatibleForEditHardware } from '../utils'
import {
  getAllFixtureOptions,
  getAvailableOptions,
  getFixtureNameFromAddresableArea,
  getModuleModel,
  getModuleOptions,
} from './utils'

import type { TFunction } from 'i18next'
import type { UseFormSetValue } from 'react-hook-form'
import type { ModalProps } from '@opentrons/components'
import type {
  AddressableAreaName,
  AddressableAreaNamesWithFakes,
  CutoutConfig,
  CutoutConfigMap,
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
  FlexModuleCutoutFixtureId,
  ModuleModel,
} from '@opentrons/shared-data'
import type { FormModules, ModuleOnDeck } from '/protocol-designer/step-forms'
import type { Fixtures, WizardFormState } from '../types'

const ADDRESSABLE_AREA_D3 = 'D3'
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
  addressableAreaId: AddressableAreaNamesWithFakes
  //  used for setting the value in react-hook-form for the onboarding flow
  setValue?: UseFormSetValue<WizardFormState>
  //  used for updating the initialDeckState in redux in overview and
  //  starting deck state
  updateInitialDeckState?: (value: CutoutConfigMap[]) => void
  existingCutoutFixtureId?: CutoutFixtureId
}
export type OptionStage =
  | 'modulesOrFixtures'
  | 'fixtureOptions'
  | 'moduleOptions'
  | 'wasteChuteOptions'

const FIXTURE_ADDRESSABLE_AREAS = [
  ...WASTE_CHUTE_ADDRESSABLE_AREAS,
  ...MOVABLE_TRASH_ADDRESSABLE_AREAS,
  ...FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
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
    addressableAreaId,
    existingCutoutFixtureId,
  } = props
  const { t, i18n } = useTranslation('shared')
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const enableStackerFF = useSelector(getEnableStacking)
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const { labware } = initialDeckSetup
  const dispatch = useDispatch()
  const { makeSnackbar } = useKitchen()
  const initialStage: OptionStage = SINGLE_CENTER_CUTOUTS.includes(cutoutId) // only magnetic block can be configured in column 2
    ? 'moduleOptions'
    : 'modulesOrFixtures'
  const [optionStage, setOptionStage] = useState<OptionStage>(initialStage)
  const deckConfigWithAA =
    replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA(deckConfig)
  // Bind allFixtureOptions with useEffect
  const [allFixtureOptions, setAllFixtureOptions] = useState<
    CutoutConfigMap[][]
  >([])
  const [allModuleOptions, setAllModuleOptions] = useState<CutoutConfigMap[][]>(
    []
  )
  useEffect(() => {
    const options = [
      ...getAllFixtureOptions(
        cutoutId,
        addressableAreaId,
        fixtures,
        existingCutoutFixtureId
      ),
      ...getWasteChuteOptions(cutoutId),
    ]
    setAllFixtureOptions(options)
    const moduleOptions = [
      ...getModuleOptions(
        cutoutId,
        addressableAreaId,
        deckDef,
        enableStackerFF,
        fixtures
      ),
    ]
    setAllModuleOptions(moduleOptions)
  }, [cutoutId, addressableAreaId, existingCutoutFixtureId])

  const modalProps: ModalProps = {
    title: t('add_to_slot', {
      slotName: getAADisplayName(addressableAreaId),
    }),
    onClose: closeModal,
    closeOnOutsideClick: true,
    childrenPadding: SPACING.spacing24,
    width: '28.75rem',
  }

  const availableOptions = getAvailableOptions({
    optionStage,
    cutoutId,
    deckDefinition: deckDef,
    addressableAreaId,
    enableStackerFF,
    fixtures,
  })

  let nextStageOptions = null
  if (optionStage === 'modulesOrFixtures') {
    nextStageOptions = (
      <>
        {SINGLE_CENTER_CUTOUTS.includes(cutoutId) ||
        allFixtureOptions.length === 0 ? null : (
          <FixtureOption
            key="fixturesOption"
            optionName="Fixtures"
            buttonText={t('select_options')}
            onClickHandler={() => {
              setOptionStage('fixtureOptions')
            }}
          />
        )}
        {allModuleOptions.length > 0 && (
          <FixtureOption
            key="modulesOption"
            optionName="Modules"
            buttonText={t('select_options')}
            onClickHandler={() => {
              setOptionStage('moduleOptions')
            }}
          />
        )}
      </>
    )
  } else if (
    optionStage === 'fixtureOptions' &&
    cutoutId === WASTE_CHUTE_CUTOUT &&
    addressableAreaId === ADDRESSABLE_AREA_D3
  ) {
    nextStageOptions = (
      <FixtureOption
        key="wasteChuteOption"
        optionName="Waste chute"
        buttonText={t('select_options')}
        onClickHandler={() => {
          setOptionStage('wasteChuteOptions')
        }}
      />
    )
  }

  const handleAddFixture = (addedCutoutConfigs: CutoutConfigMap[]): void => {
    //  only allow 1 trashBin
    if (
      addedCutoutConfigs.some(cutoutConfig =>
        MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(
          cutoutConfig.addressableAreaId as AddressableAreaName
        )
      ) &&
      Object.values(fixtures).some(fixture => fixture.name === 'trashBin')
    ) {
      makeSnackbar(t('only_one_trash') as string)
      //  only allow absorbance reader if gripper is attached
    } else if (
      !hasGripper &&
      addedCutoutConfigs.some(cutoutConfig =>
        ABSORBANCE_READER_ADDRESSABLE_AREAS.includes(
          cutoutConfig.addressableAreaId as AddressableAreaName
        )
      )
    ) {
      makeSnackbar(t('add_gripper_for_plate') as string)
      //  block thermocycler from being added if there is something in slot A1
    } else if (
      addedCutoutConfigs.some(
        cutoutConfig =>
          THERMOCYCLER_ADDRESSABLE_AREA === cutoutConfig.addressableAreaId
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
      })
      const newModule = addedCutoutConfigs.find(cutoutConfig =>
        MODULE_MODELS.includes(cutoutConfig.cutoutFixtureId as ModuleModel)
      )
      const newFixture = addedCutoutConfigs.find(cutoutConfig =>
        FIXTURE_ADDRESSABLE_AREAS.includes(
          cutoutConfig.addressableAreaId as AddressableAreaName
        )
      )

      const moduleModel =
        newModule != null
          ? getModuleModel(newModule.addressableAreaId as AddressableAreaName)
          : null

      if (newModule != null && moduleModel != null) {
        const filteredModules = Object.fromEntries(
          Object.entries(modules).filter(
            ([, module]) => module.cutoutId !== newModule.cutoutId
          )
        )
        const updatedModules: FormModules = {
          ...filteredModules,
          [uuid()]: {
            model: moduleModel,
            type: getModuleType(moduleModel as ModuleModel),
            slot:
              newModule.addressableAreaId === THERMOCYCLER_ADDRESSABLE_AREA
                ? 'B1'
                : getSlotFromAddressableAreaName(
                    newModule.addressableAreaId as AddressableAreaName
                  ),
            cutoutFixtureId:
              newModule.cutoutFixtureId as FlexModuleCutoutFixtureId,
            cutoutId: newModule.cutoutId,
          },
        }
        setValue?.('modules', updatedModules)
      }
      if (newFixture != null) {
        const filteredFixtures = Object.fromEntries(
          Object.entries(fixtures).filter(
            ([, fixture]) => fixture.cutoutId !== newFixture.cutoutId
          )
        )

        let additionalFixture: Fixtures | undefined
        const name = getFixtureNameFromAddresableArea(
          newFixture.addressableAreaId as AddressableAreaName
        )

        const updatedFixtures: Fixtures = {
          ...filteredFixtures,
          [uuid()]: {
            name: name ?? 'stagingArea',
            cutoutFixtureId: newFixture.cutoutFixtureId as CutoutFixtureId,
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
        optionName={getFixtureDisplayName(
          t as TFunction,
          cutoutConfigs[0].cutoutFixtureId
        )}
        buttonText={i18n.format(t('add'), 'capitalize')}
        onClickHandler={() => {
          handleAddFixture(cutoutConfigs)
        }}
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
