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
import { TRASH_BIN_ADAPTER_FIXTURE } from '@opentrons/shared-data'
import { ListItem } from '../../../atoms/ListItem'
import { FlowRateEntry } from './FlowRate'
import { PipettePath } from './PipettePath'

import type {
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface AdvancedSettingsProps {
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
}

export function AdvancedSettings(props: AdvancedSettingsProps): JSX.Element | null {
  const { state, dispatch } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const [selectedSetting, setSelectedSetting] = React.useState<string | null>(
    null
  )


  const displayItems = [
    {
      option: t('aspirate_flow_rate'),
      value: t(`${state.aspirateFlowRate} µL/s`),
      onClick: () => {
        setSelectedSetting('aspirate_flow_rate')
      },
    },
    {
      option: t('dispense_flow_rate'),
      value: t(`${state.dispenseFlowRate} µL/s`
      ),
      onClick: () => {
        setSelectedSetting('dispense_flow_rate')
      },
    },{
      option: t('pipette_path'),
      value: t(`${state.path}` // TODO: set user facing options here.
      ),
      onClick: () => {
        setSelectedSetting('pipette_path')
      },
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
      {selectedSetting === 'aspirate_flow_rate' ? (
        <FlowRateEntry
          state={state}
          dispatch={dispatch}
          onBack={() => {
            setSelectedSetting(null)
          }}
        />
      ) : null}
      {selectedSetting === 'dispense_flow_rate' ? (
        <FlowRateEntry
          state={state}
          dispatch={dispatch}
          onBack={() => {
            setSelectedSetting(null)
          }}
        />
      ) : null}
      {selectedSetting === 'pipette_path' ? (
        <PipettePath
        state={state}
          dispatch={dispatch}
          onBack={() => {
            setSelectedSetting(null)
          }}
        />
      ) : null}
    </Flex>
  )
}
