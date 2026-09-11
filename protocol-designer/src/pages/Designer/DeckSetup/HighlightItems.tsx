import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  FLEX_STACKER_MODULE_TYPE,
  getAddressableAreaFromSlotId,
  getPositionFromAddressableAreaId,
  getPositionFromSlotId,
  inferModuleOrientationFromXCoordinate,
  STANDARD_FLEX_SLOTS,
  STANDARD_OT2_SLOTS,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import {
  getIsSlotAVacuumDock,
  getSlotInLocationStack,
  VACUUM_DOCK_ADDRESSABLE_AREA,
} from '@opentrons/step-generation'

import {
  FLEX_STACKER_IN_HOPPER_ACTIONS,
  HOPPER_LABWARE_X_OFFSET,
} from '/protocol-designer/constants'
import { getDeckConfiguration } from '/protocol-designer/step-forms/selectors'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getLabwaresOnModuleFromStack } from '/protocol-designer/utils'

import {
  getHoveredDropdownItem,
  getSelectedDropdownItem,
} from '../../../ui/steps/selectors'
import { LabwareLabel } from '../LabwareLabel'
import { DeckItemHighlight } from './DeckItemHighlight'
import { FixtureRender } from './FixtureRender'
import { ModuleLabel } from './ModuleLabel'
import { getHighlightLabwareAndModules } from './utils'

import type {
  AddressableAreaName,
  CoordinateTuple,
  CutoutId,
  DeckDefinition,
  RobotType,
} from '@opentrons/shared-data'
import type { AdditionalEquipmentName } from '@opentrons/step-generation'
import type {
  FlexStackerFormType,
  FormData,
} from '/protocol-designer/form-types'
import type { Fixture } from './constants'

interface HighlightItemsProps {
  deckDef: DeckDefinition
  robotType: RobotType
  currentStep: FormData | null
}
//  TODO(ja, 1/13/25): get actual coordinates from thermocycler and deck definitions
const FLEX_TC_POSITION: CoordinateTuple = [-20, 282, 0]
const OT2_TC_GEN_1_POSITION: CoordinateTuple = [0, 264, 0]
const OT2_TC_GEN_2_POSITION: CoordinateTuple = [0, 250, 0]

const SLOTS = [
  ...STANDARD_FLEX_SLOTS,
  ...STANDARD_OT2_SLOTS,
  'A4',
  'B4',
  'C4',
  'D4',
  'cutoutD3',
  VACUUM_DOCK_ADDRESSABLE_AREA,
]

