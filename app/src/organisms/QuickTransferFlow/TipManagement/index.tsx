import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  StyledText,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  COLORS,
  TEXT_ALIGN_RIGHT,
  Icon,
  SIZE_2,
  ALIGN_CENTER,
} from '@opentrons/components'
import { ListItem } from '../../../atoms/ListItem'
import { ChangeTip } from './ChangeTip'
import { TipDropLocation } from './TipDropLocation'

import type {
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface TipManagementProps {
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
}

export function TipManagement(props: TipManagementProps): JSX.Element | null {
  const { state, dispatch } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const [selectedSetting, setSelectedSetting] = React.useState<string | null>(
    null
  )

  const displayItems = [
    {
      option: t('change_tip'),
      value: t(`${state.changeTip}`),
      onClick: () => setSelectedSetting('change_tip'),
    },
    {
      option: t('tip_drop_location'),
      value: t(`${state.dropTipLocation}`),
      onClick: () => setSelectedSetting('tip_drop_location'),
    },
  ]

  return (
    <Flex
      gridGap={SPACING.spacing8}
      flexDirection={DIRECTION_COLUMN}
      marginTop="192px"
    >
      {selectedSetting == null
        ? displayItems.map(displayItem => (
            <ListItem
              type="noActive"
              key={displayItem.option}
              onClick={displayItem.onClick}
            >
              <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
                <StyledText css={TYPOGRAPHY.level4HeaderSemiBold} width="20rem">
                  {displayItem.option}
                </StyledText>
                <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
                  <StyledText
                    css={TYPOGRAPHY.level4HeaderRegular}
                    color={COLORS.grey60}
                    textAlign={TEXT_ALIGN_RIGHT}
                  >
                    {displayItem.value}
                  </StyledText>
                  <Icon name="more" size={SIZE_2} />
                </Flex>
              </Flex>
            </ListItem>
          ))
        : null}
      {selectedSetting === 'change_tip' ? (
        <ChangeTip
          state={state}
          dispatch={dispatch}
          onBack={() => setSelectedSetting(null)}
        />
      ) : null}
      {selectedSetting === 'tip_drop_location' ? (
        <TipDropLocation
          state={state}
          dispatch={dispatch}
          onBack={() => setSelectedSetting(null)}
        />
      ) : null}
    </Flex>
  )
}
