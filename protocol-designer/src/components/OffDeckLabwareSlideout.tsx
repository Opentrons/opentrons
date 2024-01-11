import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'
import {
  Tooltip,
  DeprecatedPrimaryButton,
  useHoverTooltip,
  Flex,
  LEGACY_COLORS,
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
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
  truncateString,
  POSITION_ABSOLUTE,
} from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { i18n } from '../localization'
import { openAddLabwareModal } from '../labware-ingred/actions'
import { getLabwareEntities } from '../step-forms/selectors'
import { selectors } from '../labware-ingred/selectors'
import { getAllWellContentsForActiveItem } from '../top-selectors/well-contents'
import { getRobotStateAtActiveItem } from '../top-selectors/labware-locations'
import { getLabwareNicknamesById } from '../ui/labware/selectors'
import { EditLabwareOffDeck } from './DeckSetup/LabwareOverlays/EditLabwareOffDeck'
import { BrowseLabware } from './DeckSetup/LabwareOverlays/BrowseLabware'
import { Slideout } from '../atoms/Slideout'
import { wellFillFromWellContents } from './labware'

interface OffDeckLabwareSlideoutProps {
  initialSetupTerminalItemId: boolean
  isExpanded: boolean
  onCloseClick: () => void
}

export const OffDeckLabwareSlideout = (
  props: OffDeckLabwareSlideoutProps
): JSX.Element => {
  const [targetProps, tooltipProps] = useHoverTooltip()
  const dispatch = useDispatch()
  const disabled = props.initialSetupTerminalItemId === false
  const robotState = useSelector(getRobotStateAtActiveItem)
  const labwareEntities = useSelector(getLabwareEntities)
  const allWellContentsForActiveItem = useSelector(
    getAllWellContentsForActiveItem
  )
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const labwareNickNames = useSelector(getLabwareNicknamesById)

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
      title={i18n.t('deck.off_deck.slideout_title')}
      isExpanded={props.isExpanded}
      footer={
        <div {...targetProps}>
          <DeprecatedPrimaryButton
            onClick={() => dispatch(openAddLabwareModal({ slot: 'offDeck' }))}
            marginTop={SPACING.spacing16}
            marginRight={SPACING.spacing16}
            disabled={disabled}
          >
            {i18n.t('button.add_off_deck')}
          </DeprecatedPrimaryButton>
          {disabled ? (
            <Tooltip {...tooltipProps}>
              {i18n.t(`tooltip.disabled_off_deck`)}
            </Tooltip>
          ) : null}
        </div>
      }
    >
      {offDeck == null ? (
        <Flex
          borderRadius={BORDERS.borderRadiusSize3}
          alignItems={ALIGN_CENTER}
          backgroundColor={LEGACY_COLORS.light1}
          flexDirection={DIRECTION_COLUMN}
          padding={SPACING.spacing16}
          textAlign={TYPOGRAPHY.textAlignCenter}
          height="100%"
          justifyContent={JUSTIFY_CENTER}
        >
          <Icon
            name="ot-alert"
            size="2rem"
            color={LEGACY_COLORS.darkBlack90}
            marginBottom={SPACING.spacing32}
          />
          <Text>{i18n.t('deck.off_deck.slideout_empty_state')}</Text>
        </Flex>
      ) : (
        Object.keys(offDeck).map(labwareId => {
          const labwareNickName = labwareNickNames[labwareId]
          const truncatedNickName =
            labwareNickName != null
              ? truncateString(labwareNickName, 75, 25)
              : null
          const wellContents =
            allWellContentsForActiveItem != null
              ? allWellContentsForActiveItem[labwareId]
              : null
          const definition =
            labwareEntities[labwareId] != null
              ? labwareEntities[labwareId].def
              : null
          return definition != null ? (
            <RobotWorkSpace
              key={labwareId}
              viewBox={`${definition.cornerOffsetFromSlot.x} ${definition.cornerOffsetFromSlot.y} ${definition.dimensions.xDimension} ${definition.dimensions.yDimension}`}
              width="100%"
              height="8rem"
              paddingBottom={SPACING.spacing8}
            >
              {() => (
                <>
                  <LabwareRender
                    definition={definition}
                    wellFill={wellFillFromWellContents(
                      wellContents,
                      liquidDisplayColors
                    )}
                  />
                  <RobotCoordsForeignDiv
                    width={definition.dimensions.xDimension}
                    height={definition.dimensions.yDimension}
                    x={definition.cornerOffsetFromSlot.x}
                    y={definition.cornerOffsetFromSlot.y}
                  >
                    <LabwareNameOverlay
                      title={
                        truncatedNickName ?? getLabwareDisplayName(definition)
                      }
                    />
                    {disabled ? (
                      <div
                        css={css`
                          z-index: 1;
                          bottom: 0;
                          position: ${POSITION_ABSOLUTE};
                          width: 127.76px;
                          height: 85.45px;
                          opacity: 0;
                          &:hover {
                            opacity: 1;
                          }
                        `}
                      >
                        <BrowseLabware
                          labwareOnDeck={labwareEntities[labwareId]}
                        />
                      </div>
                    ) : (
                      <EditLabwareOffDeck
                        labwareEntity={labwareEntities[labwareId]}
                      />
                    )}
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