export function HighlightItems(props: HighlightItemsProps): JSX.Element | null {
  const { robotType, deckDef, currentStep } = props
  const { t } = useTranslation('application')
  const { labware, modules, additionalEquipmentOnDeck } = useSelector(
    getDeckSetupForActiveItem
  )
  const hoveredItem = useSelector(getHoveredDropdownItem)
  const selectedDropdownItems = useSelector(getSelectedDropdownItem)
  const { deckConfig } = useSelector(getDeckConfiguration)

  if (
    hoveredItem == null &&
    (selectedDropdownItems == null || selectedDropdownItems.length === 0)
  ) {
    return null
  }

  const highlightItems = getHighlightLabwareAndModules(
    hoveredItem,
    selectedDropdownItems,
    labware,
    modules
  )
  const hoveredItemTrash: {
    name: AdditionalEquipmentName
    id: string
    location?: string | undefined
  } | null =
    hoveredItem?.id != null
      ? (Object.values(additionalEquipmentOnDeck).find(
          ae => ae.location === hoveredItem.id
        ) ?? null)
      : null

  const selectedItemTrash = selectedDropdownItems.find(
    selected =>
      selected.id != null &&
      Object.values(additionalEquipmentOnDeck).find(
        ae => ae.location === selected.id
      ) != null
  )

  const hoveredDeckItem: string | null =
    hoveredItem?.id != null &&
    SLOTS.includes(hoveredItem.id as AddressableAreaName)
      ? hoveredItem.id
      : null
  const selectedItemSlot = selectedDropdownItems.find(
    selected =>
      selected.id != null && SLOTS.includes(selected.id as AddressableAreaName)
  )

  const labwareItems = highlightItems.highlightLabwareItems.reduce<
    JSX.Element[]
  >((acc, { labware: labwareOnDeck, selection, isSelected = false }, index) => {
    const { text } = selection
    if (!labwareOnDeck) {
      console.warn(
        `labwareOnDeck was null as ${labwareOnDeck}, expected to find a matching entity`
      )
      return acc
    }
    const labwareSlot = getSlotInLocationStack(labwareOnDeck.stack)
    const labwareIdsFromFullStack =
      labwareOnDeck.stack?.filter(id => labware[id] != null) ?? []
    const tcModel = Object.values(modules).find(
      module => module.type === THERMOCYCLER_MODULE_TYPE
    )?.model
    const position = getIsSlotAVacuumDock(labwareSlot)
      ? getPositionFromAddressableAreaId({
          addressableAreaId: VACUUM_DOCK_ADDRESSABLE_AREA,
          deckDef,
          deckConfiguration: deckConfig,
        })
      : getPositionFromSlotId(labwareSlot, deckDef)
    if (position != null) {
      let tcPosition: CoordinateTuple = FLEX_TC_POSITION
      if (labwareSlot === '7') {
        tcPosition =
          tcModel === THERMOCYCLER_MODULE_V2
            ? OT2_TC_GEN_2_POSITION
            : OT2_TC_GEN_1_POSITION
      }

      return [
        ...acc,
        <LabwareLabel
          key={labwareOnDeck.id}
          isSelected={isSelected}
          isLast
          showModuleIcon={labwareIdsFromFullStack.length > 1}
          position={
            tcModel != null && (labwareSlot === '7' || labwareSlot === 'B1')
              ? tcPosition
              : position
          }
          labwareDef={labwareOnDeck.def}
          labelText={text ?? ''}
        />,
      ]
    }
    return acc
  }, [])

  const moduleItems = highlightItems.highlightModuleItems.reduce<JSX.Element[]>(
    (acc, { module: moduleOnDeck, selection, isSelected = false }) => {
      let text = ''

      if (moduleOnDeck == null) {
        return acc
      }
      const { topMostId, rightBelowTopId } = getLabwaresOnModuleFromStack(
        moduleOnDeck.id,
        Object.values(labware)
      )
      const isStacker = moduleOnDeck.type === FLEX_STACKER_MODULE_TYPE

      const stepType: FlexStackerFormType | null =
        currentStep?.flexStackerFormType ?? null
      if (stepType != null) {
        text = stepType.charAt(0).toUpperCase() + stepType.slice(1)
      } else {
        text = selection.text ?? ''
      }
      const onHopperActions =
        stepType != null &&
        (FLEX_STACKER_IN_HOPPER_ACTIONS as string[]).includes(stepType)
      const isActionOnShuttle = isStacker && !onHopperActions

      const position = getPositionFromSlotId(
        moduleOnDeck.slot,
        deckDef,
        ...(isStacker && !isActionOnShuttle ? [HOPPER_LABWARE_X_OFFSET] : [])
      )
      if (position != null) {
        return [
          ...acc,
          <ModuleLabel
            key={`module_${moduleOnDeck.id}`}
            isLast
            isSelected={isSelected}
            moduleModel={moduleOnDeck.model}
            position={position}
            orientation={inferModuleOrientationFromXCoordinate(position[0])}
            isZoomed={false}
            labelName={text ?? ''}
            slot={moduleOnDeck.slot}
            showModuleIcon={topMostId != null && rightBelowTopId != null}
          />,
        ]
      }
      return acc
    },
    []
  )

  const getTrashItems = (): JSX.Element[] => {
    const items: JSX.Element[] = []

    if (hoveredItemTrash != null || selectedItemTrash != null) {
      const selectedTrashOnDeck =
        selectedItemTrash?.id != null
          ? (Object.values(additionalEquipmentOnDeck).find(
              e => e.location === selectedItemTrash.id
            ) ?? null)
          : null
      const trashOnDeck = hoveredItemTrash ?? selectedTrashOnDeck

      if (!trashOnDeck) {
        console.warn(
          `trashOnDeck was null as ${trashOnDeck}, expected to find a matching entity`
        )
        return []
      }

      if (hoveredItemTrash != null) {
        items.push(
          <FixtureRender
            key={`${hoveredItemTrash.id}_hovered`}
            fixture={hoveredItemTrash.name as Fixture}
            cutout={hoveredItemTrash.location as CutoutId}
            robotType={robotType}
            deckDef={deckDef}
            showHighlight={true}
            tagInfo={[
              {
                text: hoveredItem.text ?? '',
                isSelected: false,
                isLast: true,
                isZoomed: false,
              },
            ]}
          />
        )
      }

      if (selectedTrashOnDeck != null && selectedItemTrash != null) {
        items.push(
          <FixtureRender
            key={`${selectedTrashOnDeck.id}_selected`}
            fixture={selectedTrashOnDeck.name as Fixture}
            cutout={selectedTrashOnDeck.location as CutoutId}
            robotType={robotType}
            deckDef={deckDef}
            showHighlight={true}
            tagInfo={[
              {
                text: selectedItemTrash.text ?? '',
                isSelected: true,
                isLast: true,
                isZoomed: false,
              },
            ]}
          />
        )
      }
    }

    return items
  }
  const getDeckItems = (): JSX.Element[] => {
    const items: JSX.Element[] = []

    const slot = hoveredDeckItem ?? selectedItemSlot?.id
    if (!slot) return items

    const hasTrashContext =
      hoveredItemTrash != null || selectedItemTrash != null

    if (hasTrashContext && slot === WASTE_CHUTE_CUTOUT) {
      items.push(
        <FixtureRender
          key={`${slot}_wasteChute_selected`}
          fixture={'wasteChute' as Fixture}
          cutout={WASTE_CHUTE_CUTOUT as CutoutId}
          robotType={robotType}
          deckDef={deckDef}
          showHighlight={true}
          tagInfo={[
            {
              text: t('new_location'),
              isSelected: selectedItemSlot?.id != null,
              isLast: true,
              isZoomed: false,
            },
          ]}
        />
      )
      return items
    }

    if (slot !== WASTE_CHUTE_CUTOUT) {
      const addressableArea = getAddressableAreaFromSlotId(slot, deckDef)

      if (!addressableArea) {
        console.warn(
          `addressableArea was null for slot ${slot}, expected to find a matching entity`
        )
        return items
      }

      const slotPosition = getIsSlotAVacuumDock(addressableArea.id)
        ? getPositionFromAddressableAreaId({
            addressableAreaId: VACUUM_DOCK_ADDRESSABLE_AREA,
            deckDef,
            deckConfiguration: deckConfig,
          })
        : getPositionFromSlotId(addressableArea.id, deckDef)

      items.push(
        <DeckItemHighlight
          slotBoundingBox={addressableArea.boundingBox}
          slotPosition={slotPosition}
          itemId={addressableArea.id}
        />
      )
    }

    return items
  }

  const renderItems = (): JSX.Element[] => {
    return [
      ...labwareItems,
      ...moduleItems,
      ...getTrashItems(),
      ...getDeckItems(),
    ]
  }

  return <>{renderItems()}</>
}
