import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  LabwareRender,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  RobotCoordsForeignDiv,
  RobotWorkSpace,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { LiquidButton } from '../../../components/molecules'
import { getOnlyLatestDefs } from '../../../labware-defs'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { selectZoomedIntoSlot } from '../../../labware-ingred/actions'
import { selectors } from '../../../labware-ingred/selectors'
import { getSelectedTerminalItemId } from '../../../ui/steps'
import { DeckSetupToolbox } from '../DeckSetup/DeckSetupToolbox'
import { LabwareLabel } from '../LabwareLabel'
import { OffDeckDetails } from './OffDeckDetails'

import type { Dispatch, SetStateAction } from 'react'

const STANDARD_X_WIDTH = 127.76
const STANDARD_Y_HEIGHT = 85.48
const SCALER_TO_ACCOUNT_FOR_LABWARE_LABEL = 0.8

interface OffDeckProps {
  setOverflowMenu: Dispatch<SetStateAction<boolean>>
}
export function OffDeck(props: OffDeckProps): JSX.Element {
  const { setOverflowMenu } = props
  const { t, i18n } = useTranslation('starting_deck_state')
  const [hoveredLabware, setHoveredLabware] = useState<string | null>(null)
  const terminalItemId = useSelector(getSelectedTerminalItemId)

  const dispatch = useDispatch()

  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { selectedLabwareDefUri, selectedSlot } = selectedSlotInfo

  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const defs = getOnlyLatestDefs()

  const hoveredLabwareDef =
    hoveredLabware != null
      ? defs[hoveredLabware] ?? customLabwareDefs[hoveredLabware] ?? null
      : null
  const offDeckLabware =
    selectedLabwareDefUri != null ? defs[selectedLabwareDefUri] ?? null : null

  let labware = (
    <RobotWorkSpace
      key="emptyState"
      viewBox={`-15 -22 ${
        STANDARD_X_WIDTH / SCALER_TO_ACCOUNT_FOR_LABWARE_LABEL
      } ${STANDARD_Y_HEIGHT / SCALER_TO_ACCOUNT_FOR_LABWARE_LABEL}`}
    >
      {() => (
        <RobotCoordsForeignDiv>
          <Box
            backgroundColor={COLORS.grey40}
            borderRadius={BORDERS.borderRadius8}
            width={`${STANDARD_X_WIDTH}px`}
            height={`${STANDARD_Y_HEIGHT}px`}
          />
        </RobotCoordsForeignDiv>
      )}
    </RobotWorkSpace>
  )
  if (hoveredLabwareDef != null && hoveredLabwareDef !== offDeckLabware) {
    labware = (
      <RobotWorkSpace
        key={hoveredLabwareDef.parameters.loadName}
        viewBox={`-15 -22 ${
          hoveredLabwareDef.dimensions.xDimension /
          SCALER_TO_ACCOUNT_FOR_LABWARE_LABEL
        } ${
          hoveredLabwareDef.dimensions.yDimension /
          SCALER_TO_ACCOUNT_FOR_LABWARE_LABEL
        }`}
      >
        {() => (
          <>
            <LabwareRender definition={hoveredLabwareDef} />
            <LabwareLabel
              isLast={true}
              isSelected={false}
              labwareDef={hoveredLabwareDef}
              position={[0, 0, 0]}
            />
          </>
        )}
      </RobotWorkSpace>
    )
  } else if (offDeckLabware != null) {
    const def = offDeckLabware
    labware = (
      <RobotWorkSpace
        key={def.parameters.loadName}
        viewBox={`-15 -22 ${
          def.dimensions.xDimension / SCALER_TO_ACCOUNT_FOR_LABWARE_LABEL
        } ${def.dimensions.yDimension / SCALER_TO_ACCOUNT_FOR_LABWARE_LABEL}`}
      >
        {() => (
          <>
            <LabwareRender definition={def} />

            <LabwareLabel
              isLast={true}
              isSelected={true}
              labwareDef={def}
              position={[0, 0, 0]}
            />
          </>
        )}
      </RobotWorkSpace>
    )
  }

  return (
    <Flex width="100%" height="100%">
      {selectedSlot.slot === 'offDeck' ? (
        <Flex
          alignItems={ALIGN_CENTER}
          width="100%"
          padding={SPACING.spacing12}
          gridGap={SPACING.spacing12}
          position={POSITION_RELATIVE}
        >
          <Flex
            position={POSITION_ABSOLUTE}
            top={SPACING.spacing12}
            right="24rem"
          >
            <LiquidButton
              showLiquidOverflowMenu={() => {
                setOverflowMenu(true)
              }}
            />
          </Flex>
          <Flex justifyContent={JUSTIFY_CENTER} width="100%">
            <Flex
              width="39.4275rem"
              height="32.125rem"
              justifyContent={JUSTIFY_CENTER}
              alignItems={ALIGN_CENTER}
              borderRadius={BORDERS.borderRadius8}
              backgroundColor={COLORS.white}
            >
              <Flex
                padding={SPACING.spacing60}
                width="100%"
                height="100%"
                flexDirection={DIRECTION_COLUMN}
              >
                <Flex
                  justifyContent={JUSTIFY_CENTER}
                  width="100%"
                  color={COLORS.grey60}
                  marginBottom={SPACING.spacing40}
                >
                  <StyledText desktopStyle="bodyDefaultSemiBold">
                    {i18n.format(t('off_deck_labware'), 'upperCase')}
                  </StyledText>
                </Flex>
                <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_CENTER}>
                  {labware}
                </Flex>
              </Flex>
            </Flex>
          </Flex>

          <DeckSetupToolbox
            position={POSITION_RELATIVE}
            setHoveredLabware={setHoveredLabware}
            onCloseClick={() => {
              dispatch(selectZoomedIntoSlot({ slot: null, cutout: null }))
            }}
          />
        </Flex>
      ) : (
        <OffDeckDetails
          terminalItemId={terminalItemId}
          addLabware={() => {
            dispatch(selectZoomedIntoSlot({ slot: 'offDeck', cutout: null }))
          }}
        />
      )}
    </Flex>
  )
}
