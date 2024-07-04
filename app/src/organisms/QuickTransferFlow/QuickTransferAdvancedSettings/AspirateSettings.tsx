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
  TEXT_ALIGN_LEFT,
  Icon,
  SIZE_2,
  ALIGN_CENTER,
} from '@opentrons/components'
import { ListItem } from '../../../atoms/ListItem'
import { TipPositionEntry } from './TipPosition'
import { Mix } from './Mix'

import type {
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface AspirateSettingsProps {
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
}

export function AspirateSettings(
  props: AspirateSettingsProps
): JSX.Element | null {
  const { state, dispatch } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const [selectedSetting, setSelectedSetting] = React.useState<string | null>(
    null
  )

  let tipPositionValueCopy = state.tipPositionAspirate
    ? t('tip_position_value', { position: state.tipPositionAspirate })
    : ''
  let preWetTipValueCopy = state.preWetTip ? t('option_enabled') : ''
  let aspirateMixValueCopy = state.mixOnAspirate
    ? t('aspirate_mix_value', {
        volume: state.mixOnAspirate?.mixVolume,
        reps: state.mixOnAspirate?.repititions,
      })
    : ''
  let aspirateDelayValueCopy =
    state.delayAspirate && state.tipPositionAspirate
      ? t('aspirate_delay_value', {
          delay: state.delayAspirate,
          position: state.tipPositionAspirate,
        })
      : ''
  let touchTipValueCopy = state.touchTipAspirate
    ? t('touch_tip_aspirate_value')
    : ''
  let airGapValueCopy = state.airGapAspirate
    ? t('air_gap_value', { volume: state.airGapAspirate })
    : ''

  const displayItems = [
    {
      option: t('tip_position'),
      value: tipPositionValueCopy,
      enabled: true,
      onClick: () => {
        setSelectedSetting('aspirate_tip_position')
      },
    },
    {
      option: t('aspirate_pre_wet_tip'),
      value: preWetTipValueCopy,
      enabled: true,
      onClick: () => {
        setSelectedSetting('aspirate_pre_wet_tip')
      },
    },
    {
      option: t('aspirate_mix'),
      value: aspirateMixValueCopy,
      enabled: true,
      onClick: () => {
        setSelectedSetting('aspirate_mix')
      },
    },
    {
      option: t('aspirate_delay'),
      value: aspirateDelayValueCopy,
      enabled: true,
      onClick: () => {
        setSelectedSetting('aspirate_delay')
      },
    },
    {
      option: t('touch_tip'),
      value: touchTipValueCopy,
      enabled: true,
      onClick: () => {
        setSelectedSetting('aspirate_touch_tip')
      },
    },
    {
      option: t('air_gap'),
      value: airGapValueCopy,
      enabled: true,
      onClick: () => {
        setSelectedSetting('aspirate_air_gap')
      },
    },
  ]

  return (
    <Flex gridGap={SPACING.spacing16} flexDirection={DIRECTION_COLUMN}>
      {selectedSetting === null ? (
        <StyledText
          css={TYPOGRAPHY.level4HeaderSemiBold}
          color={COLORS.grey60}
          textAlign={TEXT_ALIGN_LEFT}
        >
          {t('aspirate_settings')}
        </StyledText>
      ) : null}
      <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
        {selectedSetting === null
          ? displayItems.map(displayItem => (
              <ListItem
                type="noActive"
                key={displayItem.option}
                onClick={displayItem.onClick}
              >
                <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
                  <StyledText
                    css={TYPOGRAPHY.level4HeaderSemiBold}
                    width="20rem"
                  >
                    {displayItem.option}
                  </StyledText>
                  <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
                    <StyledText
                      css={TYPOGRAPHY.level4HeaderRegular}
                      color={COLORS.grey60}
                      textAlign={TEXT_ALIGN_RIGHT}
                    >
                      {displayItem.value
                        ? displayItem.value
                        : t('option_disabled')}
                    </StyledText>
                    {displayItem.enabled ? (
                      <Icon name="more" size={SIZE_2} />
                    ) : null}
                  </Flex>
                </Flex>
              </ListItem>
            ))
          : null}
        {selectedSetting === 'aspirate_tip_position' ? (
          <TipPositionEntry
            kind={'aspirate'}
            state={state}
            dispatch={dispatch}
            onBack={() => {
              setSelectedSetting(null)
            }}
          />
        ) : null}
        {selectedSetting === 'aspirate_pre_wet_tip' ? (
          <TipPositionEntry // WRONG COMPONENT
            kind={'aspirate'}
            state={state}
            dispatch={dispatch}
            onBack={() => {
              setSelectedSetting(null)
            }}
          />
        ) : null}
        {selectedSetting === 'aspirate_mix' ? (
          <Mix
            kind={'aspirate'}
            state={state}
            dispatch={dispatch}
            onBack={() => {
              setSelectedSetting(null)
            }}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
