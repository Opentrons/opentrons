import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Tooltip,
  DeprecatedPrimaryButton,
  useHoverTooltip,
  TOOLTIP_TOP,
  TOOLTIP_FIXED,
  Flex,
  COLORS,
  Icon,
  SPACING,
  Text,
  DIRECTION_COLUMN,
  BORDERS,
  LabwareRender,
  RobotWorkSpace,
  LabwareNameOverlay,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { i18n } from '../localization'
import { openAddLabwareModal } from '../labware-ingred/actions'
import { getLabwareEntities } from '../step-forms/selectors'
import { getRobotStateAtActiveItem } from '../top-selectors/labware-locations'
import { EditLabwareOffDeck } from './DeckSetup/LabwareOverlays/EditLabwareOffDeck'
import { Slideout } from './Slideout'

interface OffDeckLabwareSlideoutProps {
  hasOrderedStepIds: boolean
  isExpanded: boolean
  onCloseClick: () => void
}

export const OffDeckLabwareSlideout = (
  props: OffDeckLabwareSlideoutProps
): JSX.Element => {
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
    strategy: TOOLTIP_FIXED,
  })
  const dispatch = useDispatch()
  const robotState = useSelector(getRobotStateAtActiveItem)
  const labwareEntities = useSelector(getLabwareEntities)
  const offDeckEntries =
    robotState?.labware != null
      ? Object.entries(robotState?.labware).filter(
          ([key, value]) => value.slot === 'offDeck'
        )
      : null
  const offDeck =
    offDeckEntries != null && offDeckEntries.length > 0
      ? Object.fromEntries(offDeckEntries)
      : null

  return (
    <Slideout
      onCloseClick={props.onCloseClick}
      title={'Off deck labware'}
      isExpanded={props.isExpanded}
      footer={
        <>
          <DeprecatedPrimaryButton
            onClick={() => dispatch(openAddLabwareModal({ slot: 'offDeck' }))}
            marginTop="1rem"
            marginRight="1rem"
            disabled={props.hasOrderedStepIds}
            {...targetProps}
          >
            {i18n.t('button.add_off_deck')}
          </DeprecatedPrimaryButton>
          {props.hasOrderedStepIds ? (
            <Tooltip {...tooltipProps}>
              {i18n.t(`tooltip.disabled_off_deck`)}
            </Tooltip>
          ) : null}
        </>
      }
    >
      {offDeck == null ? (
        <Flex
          borderRadius={BORDERS.borderRadiusSize3}
          alignItems="center"
          backgroundColor={COLORS.light1}
          flexDirection={DIRECTION_COLUMN}
          padding="1rem"
          textAlign="center"
          height="100%"
          justifyContent="center"
        >
          <Icon
            name="ot-alert"
            size="1rem"
            color={COLORS.darkBlack90}
            marginBottom={SPACING.spacing32}
          />
          <Text>There is current no off deck labware in this protocol</Text>
        </Flex>
      ) : (
        Object.keys(offDeck).map(labwareId => {
          const definition =
            labwareEntities[labwareId] != null
              ? labwareEntities[labwareId].def
              : null

          return definition != null ? (
            <RobotWorkSpace
              viewBox={`${definition.cornerOffsetFromSlot.x} ${definition.cornerOffsetFromSlot.y} ${definition.dimensions.xDimension} ${definition.dimensions.yDimension}`}
              width="100%"
              height="8rem"
              paddingBottom="0.5rem"
            >
              {() => (
                <>
                  <EditLabwareOffDeck
                    labwareOnDeck={labwareEntities[labwareId]}
                  />
                  <LabwareRender definition={definition} />
                  <RobotCoordsForeignDiv
                    width={definition.dimensions.xDimension}
                    height={definition.dimensions.yDimension}
                    x={definition.cornerOffsetFromSlot.x}
                    y={definition.cornerOffsetFromSlot.y}
                  >
                    <LabwareNameOverlay
                      title={getLabwareDisplayName(definition)}
                    />
                  </RobotCoordsForeignDiv>
                </>
              )}
            </RobotWorkSpace>
          ) : null
        })
      )}
    </Slideout>
  )
}
