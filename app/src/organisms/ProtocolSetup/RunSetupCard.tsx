import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import reduce from 'lodash/reduce'
import find from 'lodash/find'
import { Card, Text, SPACING_3, FONT_HEADER_DARK } from '@opentrons/components'
import {
  getModuleDef2,
  protocolHasModules,
  SPAN7_8_10_11_SLOT,
  LabwareDefinition2,
  ModuleModel,
  DeckDefinition,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'

import { getProtocolData } from '../../redux/protocol'
import { Divider } from '../../atoms/structure'
import { CollapsibleStep } from './CollapsibleStep'
import { LabwareSetup } from './LabwareSetup'

import type { JsonProtocolFile } from '@opentrons/shared-data'
import type { State } from '../../redux/types'

const ROBOT_CALIBRATION_STEP_KEY = 'robot_calibration_step' as const
const MODULE_SETUP_KEY = 'module_setup_step' as const
const LABWARE_SETUP_KEY = 'labware_setup_step' as const

type StepKey =
  | typeof ROBOT_CALIBRATION_STEP_KEY
  | typeof MODULE_SETUP_KEY
  | typeof LABWARE_SETUP_KEY

export type CoordinatesByModuleModel = Record<
  string,
  { x: number; y: number; moduleModel: ModuleModel }
>
export interface CoordinatesByLabwareId {
  [labwareId: string]: {
    x: number
    y: number
    matingSurfaceVector?: [number, number, number]
    labwareDef: LabwareDefinition2
  }
}
const getSlotPosition = (
  deckDef: DeckDefinition,
  slotNumber: string
): [number, number] => {
  let x = 0
  let y = 0
  const slotPosition = deckDef.locations.orderedSlots.find(
    orderedSlot => orderedSlot.id === slotNumber
  )?.position

  if (slotPosition == null) {
    console.error(
      `expected to find a slot position for slot ${slotNumber} in ${deckDef.metadata.displayName}, but could not`
    )
  } else {
    x = slotPosition[0]
    y = slotPosition[1]
  }

  return [x, y]
}

const getSlotHasMatingSurfaceUnitVector = (
  deckDef: DeckDefinition,
  slotNumber: string
): boolean => {
  const matingSurfaceUnitVector = deckDef.locations.orderedSlots.find(
    orderedSlot => orderedSlot.id === slotNumber
  )?.matingSurfaceUnitVector

  return Boolean(matingSurfaceUnitVector)
}

const getLabwareRenderCoords = (
  protocolData: ReturnType<typeof getProtocolData>
): CoordinatesByLabwareId => {
  if (
    protocolData != null &&
    'labware' in protocolData &&
    'labwareDefinitions' in protocolData
  ) {
    return reduce(
      protocolData.labware,
      (acc, labware, labwareId) => {
        const labwareDefId = labware.definitionId
        const labwareDef = protocolData.labwareDefinitions[labwareDefId]
        const slot = labware.slot
        let slotPosition = [0, 0]

        if ('modules' in protocolData) {
          const moduleInSlot = find(
            protocolData.modules,
            (_module, moduleId) => moduleId === slot
          )
          if (moduleInSlot) {
            const moduleDef = getModuleDef2(moduleInSlot.model)
            let slotNumber = moduleInSlot.slot
            // Note: this is because PD represents the slot the TC sits in as a made up slot. We want it to be rendered in slot 7
            if (slotNumber === SPAN7_8_10_11_SLOT) {
              slotNumber = '7'
            }
            const slotPosition = getSlotPosition(
              standardDeckDef as any,
              slotNumber
            )

            const slotHasMatingSurfaceVector = getSlotHasMatingSurfaceUnitVector(
              standardDeckDef as any,
              slotNumber
            )

            return slotHasMatingSurfaceVector
              ? {
                  ...acc,
                  [labwareId]: {
                    x: slotPosition[0] + moduleDef.labwareOffset.x,
                    y: slotPosition[1] + moduleDef.labwareOffset.y,
                    labwareDef,
                  },
                }
              : { ...acc }
          }
        }
        slotPosition = getSlotPosition(standardDeckDef as any, slot)

        const slotHasMatingSurfaceVector = getSlotHasMatingSurfaceUnitVector(
          standardDeckDef as any,
          slot
        )

        return slotHasMatingSurfaceVector
          ? {
              ...acc,
              [labwareId]: {
                x: slotPosition[0],
                y: slotPosition[1],
                labwareDef,
              },
            }
          : { ...acc }
      },
      {}
    )
  }
  return {}
}

const getModuleRenderCoords = (
  protocolData: ReturnType<typeof getProtocolData>
): CoordinatesByModuleModel => {
  if (protocolData != null && 'modules' in protocolData) {
    return reduce(
      protocolData.modules,
      (acc, module, moduleId) => {
        const moduleModel = module.model
        let slotNumber = module.slot
        // Note: this is because PD represents the slot the TC sits in as a made up slot. We want it to be rendered in slot 7
        if (slotNumber === SPAN7_8_10_11_SLOT) {
          slotNumber = '7'
        }
        const slotPosition = standardDeckDef.locations.orderedSlots.find(
          slot => slot.id === slotNumber
        )?.position

        if (slotPosition == null) {
          console.error(
            `expected to find a slot position for slot ${slotNumber} in the standard OT-2 deck definition, but could not`
          )
          return {
            ...acc,
            [moduleId]: {
              x: 0,
              y: 0,
              moduleModel,
            },
          }
        }
        const [x, y] = slotPosition
        return {
          ...acc,
          [moduleId]: { x, y, moduleModel },
        }
      },
      {}
    )
  }
  return {}
}

export function RunSetupCard(): JSX.Element | null {
  const { t } = useTranslation('protocol_setup')
  const [expandedStepKey, setExpandedStepKey] = React.useState<StepKey | null>(
    ROBOT_CALIBRATION_STEP_KEY
  )
  const protocolData = useSelector((state: State) => getProtocolData(state))
  const moduleRenderCoords = getModuleRenderCoords(protocolData)
  const labwareRenderCoords = getLabwareRenderCoords(protocolData)

  if (
    protocolData == null ||
    ('metadata' in protocolData && Object.keys(protocolData).length === 1)
  )
    return null

  let stepsKeysInOrder: StepKey[] = [ROBOT_CALIBRATION_STEP_KEY]
  if (protocolHasModules(protocolData as JsonProtocolFile)) {
    stepsKeysInOrder = [
      ...stepsKeysInOrder,
      MODULE_SETUP_KEY,
      LABWARE_SETUP_KEY,
    ]
  } else {
    stepsKeysInOrder = [...stepsKeysInOrder, LABWARE_SETUP_KEY]
  }

  const StepComponentMap: Record<StepKey, JSX.Element> = {
    [ROBOT_CALIBRATION_STEP_KEY]: (
      <Text marginTop={SPACING_3}>TODO: robot calibration step contents</Text>
    ),
    [MODULE_SETUP_KEY]: (
      <Text marginTop={SPACING_3}>TODO: module setup step contents</Text>
    ),
    [LABWARE_SETUP_KEY]: (
      <LabwareSetup
        moduleRenderCoords={moduleRenderCoords}
        labwareRenderCoords={labwareRenderCoords}
      />
    ),
  }

  return (
    <Card width="100%" marginTop={SPACING_3} paddingY={SPACING_3}>
      <Text as="h3" paddingX={SPACING_3} css={FONT_HEADER_DARK}>
        {t('setup_for_run')}
      </Text>
      {stepsKeysInOrder.map((stepKey, index) => (
        <React.Fragment key={stepKey}>
          <Divider marginY={SPACING_3} />
          <CollapsibleStep
            expanded={stepKey === expandedStepKey}
            label={t('step', { index: index + 1 })}
            title={t(`${stepKey}_title`)}
            description={t(`${stepKey}_description`)}
            toggleExpanded={() =>
              stepKey === expandedStepKey
                ? setExpandedStepKey(null)
                : setExpandedStepKey(stepKey)
            }
          >
            {StepComponentMap[stepKey]}
          </CollapsibleStep>
        </React.Fragment>
      ))}
    </Card>
  )
}
