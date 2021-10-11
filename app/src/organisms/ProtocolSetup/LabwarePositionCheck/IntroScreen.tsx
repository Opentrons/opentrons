import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import map from 'lodash/map'

import {
  LabwareRender,
  Module,
  RobotWorkSpace,
  PrimaryBtn,
  Text,
  Flex,
  Box,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  C_BLUE,
  SPACING_2,
  SPACING_3,
  SPACING_4,
  FONT_SIZE_BODY_2,
} from '@opentrons/components'
import {
  THERMOCYCLER_MODULE_V1,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { useModuleRenderInfoById, useLabwareRenderInfoById } from '../hooks'
import { PositionCheckNav } from './PositionCheckNav'
import { useIntroInfo } from './hooks'

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

const DECK_MAP_VIEWBOX = '-80 -100 570 540'

export const IntroScreen = (props: {
  setCurrentLabwareCheckStep: (stepNumber: number) => void
}): JSX.Element | null => {
  const introInfo = useIntroInfo()
  const moduleRenderInfoById = useModuleRenderInfoById()
  const labwareRenderInfoById = useLabwareRenderInfoById()
  const { t } = useTranslation(['labware_position_check', 'shared'])

  if (introInfo == null) return null
  const {
    primaryPipetteMount,
    secondaryPipetteMount,
    firstStepLabwareSlot,
    sections,
  } = introInfo

  return (
    <Box margin={SPACING_3}>
      <Text
        as={'h3'}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
      >
        {t('labware_position_check_overview')}
      </Text>
      <Trans
        t={t}
        i18nKey="position_check_description"
        components={{
          block: <Text fontSize={FONT_SIZE_BODY_2} marginBottom={SPACING_2} />,
        }}
      ></Trans>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <PositionCheckNav
          sections={sections}
          primaryPipetteMount={primaryPipetteMount}
          secondaryPipetteMount={secondaryPipetteMount}
        />
        <Box width="60%" paddingTop={SPACING_3}>
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
                  {map(
                    moduleRenderInfoById,
                    ({ x, y, moduleDef, nestedLabwareDef }) => (
                      <Module
                        key={`LabwarePositionCheck_Module_${moduleDef.model}_${x}${y}`}
                        x={x}
                        y={y}
                        orientation={inferModuleOrientationFromXCoordinate(x)}
                        def={moduleDef}
                        innerProps={
                          moduleDef.model === THERMOCYCLER_MODULE_V1
                            ? { lidMotorState: 'open' }
                            : {}
                        }
                      >
                        {nestedLabwareDef != null ? (
                          <React.Fragment
                            key={`LabwarePositionCheck_Labware_${nestedLabwareDef.metadata.displayName}_${x}${y}`}
                          >
                            <LabwareRender definition={nestedLabwareDef} />
                          </React.Fragment>
                        ) : null}
                      </Module>
                    )
                  )}

                  {map(labwareRenderInfoById, ({ x, y, labwareDef }) => {
                    return (
                      <React.Fragment
                        key={`LabwarePositionCheck_Labware_${labwareDef.metadata.displayName}_${x}${y}`}
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
      <Flex justifyContent={JUSTIFY_CENTER} marginBottom={SPACING_4}>
        <PrimaryBtn
          title={t('start_position_check', {
            initial_labware_slot: firstStepLabwareSlot,
          })}
          backgroundColor={C_BLUE}
          onClick={() => props.setCurrentLabwareCheckStep(0)}
        >
          {t('start_position_check', {
            initial_labware_slot: firstStepLabwareSlot,
          })}
        </PrimaryBtn>
      </Flex>
    </Box>
  )
}
