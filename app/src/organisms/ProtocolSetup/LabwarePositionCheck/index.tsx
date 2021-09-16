import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'
import {
  LabwareRender,
  ModuleViz,
  RobotWorkSpace,
  ModalPage,
  PrimaryBtn,
  Text,
  Flex,
  Box,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
  C_BLUE,
  SPACING_3,
  FONT_SIZE_BODY_2,
  ALIGN_CENTER,
  LINE_HEIGHT_COPY,
} from '@opentrons/components'
import {
  getModuleType,
  inferModuleOrientationFromXCoordinate,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { Portal } from '../../../App/portal'
import { getProtocolData } from '../../../redux/protocol'
import { getModuleRenderCoords } from '../utils/getModuleRenderCoords'
import { getLabwareRenderCoords } from '../utils/getLabwareRenderCoords'
import { getPrimaryPipetteId } from './utils/getPrimaryPipetteId'
import { getLabwarePositionCheckSteps } from './getLabwarePositionCheckSteps'

import { ModuleTag } from '../ModuleTag'
import styles from '../styles.css'

const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

const DECK_MAP_VIEWBOX = '-80 -100 550 560'

interface LabwarePositionCheckModalProps {
  onCloseClick: () => unknown
}

export const LabwarePositionCheck = (
  props: LabwarePositionCheckModalProps
): JSX.Element | null => {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  const [
    currentLabwareCheckStep,
    setCurrentLabwareCheckStep,
  ] = React.useState<Number | null>(null)
  // placeholder for next steps
  console.log(currentLabwareCheckStep)

  const protocolData = useSelector((state: State) => getProtocolData(state))
  const moduleRenderCoords = getModuleRenderCoords(
    protocolData,
    standardDeckDef as any
  )
  const labwareRenderCoords = getLabwareRenderCoords(
    protocolData,
    standardDeckDef as any
  )

  // get the primary pipette info
  const pipettes = protocolData.pipettes
  const primaryPipetteId = getPrimaryPipetteId(pipettes)
  const primaryPipetteSpecs = getPipetteNameSpecs(
    pipettes[primaryPipetteId].name
  )
  // find how many channels pipette for check has for dynmic text
  const channels = primaryPipetteSpecs.channels
  const numTipsText = channels === 1 ? '1 tip' : `${channels} tips`

  // find which tiprack primary pipette will use for check
  const steps = getLabwarePositionCheckSteps(protocolData)
  const pickUpTipStep = steps.find(
    step => step.commands[0].command === 'pickUpTip'
  )
  const pickUpTipLabwareId = pickUpTipStep.labwareId
  const pickUpTipLabware = protocolData.labware[pickUpTipLabwareId]
  // find name and slot number for tiprack used for check
  const name = pickUpTipLabware.displayName
  const slot = pickUpTipLabware.slot

  // find the slot for the first labware that will be checked for button
  const firstTiprackToCheckId = steps[0].labwareId
  const firstLabwareSlot = protocolData.labware[firstTiprackToCheckId].slot

  return (
    <Portal level="top">
      <ModalPage
        className={styles.modal}
        contentsClassName={styles.modal_contents}
        titleBar={{
          title: t('labware_position_check'),
          back: {
            onClick: props.onCloseClick,
            title: t('shared:exit'),
            children: t('shared:exit'),
          },
        }}
      >
        <Box margin={SPACING_3}>
          <Text
            as={'h3'}
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            fontWeight={FONT_WEIGHT_SEMIBOLD}
          >
            {t('labware_position_check_overview')}
          </Text>
          <Text
            as={'p'}
            fontSize={FONT_SIZE_BODY_2}
            lineHeight={LINE_HEIGHT_COPY}
          >
            {t('position_check_description', {
              number_of_tips: numTipsText,
              labware_name: name,
              labware_slot: slot,
            })}
          </Text>
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
          >
            <Box width="210px" marginLeft="4rem">
              {/* This is a placeholder for next PR */}
              <Text>TODO</Text>
              <ul style={{ fontSize: '.5rem' }}>
                {steps.map((step, index) => (
                  <li key={index}>{step.section}</li>
                ))}
              </ul>
            </Box>
            <Box width="65%" padding={SPACING_3}>
              <RobotWorkSpace
                deckDef={standardDeckDef as any}
                viewBox={DECK_MAP_VIEWBOX}
                className={styles.deck_map}
                deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
                id={'LabwarePositionCheck_deckMap'}
              >
                {() => {
                  return (
                    <React.Fragment>
                      {map(moduleRenderCoords, ({ x, y, moduleModel }) => {
                        const orientation = inferModuleOrientationFromXCoordinate(
                          x
                        )
                        return (
                          <React.Fragment
                            key={`LabwareSetup_Module_${moduleModel}_${x}${y}`}
                          >
                            <ModuleViz
                              x={x}
                              y={y}
                              orientation={orientation}
                              moduleType={getModuleType(moduleModel)}
                            />
                            <ModuleTag
                              x={x}
                              y={y}
                              moduleModel={moduleModel}
                              orientation={orientation}
                            />
                          </React.Fragment>
                        )
                      })}
                      {map(labwareRenderCoords, ({ x, y, labwareDef }) => {
                        return (
                          <React.Fragment
                            key={`LabwareSetup_Labware_${labwareDef.metadata.displayName}_${x}${y}`}
                          >
                            <g transform={`translate(${x},${y})`}>
                              <LabwareRender definition={labwareDef} />
                            </g>
                          </React.Fragment>
                        )
                      })}
                    </React.Fragment>
                  )
                }}
              </RobotWorkSpace>
            </Box>
          </Flex>
          <Flex justifyContent={JUSTIFY_CENTER} marginTop="-3rem">
            <PrimaryBtn
              title="proceed to check"
              backgroundColor={C_BLUE}
              onClick={() => setCurrentLabwareCheckStep(0)}
            >
              {t('start_position_check', {
                initial_labware_slot: firstLabwareSlot,
              })}
            </PrimaryBtn>
          </Flex>
        </Box>
      </ModalPage>
    </Portal>
  )
}
