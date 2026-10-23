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
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  RobotCoordsForeignDiv,
  RobotWorkSpace,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { LiquidButton } from '../../../components/molecules'
import { LabwareOnDeck } from '../../../components/organisms'
import {
  editSlotInfo,
  selectZoomedIntoSlot,
} from '../../../labware-ingred/actions'
import { selectors } from '../../../labware-ingred/selectors'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { getSelectedTerminalItemId } from '../../../ui/steps'
import { DeckSetupToolbox } from '../DeckSetup/DeckSetupToolbox'
import { LabwareLabel } from '../LabwareLabel'
import { OffDeckDetails } from './OffDeckDetails'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { ThunkDispatch } from '../../../types'

const STANDARD_X_WIDTH = 127.76
const STANDARD_Y_HEIGHT = 85.48
const SCALER_TO_ACCOUNT_FOR_LABWARE_LABEL = 0.8

interface OffDeckProps {
  setOverflowMenu: Dispatch<SetStateAction<boolean>>
}
export function OffDeck(props: OffDeckProps): ReactNode {
  const { setOverflowMenu } = props
  const { t, i18n } = useTranslation('starting_deck_state')
  const terminalItemId = useSelector(getSelectedTerminalItemId)
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const dispatch = useDispatch<ThunkDispatch<any>>()

  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const { selectedSlot } = selectedSlotInfo
  const zoomedInLabwareOnDeck =
    selectedSlot?.slot != null
      ? activeDeckSetup.labware[selectedSlot.slot]
      : null

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
  if (zoomedInLabwareOnDeck != null) {
    labware = (
      <RobotWorkSpace
        key={zoomedInLabwareOnDeck.def.parameters.loadName}
        viewBox={`-15 -22 ${
          zoomedInLabwareOnDeck.def.dimensions.xDimension /
          SCALER_TO_ACCOUNT_FOR_LABWARE_LABEL
        } ${
          zoomedInLabwareOnDeck.def.dimensions.yDimension /
          SCALER_TO_ACCOUNT_FOR_LABWARE_LABEL
        }`}
      >
        {() => (
          <>
            <LabwareOnDeck labwareOnDeck={zoomedInLabwareOnDeck} x={0} y={0} />
            <LabwareLabel
              isLast={true}
              isSelected={true}
              labwareDef={zoomedInLabwareOnDeck.def}
              position={[0, 0, 0]}
              showModuleIcon={false}
            />
          </>
        )}
      </RobotWorkSpace>
    )
  }

  return (
    <Flex width="100%" height="100%">
      {zoomedInLabwareOnDeck != null || selectedSlot.slot === 'offDeck' ? (
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
            onCloseClick={() => {
              dispatch(selectZoomedIntoSlot({ slot: null, cutout: null }))
            }}
          />
        </Flex>
      ) : (
        <OffDeckDetails
          terminalItemId={terminalItemId}
          addLabware={id => {
            //  if id is null then you are creating a new labware on an empty off-deck slot
            dispatch(
              selectZoomedIntoSlot({ slot: id ?? 'offDeck', cutout: null })
            )
            dispatch(
              editSlotInfo({
                labwareDefURI:
                  id != null ? activeDeckSetup.labware[id].labwareDefURI : null,
              })
            )
          }}
        />
      )}
    </Flex>
  )
}
