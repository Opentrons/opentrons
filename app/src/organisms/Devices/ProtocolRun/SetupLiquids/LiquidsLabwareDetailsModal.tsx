import * as React from 'react'
import { Modal } from '../../../../atoms/Modal'
import {
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { css } from 'styled-components'
import { StyledText } from '../../../../atoms/text'
import { MICRO_LITERS } from '@opentrons/shared-data/js/constants'

const MOCK_LIQUID_DATA = [
  {
    liquidId: '0',
    displayColor: '#B925FF',
    displayName: 'Cell Line 1',
    description: 'eluted stick samples',
    volume: '100',
  },
  {
    liquidId: '1',
    displayColor: '#ffd600',
    displayName: 'Cell Line 2',
    description: 'eluted stick samples',
    volume: '150',
  },
  {
    liquidId: '2',
    displayColor: '#9dffd8',
    displayName: 'Cell Line 3',
    description: 'eluted stick samples',
    volume: '200',
  },
  {
    liquidId: '3',
    displayColor: '#ff9900',
    displayName: 'Cell Line 4',
    description: 'eluted stick samples',
    volume: '300',
  },
]

interface LiquidsLabwareDetailsModalProps {
  closeModal: () => void
}

export const LiquidsLabwareDetailsModal = (
  props: LiquidsLabwareDetailsModalProps
): JSX.Element => {
  const { closeModal } = props
  const [selectedValue, setSelectedValue] = React.useState<string | null>('0')

  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `

  return (
    <Modal
      onClose={closeModal}
      title={'Labware Name'}
      backgroundColor={COLORS.background}
    >
      <Box>
        <Flex flexDirection={DIRECTION_ROW}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            css={HIDE_SCROLLBAR}
            maxHeight={'27.125rem'}
            overflowY={'auto'}
          >
            {MOCK_LIQUID_DATA.map((data, index) => {
              return (
                <LiquidDetailCard
                  key={index}
                  {...data}
                  setSelectedValue={setSelectedValue}
                  selectedValue={selectedValue}
                />
              )
            })}
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText
              as="h6"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              color={COLORS.darkGreyEnabled}
              marginX={SPACING.spacingL}
            >
              {'Slot Number'}
            </StyledText>
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              color={COLORS.darkBlack}
              marginX={SPACING.spacingL}
            >
              {'4'}
            </StyledText>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText
              as="h6"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              color={COLORS.darkGreyEnabled}
              marginX={SPACING.spacingL}
            >
              {'Labware Name'}
            </StyledText>
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              color={COLORS.darkBlack}
              marginX={SPACING.spacingL}
            >
              {'Example Labware'}
            </StyledText>
          </Flex>
        </Flex>
      </Box>
    </Modal>
  )
}

interface LiquidDetailCardProps {
  liquidId: string
  displayName: string
  description: string | null
  displayColor: string
  volume: string
  setSelectedValue: React.Dispatch<React.SetStateAction<string | null>>
  selectedValue: string | null
}

export function LiquidDetailCard(props: LiquidDetailCardProps): JSX.Element {
  const {
    liquidId,
    displayName,
    description,
    displayColor,
    volume,
    setSelectedValue,
    selectedValue,
  } = props
  const LIQUID_CARD_STYLE = css`
    ${BORDERS.cardOutlineBorder}

    &:hover {
      border: 1px solid ${COLORS.medGreyHover};
      cursor: pointer;
    }
  `
  const ACTIVE_STYLE = css`
    background-color: ${COLORS.lightBlue};
    border: 1px solid ${COLORS.blue};
  `
  return (
    <Box
      css={selectedValue === liquidId ? ACTIVE_STYLE : LIQUID_CARD_STYLE}
      borderRadius={BORDERS.radiusSoftCorners}
      marginBottom={SPACING.spacing3}
      padding={SPACING.spacing4}
      backgroundColor={COLORS.white}
      onClick={() => setSelectedValue(liquidId)}
      maxWidth={'10.3rem'}
      minHeight={'max-content'}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex
          css={BORDERS.cardOutlineBorder}
          padding={'0.75rem'}
          height={'max-content'}
          width={'max-content'}
          backgroundColor={COLORS.white}
        >
          <Icon name="circle" color={displayColor} size={SIZE_1} />
        </Flex>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginTop={SPACING.spacing3}
        >
          {displayName}
        </StyledText>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.darkGreyEnabled}
        >
          {description != null ? description : null}
        </StyledText>
        <Flex
          backgroundColor={COLORS.darkBlack + '1A'}
          borderRadius={BORDERS.radiusSoftCorners}
          height={'max-content'}
          width={'max-content'}
          paddingY={SPACING.spacing2}
          paddingX={SPACING.spacing3}
          marginTop={SPACING.spacing3}
        >
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {volume} {MICRO_LITERS}
          </StyledText>
        </Flex>
      </Flex>
    </Box>
  )
}
