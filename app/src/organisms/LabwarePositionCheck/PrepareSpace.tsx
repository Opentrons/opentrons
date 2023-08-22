import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  LabwareRender,
  Module,
  RESPONSIVENESS,
  RobotWorkSpace,
  SPACING,
  Flex,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
  JUSTIFY_FLEX_END,
  PrimaryButton,
} from '@opentrons/components'
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
import { useProtocolMetadata } from '../Devices/hooks'

import type { CheckLabwareStep } from './types'
import { SmallButton } from '../../atoms/buttons'
import { NeedHelpLink } from '../CalibrationPanels'

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

const TILE_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing32};
  height: 24.625rem;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 29.5rem;
  }
`

const Title = styled.h1`
  ${TYPOGRAPHY.h1Default};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold};
  }
`
interface PrepareSpaceProps extends Omit<CheckLabwareStep, 'section'> {
  section:
    | 'CHECK_LABWARE'
    | 'CHECK_TIP_RACKS'
    | 'PICK_UP_TIP'
    | 'RETURN_TIP'
    | 'CHECK_POSITIONS'
  labwareDef: LabwareDefinition2
  protocolData: CompletedProtocolAnalysis
  confirmPlacement: () => void
  header: React.ReactNode
  body: React.ReactNode
}
export const PrepareSpace = (props: PrepareSpaceProps): JSX.Element | null => {
  const { i18n, t } = useTranslation(['labware_position_check', 'shared'])
  const { location, moduleId, labwareDef, protocolData, header, body } = props

  const { robotType } = useProtocolMetadata()
  const isOnDevice = useSelector(getIsOnDevice)

  if (protocolData == null || robotType == null) return null
  const deckDef = robotType === 'OT-3 Standard' ? ot3DeckDef : ot2DeckDef
  return (
    <Flex css={TILE_CONTAINER_STYLE}>
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing40}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          flex="1"
          gridGap={SPACING.spacing16}
        >
          <Title>{header}</Title>
          {body}
        </Flex>
        <Flex flex="1" justifyContent={JUSTIFY_CENTER}>
          <RobotWorkSpace
            height={isOnDevice ? '300px' : '100%'}
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
                        orientation={inferModuleOrientationFromXCoordinate(
                          modX
                        )}
                        def={getModuleDef2(module.model)}
                        innerProps={
                          getModuleType(module.model) ===
                          THERMOCYCLER_MODULE_TYPE
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
        </Flex>
      </Flex>
      {isOnDevice ? (
        <Flex justifyContent={JUSTIFY_FLEX_END}>
          <SmallButton
            buttonText={i18n.format(
              t('shared:confirm_placement'),
              'capitalize'
            )}
            onClick={props.confirmPlacement}
          />
        </Flex>
      ) : (
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <NeedHelpLink href={LPC_HELP_LINK_URL} />
          <PrimaryButton onClick={props.confirmPlacement}>
            {i18n.format(t('shared:confirm_placement'), 'capitalize')}
          </PrimaryButton>
        </Flex>
      )}
    </Flex>
  )
}
