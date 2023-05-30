import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { LabwareRender, Module, RobotWorkSpace } from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  CompletedProtocolAnalysis,
  getModuleDef2,
  LabwareDefinition2,
  THERMOCYCLER_MODULE_TYPE,
  getModuleType,
} from '@opentrons/shared-data'
import ot2DeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import ot3DeckDef from '@opentrons/shared-data/deck/definitions/3/ot3_standard.json'

import { getIsOnDevice } from '../../redux/config'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { useProtocolMetadata } from '../Devices/hooks'

import type { CheckLabwareStep } from './types'

const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

const DECK_MAP_VIEWBOX = '-80 -20 550 466'
const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]
interface PrepareSpaceProps extends Omit<CheckLabwareStep, 'section'> {
  section: 'CHECK_LABWARE' | 'CHECK_TIP_RACKS' | 'PICK_UP_TIP' | 'RETURN_TIP'
  labwareDef: LabwareDefinition2
  protocolData: CompletedProtocolAnalysis
  confirmPlacement: () => void
  header: React.ReactNode
  body: React.ReactNode
}
export const PrepareSpace = (props: PrepareSpaceProps): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const { location, moduleId, labwareDef, protocolData, header, body } = props

  const { robotType } = useProtocolMetadata()
  const isOnDevice = useSelector(getIsOnDevice)

  if (protocolData == null || robotType == null) return null
  const deckDef = robotType === 'OT-3 Standard' ? ot3DeckDef : ot2DeckDef
  return (
    <GenericWizardTile
      header={header}
      bodyText={body}
      rightHandBody={
        <RobotWorkSpace
          height={isOnDevice ? '80%' : '100%'}
          deckDef={deckDef as any}
          viewBox={DECK_MAP_VIEWBOX}
          deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
          id="LabwarePositionCheck_deckMap"
        >
          {({ deckSlotsById }) => {
            const deckSlot = deckSlotsById[location.slotName]
            const [x, y] = deckSlot.position
            let labwareToPrepare = null
            if ('moduleModel' in location && location.moduleModel != null) {
              labwareToPrepare = (
                <Module
                  x={x}
                  y={y}
                  orientation={inferModuleOrientationFromXCoordinate(
                    deckSlot.position[x]
                  )}
                  def={getModuleDef2(location.moduleModel)}
                  innerProps={
                    getModuleType(location.moduleModel) ===
                    THERMOCYCLER_MODULE_TYPE
                      ? { lidMotorState: 'open' }
                      : {}
                  }
                >
                  <LabwareRender definition={labwareDef} />
                </Module>
              )
            } else {
              labwareToPrepare = (
                <g transform={`translate(${String(x)},${String(y)})`}>
                  <LabwareRender definition={labwareDef} />
                </g>
              )
            }
            return (
              <>
                {protocolData.modules.map(module => {
                  const [modX, modY] = deckSlotsById[
                    module.location.slotName
                  ].position

                  // skip the focused module as it will be rendered above with the labware
                  return module.id === moduleId ? null : (
                    <Module
                      key={module.id}
                      x={modX}
                      y={modY}
                      orientation={inferModuleOrientationFromXCoordinate(modX)}
                      def={getModuleDef2(module.model)}
                      innerProps={
                        getModuleType(module.model) === THERMOCYCLER_MODULE_TYPE
                          ? { lidMotorState: 'open' }
                          : {}
                      }
                    />
                  )
                })}
                {labwareToPrepare}
              </>
            )
          }}
        </RobotWorkSpace>
      }
      proceed={props.confirmPlacement}
      proceedButtonText={t('shared:confirm_placement')}
      getHelp={isOnDevice ? undefined : LPC_HELP_LINK_URL}
    />
  )
}
