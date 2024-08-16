import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
  Tabs,
  Toolbox,
} from '@opentrons/components'
import {
  OT2_ROBOT_TYPE,
  WASTE_CHUTE_CUTOUT,
  getModuleDisplayName,
  getModuleType,
} from '@opentrons/shared-data'
import { getRobotType } from '../../file-data/selectors'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '../../step-forms/actions/additionalItems'
import { createModule, deleteModule } from '../../step-forms/actions'
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations'
import { createContainer, deleteContainer } from '../../labware-ingred/actions'
import { getEnableAbsorbanceReader } from '../../feature-flags/selectors'
import { FIXTURES } from './constants'
import { getModuleModelsBySlot } from './utils'
import { LabwareTools } from './LabwareTools'

import type { DeckSlotId, ModuleModel } from '@opentrons/shared-data'
import type { Fixture } from './constants'

import type { ThunkDispatch } from '../../types'

interface DeckSetupToolsProps {
  slot: DeckSlotId
  onCloseClick: () => void
}

export const DeckSetupTools = (props: DeckSetupToolsProps): JSX.Element => {
  const { slot, onCloseClick } = props
  const { t } = useTranslation(['starting_deck_state', 'shared'])
  const robotType = useSelector(getRobotType)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const enableAbsorbanceReader = useSelector(getEnableAbsorbanceReader)
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const {
    labware: deckSetupLabware,
    modules: deckSetupModules,
    additionalEquipmentOnDeck,
  } = deckSetup
  const createdModuleForSlot = Object.values(deckSetupModules).find(
    module => module.slot === slot
  )
  const createdParentLabwareForSlot = Object.values(deckSetupLabware).find(
    lw => lw.slot === slot || lw.slot === createdModuleForSlot?.id
  )
  const createdChildLabwareForSlot = Object.values(deckSetupLabware).find(lw =>
    Object.keys(deckSetupLabware).includes(lw.slot)
  )
  const createFixtureForSlot = Object.values(additionalEquipmentOnDeck).find(
    ae => ae.location?.split('cutout')[1] === slot
  )

  const [selectedHardware, setHardware] = React.useState<
    ModuleModel | Fixture | null
  >(null)
  const [selecteLabwareDefURI, setSelectedLabwareDefURI] = React.useState<
    string | null
  >(null)
  const [
    nestedSelectedLabwareDefURI,
    setNestedSelectedLabwareDefURI,
  ] = React.useState<string | null>(null)
  const moduleModels = getModuleModelsBySlot(
    enableAbsorbanceReader,
    robotType,
    slot
  )
  const [tab, setTab] = React.useState<'hardware' | 'labware'>(
    moduleModels.length === 0 ? 'labware' : 'hardware'
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

  //   TODO - this needs to be a thunk so we can grab the state for the slot Ids
  //   that are the module id or adapter id
  const handleConfirm = (): void => {
    if (selectedHardware != null) {
      if (FIXTURES.includes(selectedHardware as Fixture)) {
        if (selectedHardware === 'wasteChuteAndStagingArea') {
          dispatch(createDeckFixture('wasteChute', WASTE_CHUTE_CUTOUT))
          dispatch(createDeckFixture('stagingArea', 'cutoutD3'))
        } else {
          dispatch(
            createDeckFixture(
              selectedHardware as 'wasteChute' | 'trashBin' | 'stagingArea',
              slot
            )
          )
        }
      } else {
        dispatch(
          createModule({
            slot: slot,
            type: getModuleType(selectedHardware as ModuleModel),
            model: selectedHardware as ModuleModel,
          })
        )
      }
    }
    if (selecteLabwareDefURI != null) {
      const parentLabwareSlot =
        createdModuleForSlot != null ? createdModuleForSlot.slot : slot
      dispatch(
        createContainer({
          slot: parentLabwareSlot,
          labwareDefURI: selecteLabwareDefURI,
        })
      )
    }
    if (nestedSelectedLabwareDefURI != null) {
      dispatch(
        createContainer({
          slot: slot,
          labwareDefURI: nestedSelectedLabwareDefURI,
        })
      )
    }
    onCloseClick()
  }

  const handleClear = (): void => {
    if (createdModuleForSlot != null) {
      dispatch(deleteModule(createdModuleForSlot.id))
    }
    if (createFixtureForSlot != null) {
      dispatch(deleteDeckFixture(createFixtureForSlot.id))
    }
    if (createdParentLabwareForSlot != null) {
      dispatch(deleteContainer({ labwareId: createdParentLabwareForSlot.id }))
    }
    if (createdChildLabwareForSlot != null) {
      dispatch(deleteContainer({ labwareId: createdChildLabwareForSlot.id }))
    }
    setHardware(null)
    setSelectedLabwareDefURI(null)
    setNestedSelectedLabwareDefURI(null)
  }

  return (
    <Toolbox
      width="400px"
      title={t('customize_slot', { slotName: slot })}
      closeButtonText={t('clear')}
      onCloseClick={handleClear}
      onConfirmClick={handleConfirm}
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
              {moduleModels.map(model => (
                <RadioButton
                  buttonLabel={getModuleDisplayName(model)}
                  key={`${model}_${slot}`}
                  buttonValue={model}
                  onChange={() => {
                    setHardware(model)
                    setSelectedLabwareDefURI(null)
                  }}
                  isSelected={model === selectedHardware}
                />
              ))}
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
                    buttonLabel={t(`shared:${fixture}`)}
                    key={`${fixture}_${slot}`}
                    buttonValue={fixture}
                    onChange={() => {
                      setHardware(fixture)
                      setSelectedLabwareDefURI(null)
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
