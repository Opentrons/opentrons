import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DeckInfoLabel,
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
  selectFixture,
  selectLabwareDefUri,
  selectModule,
  selectPreselectedSlotInfo,
  selectZoomedInSlot,
} from '../../../labware-ingred/actions'
import {
  getEnableAbsorbanceReader,
  getEnableMoam,
} from '../../../feature-flags/selectors'
import { selectors } from '../../../labware-ingred/selectors'
import { useKitchen } from '../../../organisms/Kitchen/hooks'
import { createContainerAboveModule } from '../../../step-forms/actions/thunks'
import { FIXTURES, MOAM_MODELS, MOAM_MODELS_WITH_FF } from './constants'
import { getSlotInformation } from '../utils'
import { getModuleModelsBySlot, getDeckErrors } from './utils'
import { LabwareTools } from './LabwareTools'

import type { ModuleModel } from '@opentrons/shared-data'
import type { ThunkDispatch } from '../../../types'
import type { Fixture } from './constants'

interface DeckSetupToolsProps {
  onCloseClick: () => void
  setHoveredLabware: (defUri: string | null) => void
  onDeckProps: {
    setHoveredModule: (model: ModuleModel | null) => void
    setHoveredFixture: (fixture: Fixture | null) => void
  } | null
}

const TRASH_TYPES: Fixture[] = [
  'wasteChute',
  'trashBin',
  'wasteChuteAndStagingArea',
]

