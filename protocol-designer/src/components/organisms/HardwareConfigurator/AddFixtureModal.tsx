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
  ABSORBANCE_READER_V1,
  FIXTURES_FIXTURE_IDS,
  FLEX_ROBOT_TYPE,
  getAADisplayName,
  getComboFixtureFromFixtureIds,
  getCutoutFixturesForModuleModel,
  getDeckDefFromRobotType,
  getFixtureDisplayName,
  getMainFixtureIdForAA,
  getModuleModelFromFixtureId,
  getModuleType,
  getSlotDisplayNameFromAAWithFakes,
  getWasteChuteOptions,
  replaceCutoutFixtureWithComboFixture,
  replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA,
  SINGLE_CENTER_CUTOUTS,
  THERMOCYCLER_MODULE_CUTOUTS,
  THERMOCYCLER_MODULE_V2,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { getSlotInLocationStack, uuid } from '@opentrons/step-generation'

import { editDeckConfiguration } from '/protocol-designer/step-forms/actions'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import { mapFixtureIdToFixtureName } from '../FlexHardware/util'
import { useKitchen } from '../Kitchen/useKitchen'
import { getMainPagePortalEl } from '../Portal'
import { getLabwareCompatibleForEditHardware } from '../utils'
import {
  getAllFixtureOptions,
  getAvailableOptions,
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
import type { FixtureName, Fixtures, WizardFormState } from '../types'

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
  'modulesOrFixtures' | 'fixtureOptions' | 'moduleOptions' | 'wasteChuteOptions'

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
  useEffect(
    () => {
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
        ...getModuleOptions(cutoutId, addressableAreaId, deckDef, fixtures),
      ]
      setAllModuleOptions(moduleOptions)
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cutoutId, addressableAreaId, existingCutoutFixtureId]
  )

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

  const validateAddedConfigs = (
    addedCutoutConfigs: CutoutConfigMap[]
  ): string | null => {
    //  only allow 1 trashBin
    if (
      addedCutoutConfigs.some(
        cutoutConfig =>
          TRASH_BIN_ADAPTER_FIXTURE === cutoutConfig.cutoutFixtureId
      ) &&
      Object.values(fixtures).some(fixture => fixture.name === 'trashBin')
    ) {
      return t('only_one_trash') as string
    }
    //  only allow absorbance reader if gripper is attached
    if (
      !hasGripper &&
      addedCutoutConfigs.some(cutoutConfig =>
        getCutoutFixturesForModuleModel(ABSORBANCE_READER_V1, deckDef)
          .map(cf => cf.id)
          .includes(cutoutConfig.cutoutFixtureId as CutoutFixtureId)
      )
    ) {
      return t('add_gripper_for_plate') as string
    }
    //  block thermocycler from being added if there is something in slot A1
    if (
      addedCutoutConfigs.some(cutoutConfig =>
        getCutoutFixturesForModuleModel(THERMOCYCLER_MODULE_V2, deckDef)
          .map(cf => cf.id)
          .includes(cutoutConfig.cutoutFixtureId as CutoutFixtureId)
      ) &&
      (Object.values(modules).some(
        module =>
          THERMOCYCLER_MODULE_CUTOUTS.includes(module.cutoutId as CutoutId) ||
          Object.values(fixtures).some(fixture =>
            THERMOCYCLER_MODULE_CUTOUTS.includes(fixture.cutoutId as CutoutId)
          )
      ) ||
        Object.values(labware).some(lw =>
          THERMOCYCLER_MODULE_CUTOUTS.includes(
            getSlotInLocationStack(lw.stack) as CutoutId
          )
        ))
    ) {
      return t('thermocycler_blocked') as string
    }
    return null
  }

  const handleAddModule = (newModule: CutoutConfigMap): void => {
    const moduleModel = getModuleModelFromFixtureId(
      newModule.cutoutFixtureId as CutoutFixtureId
    )
    if (moduleModel == null) return

    // Get the first existing module in this cutout (if any) before filtering
    const matchedModuleEntry = Object.entries(modules).find(
      ([, module]) => module.cutoutId === newModule.cutoutId
    )
    const module =
      matchedModuleEntry != null ? matchedModuleEntry[1] : undefined
    const moduleFixtureId =
      module != null
        ? getCutoutFixturesForModuleModel(
            module.model as ModuleModel,
            deckDef
          )[0].id
        : undefined

    const matchedModule =
      matchedModuleEntry != null
        ? getCutoutFixturesForModuleModel(
            matchedModuleEntry[1].model as ModuleModel,
            deckDef
          )[0]
        : undefined

    // Remove all existing modules in this cutout (handles duplicates)
    const filteredModules = Object.fromEntries(
      Object.entries(modules).filter(
        ([, module]) => module.cutoutId !== newModule.cutoutId
      )
    )

    const matchedComboFixtureId =
      matchedModule != null
        ? getComboFixtureFromFixtureIds([
            moduleFixtureId!,
            newModule.cutoutFixtureId as CutoutFixtureId,
          ])
        : undefined

    const isThermocyclerModule = getCutoutFixturesForModuleModel(
      THERMOCYCLER_MODULE_V2,
      deckDef
    )
      .map(cf => cf.id)
      .includes(newModule.cutoutFixtureId as CutoutFixtureId)

    const updatedModules: FormModules = {
      ...filteredModules,
      ...(matchedModule != null &&
      matchedComboFixtureId != null &&
      matchedModuleEntry != null
        ? { [matchedModuleEntry[0]]: matchedModuleEntry[1] }
        : {}),
      [uuid()]: {
        model: moduleModel,
        type: getModuleType(moduleModel as ModuleModel),
        slot: isThermocyclerModule
          ? 'B1'
          : getSlotDisplayNameFromAAWithFakes(
              newModule.addressableAreaId as AddressableAreaName
            ),
        cutoutFixtureId: newModule.cutoutFixtureId as FlexModuleCutoutFixtureId,
        cutoutId: isThermocyclerModule ? 'cutoutB1' : newModule.cutoutId,
      },
    }
    setValue?.('modules', updatedModules)
  }

  const handleAddNewFixture = (newFixture: CutoutConfigMap): void => {
    // Get the first existing fixture in this cutout (if any)
    const matchedEntry = Object.entries(fixtures).find(
      ([, fixture]) => fixture.cutoutId === newFixture.cutoutId
    )
    const matchedFixture = matchedEntry != null ? matchedEntry[1] : undefined

    const matchedComboFixtureId = getComboFixtureFromFixtureIds([
      matchedFixture?.cutoutFixtureId! ?? '',
      newFixture.cutoutFixtureId as CutoutFixtureId,
    ])
    const filteredFixtures = Object.fromEntries(
      Object.entries(fixtures).filter(
        ([, fixture]) => fixture.cutoutId !== newFixture.cutoutId
      )
    )
    const fixtureName = getMainFixtureIdForAA(
      [newFixture.cutoutFixtureId as CutoutFixtureId],
      [newFixture.addressableAreaId as AddressableAreaName],
      newFixture.cutoutId
    )

    const updatedFixtures: Fixtures = {
      ...filteredFixtures,
      ...(matchedFixture != null && matchedComboFixtureId != null
        ? { [matchedComboFixtureId]: matchedFixture }
        : {}),
      [uuid()]: {
        name:
          (mapFixtureIdToFixtureName(fixtureName) as FixtureName) ??
          'stagingArea',
        cutoutFixtureId: newFixture.cutoutFixtureId as CutoutFixtureId,
        cutoutId: newFixture.cutoutId,
      },
    }
    setValue?.('fixtures', updatedFixtures)
  }

  const handleAddFixture = (addedCutoutConfigs: CutoutConfigMap[]): void => {
    const validationError = validateAddedConfigs(addedCutoutConfigs)
    if (validationError != null) {
      makeSnackbar(validationError)
      return
    }

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

    // Find and handle new module
    const newModule = addedCutoutConfigs.find(
      cutoutConfig =>
        getModuleModelFromFixtureId(
          cutoutConfig.cutoutFixtureId as CutoutFixtureId
        ) !== null
    )
    if (newModule != null) {
      handleAddModule(newModule)
    }

    // Find and handle new fixture
    const newFixture = addedCutoutConfigs.find(cutoutConfig =>
      FIXTURES_FIXTURE_IDS.includes(
        cutoutConfig.cutoutFixtureId as CutoutFixtureId
      )
    )
    if (newFixture != null) {
      handleAddNewFixture(newFixture)
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
