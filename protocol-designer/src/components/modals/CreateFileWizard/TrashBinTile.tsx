import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  Text,
  SPACING,
  PrimaryButton,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  DeckLocationSelect,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  FLEX_ROBOT_TYPE,
  ModuleLocation,
} from '@opentrons/shared-data'
import { i18n } from '../../../localization'
import { GoBack } from './GoBack'
import { HandleEnter } from './HandleEnter'

import type { WizardTileProps } from './types'

export function TrashBinTile(props: WizardTileProps): JSX.Element {
  const {
    handleChange,
    handleBlur,
    values,
    setFieldValue,
    errors,
    touched,
    setFieldTouched,
    goBack,
    proceed,
  } = props
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const modulesByType = values.modulesByType
  const heaterShakerOnDeck = modulesByType.heaterShakerModuleType.onDeck
    ? { slotName: modulesByType.heaterShakerModuleType.slot }
    : null

  const magneticBlockOnDeck = modulesByType.magneticBlockType.onDeck
    ? { slotName: modulesByType.magneticBlockType.slot }
    : null

  const thermocyclerOnDeck = modulesByType.thermocyclerModuleType.onDeck
    ? { slotName: modulesByType.thermocyclerModuleType.slot }
    : null

  const tempOnDeck = modulesByType.temperatureModuleType.onDeck
    ? { slotName: modulesByType.temperatureModuleType.slot }
    : null

  const additionalEquipment = values.additionalEquipment

  const wasteChute = additionalEquipment.some(aE => aE === 'wasteChute')
    ? { slotName: 'D3' }
    : null

  const onDeckEquipment: ModuleLocation[] = [
    heaterShakerOnDeck,
    magneticBlockOnDeck,
    thermocyclerOnDeck,
    tempOnDeck,
    wasteChute,
  ].filter(value => value !== null) as ModuleLocation[]

  const notAllowedSlots: ModuleLocation[] = [
    { slotName: 'D2' },
    { slotName: 'C2' },
    { slotName: 'B2' },
    { slotName: 'A2' },
  ]
  const [slotName, setSlotName] = React.useState('A3')
  return (
    <HandleEnter onEnter={proceed}>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        <Text as="h2">{i18n.t('modal.create_file_wizard.select_trash')}</Text>
        <Flex marginTop="-2rem" width="80%" alignSelf="center">
          <DeckLocationSelect
            deckDef={deckDef}
            selectedLocation={{ slotName }}
            setSelectedLocation={loc => setSlotName(loc.slotName)}
            disabledLocations={
              thermocyclerOnDeck != null
                ? [...onDeckEquipment, ...notAllowedSlots, { slotName: 'A1' }]
                : [...onDeckEquipment, ...notAllowedSlots]
            }
          />
        </Flex>
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          width="100%"
        >
          <GoBack onClick={() => goBack()} />
          <PrimaryButton onClick={() => proceed()}>
            {i18n.t('modal.create_file_wizard.review_file_details')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </HandleEnter>
  )
}
