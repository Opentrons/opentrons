import * as React from 'react'
import map from 'lodash/map'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  LabwareRender,
  Link,
  ModuleViz,
  PrimaryBtn,
  RobotWorkSpace,
  SecondaryBtn,
  Text,
  Tooltip,
  useHoverTooltip,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  JUSTIFY_CENTER,
  SPACING_3,
  SPACING_4,
  SPACING_6,
  C_BLUE,
  C_DARK_GRAY,
  C_NEAR_WHITE,
} from '@opentrons/components'
import { inferModuleOrientationFromSlot } from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { getLabwareDefBySlot } from '../../../redux/protocol'
import { ModuleTag } from './ModuleTag'
import { LabwareInfoOverlay } from './LabwareInfoOverlay'
import { LabwareSetupModal } from './LabwareSetupModal'
import styles from './styles.css'
import type {
  DeckSlot,
  DeckSlotId,
  LabwareOffset,
  ModuleModel,
  ModuleRealType,
} from '@opentrons/shared-data'
import type { Slot } from '../../../redux/robot'

export type ModulesBySlot = Record<
  DeckSlotId,
  {
    model: ModuleModel
    labwareOffset: LabwareOffset
    type: ModuleRealType
  }
>

interface LabwareSetupProps {
  modulesBySlot: ModulesBySlot
  labwareDefBySlot: ReturnType<typeof getLabwareDefBySlot>
}

const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

export const LabwareSetup = (props: LabwareSetupProps): JSX.Element | null => {
  const { modulesBySlot, labwareDefBySlot } = props
  const proceedToRunDisabled = false
  const proceedToRunDisabledReason = 'replace with actual tooltip text'
  const LinkComponent = proceedToRunDisabled ? 'button' : NavLink
  const linkProps = proceedToRunDisabled ? {} : { to: '/run' }
  const { t } = useTranslation('protocol_setup')
  const [targetProps, tooltipProps] = useHoverTooltip()
  const [
    showLabwareHelpModal,
    setShowLabwareHelpModal,
  ] = React.useState<boolean>(false)
  return (
    <React.Fragment>
      {showLabwareHelpModal && (
        <LabwareSetupModal
          onCloseClick={() => setShowLabwareHelpModal(false)}
        />
      )}
      <Flex
        flex="1"
        backgroundColor={C_NEAR_WHITE}
        borderRadius="6px"
        flexDirection={DIRECTION_COLUMN}
      >
        <Link
          fontSize={FONT_SIZE_BODY_1}
          color={C_BLUE}
          alignSelf={ALIGN_FLEX_END}
          onClick={() => setShowLabwareHelpModal(true)}
          data-test={'LabwareSetup_helpLink'}
        >
          {t('labware_help_link_title')}
        </Link>
        <RobotWorkSpace
          deckDef={standardDeckDef as any}
          viewBox={`-64 -10 ${530} ${456}`}
          className={styles.deck_map}
          deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
        >
          {({ deckSlotsById }) =>
            map<DeckSlot>(deckSlotsById, (slot: DeckSlot, slotId: string) => {
              if (slot.matingSurfaceUnitVector == null) return null // if slot has no mating surface, don't render anything in it
              const moduleInSlot = modulesBySlot[slotId]
              const labwareDefInSlot = labwareDefBySlot[slotId as Slot]

              const [slotPositionX, slotPositionY] = slot.position
              const orientation = inferModuleOrientationFromSlot(slot.id)

              return (
                <React.Fragment key={slotId}>
                  {moduleInSlot && (
                    <React.Fragment>
                      <ModuleViz
                        x={slotPositionX}
                        y={slotPositionY}
                        orientation={orientation}
                        moduleType={moduleInSlot.type}
                        slotName={slot.id}
                      />
                      <ModuleTag
                        x={slotPositionX}
                        y={slotPositionY}
                        module={moduleInSlot}
                        orientation={orientation}
                      />
                    </React.Fragment>
                  )}
                  {labwareDefInSlot != null && (
                    <React.Fragment>
                      <svg>
                        <g
                          transform={`translate(${slot.position[0]}, ${slot.position[1]})`}
                        >
                          <LabwareRender definition={labwareDefInSlot} />
                        </g>
                        <g>
                          <LabwareInfoOverlay
                            slotPosition={slot.position}
                            definition={labwareDefInSlot}
                          />
                        </g>
                      </svg>
                    </React.Fragment>
                  )}
                </React.Fragment>
              )
            })
          }
        </RobotWorkSpace>
        <Text color={C_DARK_GRAY} margin={`${SPACING_4} ${SPACING_6}`}>
          {t('labware_position_check_text')}
        </Text>
        <Flex justifyContent={JUSTIFY_CENTER}>
          <SecondaryBtn
            title="Check Labware Positions"
            marginRight={SPACING_3}
            onClick={() => console.log('check labware positions!')}
          >
            {t('check_labware_positions')}
          </SecondaryBtn>
          <PrimaryBtn
            title="Proceed to Run"
            disabled={proceedToRunDisabled}
            as={LinkComponent}
            {...linkProps}
            {...targetProps}
          >
            {t('proceed_to_run')}
          </PrimaryBtn>
          {proceedToRunDisabled && (
            <Tooltip {...tooltipProps}>{proceedToRunDisabledReason}</Tooltip>
          )}
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
