import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  ModuleIcon,
  RadioButton,
  SPACING,
  StyledText,
  Tabs,
  Toolbox,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  MODULE_MODELS,
  OT2_ROBOT_TYPE,
  getModuleDisplayName,
  getModuleType,
} from '@opentrons/shared-data'

import { getRobotType } from '../../../file-data/selectors'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '../../../step-forms/actions/additionalItems'
import { createModule, deleteModule } from '../../../step-forms/actions'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import {
  createContainer,
  deleteContainer,
} from '../../../labware-ingred/actions'
import {
  getEnableAbsorbanceReader,
  getEnableMoam,
} from '../../../feature-flags/selectors'
import { useKitchen } from '../../../organisms/Kitchen/hooks'
import { createContainerAboveModule } from '../../../step-forms/actions/thunks'
import { FIXTURES, MOAM_MODELS, MOAM_MODELS_WITH_FF } from './constants'
import { getModuleModelsBySlot, getOt2HeaterShakerDeckErrors } from './utils'
import { LabwareTools } from './LabwareTools'

import type { CutoutId, DeckSlotId, ModuleModel } from '@opentrons/shared-data'
import type { DeckFixture } from '../../../step-forms/actions/additionalItems'
import type { ThunkDispatch } from '../../../types'
import type { Fixture } from './constants'

interface DeckSetupToolsProps {
  cutoutId: CutoutId
  slot: DeckSlotId
  onCloseClick: () => void
}