export function DeckSetupTools(props: DeckSetupToolsProps): JSX.Element | null {
  const { onCloseClick, setHoveredLabware, onDeckProps } = props
  const { t, i18n } = useTranslation(['starting_deck_state', 'shared'])
  const { makeSnackbar } = useKitchen()
  const zoomedInSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const robotType = useSelector(getRobotType)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const enableAbsorbanceReader = useSelector(getEnableAbsorbanceReader)
  const enableMoam = useSelector(getEnableMoam)
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const {
    selectedLabwareDefUri,
    selectedFixture,
    selectedModuleModel,
    zoomedInSlot,
    selectedNestedLabwareDefUri,
  } = zoomedInSlotInfo
  const { slot, cutout } = zoomedInSlot
  const [selectedHardware, setHardware] = React.useState<
    ModuleModel | Fixture | null
  >(null)
  const moduleModels = getModuleModelsBySlot(
    enableAbsorbanceReader,
    robotType,
    slot ?? ''
  )
  const [tab, setTab] = React.useState<'hardware' | 'labware'>(
    moduleModels.length === 0 || slot === 'offDeck' ? 'labware' : 'hardware'
  )

  //  initialize the previously selected hardware
  React.useEffect(() => {
    if (selectedModuleModel || selectedFixture) {
      setHardware(selectedModuleModel ?? selectedFixture ?? null)
    }
  }, [selectedModuleModel, selectedFixture])

  if (slot == null || (onDeckProps == null && slot !== 'offDeck')) {
    return null
  }

  const {
    modules: deckSetupModules,
    additionalEquipmentOnDeck,
    labware: deckSetupLabware,
  } = deckSetup
  const hasTrash = Object.values(additionalEquipmentOnDeck).some(
    ae => ae.name === 'trashBin'
  )
  const trashyEntities = Object.values(additionalEquipmentOnDeck).filter(
    ae => ae.name === 'trashBin' || ae.name === 'wasteChute'
  )

  const {
    createdNestedLabwareForSlot,
    createdModuleForSlot,
    createdLabwareForSlot,
    createFixtureForSlots,
  } = getSlotInformation({ deckSetup, slot })

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
      selectedFixture === 'wasteChute' ||
      selectedFixture === 'wasteChuteAndStagingArea' ||
      selectedFixture === 'trashBin',
    isActive: tab === 'labware',
    onClick: () => {
      setTab('labware')
    },
  }

  const handleResetToolbox = (): void => {
    dispatch(
      selectPreselectedSlotInfo({
        createdNestedLabwareForSlot: null,
        createdLabwareForSlot: null,
        createdModuleForSlot: null,
        preSelectedFixture: null,
      })
    )
  }

  const handleClear = (): void => {
    if (slot !== 'offDeck') {
      //  clear module from slot
      if (createdModuleForSlot != null) {
        dispatch(deleteModule(createdModuleForSlot.id))
      }
      //  clear fixture(s) from slot
      if (createFixtureForSlots != null && createFixtureForSlots.length > 0) {
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
    handleResetToolbox()
    setHardware(null)
  }

  const handleConfirm = (): void => {
    //  clear entities first before recreating them
    handleClear()

    if (selectedFixture != null && cutout != null) {
      //  create fixture(s)
      if (selectedFixture === 'wasteChuteAndStagingArea') {
        dispatch(createDeckFixture('wasteChute', cutout))
        dispatch(createDeckFixture('stagingArea', cutout))
      } else {
        dispatch(createDeckFixture(selectedFixture, cutout))
      }
    }
    if (selectedModuleModel != null) {
      //  create module
      dispatch(
        createModule({
          slot,
          type: getModuleType(selectedModuleModel),
          model: selectedModuleModel,
        })
      )
    }
    if (selectedModuleModel == null && selectedLabwareDefUri != null) {
      //  create adapter + labware on deck
      dispatch(
        createContainer({
          slot,
          labwareDefURI:
            selectedNestedLabwareDefUri == null
              ? selectedLabwareDefUri
              : selectedNestedLabwareDefUri,
          adapterUnderLabwareDefURI:
            selectedNestedLabwareDefUri == null
              ? undefined
              : selectedLabwareDefUri,
        })
      )
    }
    if (selectedModuleModel != null && selectedLabwareDefUri != null) {
      //   create adapter + labware on module
      dispatch(
        createContainerAboveModule({
          slot,
          labwareDefURI: selectedLabwareDefUri,
          nestedLabwareDefURI: selectedNestedLabwareDefUri ?? undefined,
        })
      )
    }
    handleResetToolbox()
    dispatch(selectZoomedInSlot({ slot: null, cutout: null }))
    onCloseClick()
  }

  return (
    <Toolbox
      width="374px"
      title={
        <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
          <DeckInfoLabel
            deckLabel={
              slot === 'offDeck'
                ? i18n.format(t('off_deck_title'), 'upperCase')
                : slot
            }
          />
          <StyledText desktopStyle="bodyLargeSemiBold">
            {t('customize_slot')}
          </StyledText>
        </Flex>
      }
      closeButtonText={t('clear')}
      onCloseClick={() => {
        if (
          trashyEntities.length === 1 &&
          TRASH_TYPES.includes(selectedFixture as Fixture)
        ) {
          makeSnackbar(t('trash_required') as string)
        } else {
          handleClear()
          handleResetToolbox()
        }
      }}
      onConfirmClick={() => {
        handleConfirm()
      }}
      confirmButtonText={t('done')}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        {slot !== 'offDeck' ? <Tabs tabs={[hardwareTab, labwareTab]} /> : null}
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

                const collisionError = getDeckErrors({
                  modules: deckSetupModules,
                  selectedSlot: slot,
                  selectedModel: model,
                  labware: deckSetupLabware,
                  robotType: robotType,
                })

                return (
                  <RadioButton
                    setNoHover={() => {
                      if (onDeckProps?.setHoveredModule != null) {
                        onDeckProps.setHoveredModule(null)
                      }
                    }}
                    setHovered={() => {
                      if (onDeckProps?.setHoveredModule != null) {
                        onDeckProps.setHoveredModule(model)
                      }
                    }}
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
                      } else if (collisionError != null) {
                        makeSnackbar(t(`${collisionError}`) as string)
                      } else if (
                        trashyEntities.length === 1 &&
                        TRASH_TYPES.includes(selectedFixture as Fixture)
                      ) {
                        makeSnackbar(t('trash_required') as string)
                      } else {
                        setHardware(model)
                        dispatch(selectModule({ moduleModel: model }))
                        dispatch(selectLabwareDefUri({ labwareDefUri: null }))
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
                    setNoHover={() => {
                      if (onDeckProps?.setHoveredFixture != null) {
                        onDeckProps.setHoveredFixture(null)
                      }
                    }}
                    setHovered={() => {
                      if (onDeckProps?.setHoveredFixture != null) {
                        onDeckProps.setHoveredFixture(fixture)
                      }
                    }}
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
                      } else if (
                        trashyEntities.length === 1 &&
                        TRASH_TYPES.includes(selectedFixture as Fixture)
                      ) {
                        makeSnackbar(t('trash_required') as string)
                      } else {
                        setHardware(fixture)
                        dispatch(selectFixture({ fixture: fixture }))
                        dispatch(selectLabwareDefUri({ labwareDefUri: null }))
                      }
                    }}
                    isSelected={fixture === selectedHardware}
                  />
                ))}
              </Flex>
            )}
          </>
        ) : (
          <LabwareTools setHoveredLabware={setHoveredLabware} slot={slot} />
        )}
      </Flex>
    </Toolbox>
  )
}
