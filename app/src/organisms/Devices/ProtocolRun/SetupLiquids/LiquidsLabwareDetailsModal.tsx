import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Modal } from '../../../../atoms/Modal'
import { StyledText } from '../../../../atoms/text'
import { LiquidDetailCard } from './LiquidDetailCard'

// TODO(sh: 2022-06-14): remove mock data once liquids are implemented in analysis
const MOCK_LIQUID_DATA = [
  {
    liquidId: '0',
    displayColor: '#B925FF',
    displayName: 'Cell Line 1',
    description: 'eluted stick samples',
    volumeByWell: { A1: 20 },
  },
  {
    liquidId: '1',
    displayColor: '#ffd600',
    displayName: 'Cell Line 2',
    description: 'eluted stick samples',
    volumeByWell: { A1: 100 },
  },
  {
    liquidId: '2',
    displayColor: '#9dffd8',
    displayName: 'Cell Line 3',
    description: 'eluted stick samples',
    volumeByWell: { A1: 200 },
  },
  {
    liquidId: '3',
    displayColor: '#ff9900',
    displayName: 'Cell Line 4',
    description: 'eluted stick samples',
    volumeByWell: { A1: 250 },
  },
]

interface LiquidsLabwareDetailsModalProps {
  liquidId: string
  closeModal: () => void
}

export const LiquidsLabwareDetailsModal = (
  props: LiquidsLabwareDetailsModalProps
): JSX.Element => {
  const { liquidId, closeModal } = props
  const { t } = useTranslation('protocol_setup')
  const [selectedValue, setSelectedValue] = React.useState<
    typeof liquidId | null
  >(liquidId)

  const HIDE_SCROLLBAR = css`
    ::-webkit-scrollbar {
      display: none;
    }
  `

  return (
    <Modal
      onClose={closeModal}
      title={'Labware Name'}
      contentBackgroundColor={COLORS.background}
      closeOnOutsideClick
    >
      <Box>
        <Flex flexDirection={DIRECTION_ROW}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            css={HIDE_SCROLLBAR}
            maxHeight={'27.125rem'}
            overflowY={'auto'}
          >
            {MOCK_LIQUID_DATA.map(data => {
              return (
                <LiquidDetailCard
                  key={data.liquidId}
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
              {t('slot_number')}
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
              {t('labware_name')}
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