export function DeckSetupTools(props: DeckSetupToolsProps): JSX.Element {
  const { slot, onCloseClick, cutoutId } = props
  const { t } = useTranslation(['starting_deck_state', 'shared'])
  const { makeSnackbar } = useKitchen()
  const robotType = useSelector(getRobotType)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const enableAbsorbanceReader = useSelector(getEnableAbsorbanceReader)
  const enableMoam = useSelector(getEnableMoam)
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const {
    labware: deckSetupLabware,
    modules: deckSetupModules,
    additionalEquipmentOnDeck,
  } = deckSetup
  const hasTrash = Object.values(additionalEquipmentOnDeck).some(
    ae => ae.name === 'trashBin'
  )
  const createdModuleForSlot = Object.values(deckSetupModules).find(
    module => module.slot === slot
  )
  const createdLabwareForSlot = Object.values(deckSetupLabware).find(
    lw => lw.slot === slot || lw.slot === createdModuleForSlot?.id
  )
  const createdNestedLabwareForSlot = Object.values(deckSetupLabware).find(lw =>
    Object.keys(deckSetupLabware).includes(lw.slot)
  )
  const createFixtureForSlots = Object.values(additionalEquipmentOnDeck).filter(
    ae => ae.location?.split('cutout')[1] === slot
  )

  const preSelectedFixture =
    createFixtureForSlots != null && createFixtureForSlots.length === 2
      ? ('wasteChuteAndStagingArea' as Fixture)
      : (createFixtureForSlots[0]?.name as Fixture)

  const [selectedHardware, setHardware] = React.useState<
    ModuleModel | Fixture | null
  >(createdModuleForSlot?.model ?? preSelectedFixture ?? null)

  const [selecteLabwareDefURI, setSelectedLabwareDefURI] = React.useState<
    string | null
  >(createdLabwareForSlot?.labwareDefURI ?? null)
  const [
    nestedSelectedLabwareDefURI,
    setNestedSelectedLabwareDefURI,
  ] = React.useState<string | null>(
    createdNestedLabwareForSlot?.labwareDefURI ?? null
  )
  const moduleModels = getModuleModelsBySlot(
    enableAbsorbanceReader,
    robotType,
    slot
  )

  const [tab, setTab] = React.useState<'hardware' | 'labware'>(
    moduleModels.length === 0 || createdModuleForSlot != null
      ? 'labware'
      : 'hardware'
  )

  let fixtures: Fixture[] = []
  if (slot === 'D3') {
    fixtures = FIXTURES
  } else if (['A3', 'B3', 'C3'].includes(slot)) {
    fixtures = ['stagingArea', 'trashBin']
  } else if (['A1', 'B1', 'C1', 'D1'].includes(slot)) {
    fixtures = ['trashBin']
  }

  const hardwareTab = {
    text: t('deck_hardware'),
    disabled: moduleModels.length === 0,
    isActive: tab === 'hardware',
    onClick: () => {
      setTab('hardware')
    },
  }
  const labwareTab = {
    text: t('labware'),
    disabled:
      selectedHardware === 'wasteChute' ||
      selectedHardware === 'wasteChuteAndStagingArea' ||
      selectedHardware === 'trashBin',
    isActive: tab === 'labware',
    onClick: () => {
      setTab('labware')
    },
  }

  const handleClear = (): void => {
    //  clear module from slot
    if (createdModuleForSlot != null) {
      dispatch(deleteModule(createdModuleForSlot.id))
    }
    //  clear fixture(s) from slot
    if (createFixtureForSlots.length > 0) {
      createFixtureForSlots.forEach(fixture =>
        dispatch(deleteDeckFixture(fixture.id))
      )
    }
    //  clear labware from slot
    if (createdLabwareForSlot != null) {
      dispatch(deleteContainer({ labwareId: createdLabwareForSlot.id }))
    }
    //  clear nested labware from slot
    if (createdNestedLabwareForSlot != null) {
      dispatch(deleteContainer({ labwareId: createdNestedLabwareForSlot.id }))
    }
  }

  const handleConfirm = (): void => {
    //  clear entities first before recreating them
    handleClear()
    const fixture = FIXTURES.includes(selectedHardware as Fixture)
      ? (selectedHardware as DeckFixture | 'wasteChuteAndStagingArea')
      : undefined
    const moduleModel = MODULE_MODELS.includes(selectedHardware as ModuleModel)
      ? (selectedHardware as ModuleModel)
      : undefined

    if (fixture != null) {
      //  create fixture(s)
      if (fixture === 'wasteChuteAndStagingArea') {
        dispatch(createDeckFixture('wasteChute', cutoutId))
        dispatch(createDeckFixture('stagingArea', cutoutId))
      } else {
        dispatch(createDeckFixture(fixture, cutoutId))
      }
    }
    if (moduleModel != null) {
      //  create module
      dispatch(
        createModule({
          slot,
          type: getModuleType(moduleModel),
          model: moduleModel,
        })
      )
    }
    if (moduleModel == null && selecteLabwareDefURI != null) {
      //  create adapter + labware on deck
      dispatch(
        createContainer({
          slot,
          labwareDefURI:
            nestedSelectedLabwareDefURI == null
              ? selecteLabwareDefURI
              : nestedSelectedLabwareDefURI,
          adapterUnderLabwareDefURI:
            nestedSelectedLabwareDefURI == null
              ? undefined
              : selecteLabwareDefURI,
        })
      )
    }
    if (moduleModel != null && selecteLabwareDefURI != null) {
      //   create adapter + labware on module
      dispatch(
        createContainerAboveModule({
          slot,
          labwareDefURI: selecteLabwareDefURI,
          nestedLabwareDefURI: nestedSelectedLabwareDefURI ?? undefined,
        })
      )
    }

    onCloseClick()
  }

  const handleResetToolbox = (): void => {
    setHardware(null)
    setSelectedLabwareDefURI(null)
    setNestedSelectedLabwareDefURI(null)
  }

  return (
    <Toolbox
      width="25rem"
      title={t('customize_slot', { slotName: slot })}
      closeButtonText={t('clear')}
      onCloseClick={() => {
        handleClear()
        handleResetToolbox()
      }}
      onConfirmClick={() => {
        handleConfirm()
      }}
      confirmButtonText={t('done')}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Tabs tabs={[hardwareTab, labwareTab]} />
        {tab === 'hardware' ? (
          <>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing4}
              marginTop={SPACING.spacing16}
            >
              <Flex marginBottom={SPACING.spacing4}>
                <StyledText desktopStyle="bodyDefaultSemiBold">
                  {t('add_module')}
                </StyledText>
              </Flex>
              {moduleModels.map(model => {
                const modelSomewhereOnDeck = Object.values(
                  deckSetupModules
                ).filter(
                  module => module.model === model && module.slot !== slot
                )
                const typeSomewhereOnDeck = Object.values(
                  deckSetupModules
                ).filter(
                  module =>
                    module.type === getModuleType(model) && module.slot !== slot
                )
                const moamModels = enableMoam
                  ? MOAM_MODELS
                  : MOAM_MODELS_WITH_FF

                const ot2CollisionError = getOt2HeaterShakerDeckErrors({
                  modules: deckSetupModules,
                  selectedSlot: slot,
                  selectedModel: model,
                })

                return (
                  <RadioButton
                    largeDesktopBorderRadius
                    buttonLabel={
                      <Flex
                        gridGap={SPACING.spacing4}
                        alignItems={ALIGN_CENTER}
                      >
                        <ModuleIcon
                          size="1rem"
                          moduleType={getModuleType(model)}
                        />
                        <StyledText desktopStyle="bodyDefaultRegular">
                          {getModuleDisplayName(model)}
                        </StyledText>
                      </Flex>
                    }
                    key={`${model}_${slot}`}
                    buttonValue={model}
                    onChange={() => {
                      if (
                        modelSomewhereOnDeck.length === 1 &&
                        !moamModels.includes(model) &&
                        robotType === FLEX_ROBOT_TYPE
                      ) {
                        makeSnackbar(
                          t('one_item', {
                            hardware: getModuleDisplayName(model),
                          }) as string
                        )
                      } else if (
                        typeSomewhereOnDeck.length > 0 &&
                        robotType === OT2_ROBOT_TYPE
                      ) {
                        makeSnackbar(
                          t('one_item', {
                            hardware: t(
                              `shared:${getModuleType(model).toLowerCase()}`
                            ),
                          }) as string
                        )
                      } else if (
                        robotType === OT2_ROBOT_TYPE &&
                        ot2CollisionError != null
                      ) {
                        makeSnackbar(t(`${ot2CollisionError}`) as string)
                      } else {
                        setHardware(model)
                        setSelectedLabwareDefURI(null)
                      }
                    }}
                    isSelected={model === selectedHardware}
                  />
                )
              })}
            </Flex>
            {robotType === OT2_ROBOT_TYPE || fixtures.length === 0 ? null : (
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing4}
                marginTop={SPACING.spacing16}
              >
                <Flex marginBottom={SPACING.spacing4}>
                  <StyledText desktopStyle="bodyDefaultSemiBold">
                    {t('add_fixture')}
                  </StyledText>
                </Flex>
                {fixtures.map(fixture => (
                  <RadioButton
                    largeDesktopBorderRadius
                    buttonLabel={t(`shared:${fixture}`)}
                    key={`${fixture}_${slot}`}
                    buttonValue={fixture}
                    onChange={() => {
                      //    delete this when multiple trash bins are supported
                      if (fixture === 'trashBin' && hasTrash) {
                        makeSnackbar(
                          t('one_item', {
                            hardware: t('shared:trashBin'),
                          }) as string
                        )
                      } else {
                        setHardware(fixture)
                        setSelectedLabwareDefURI(null)
                      }
                    }}
                    isSelected={fixture === selectedHardware}
                  />
                ))}
              </Flex>
            )}
          </>
        ) : (
          <LabwareTools
            selecteLabwareDefURI={selecteLabwareDefURI}
            setSelectedLabwareDefURI={setSelectedLabwareDefURI}
            setNestedSelectedLabwareDefURI={setNestedSelectedLabwareDefURI}
            selectedNestedSelectedLabwareDefURI={nestedSelectedLabwareDefURI}
            slot={slot}
            selectedHardware={selectedHardware}
          />
        )}
      </Flex>
    </Toolbox>
  )
}
