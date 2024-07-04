import * as React from 'react'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  ALIGN_CENTER,
  COLORS,
  TEXT_ALIGN_RIGHT,
  StyledText,
  Icon,
  SIZE_2,
  TEXT_ALIGN_LEFT,
} from '@opentrons/components'

import type {
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'
import { useTranslation } from 'react-i18next'
import { ListItem } from '../../../atoms/ListItem'
import { FlowRateEntry } from './FlowRate'
import { PipettePath } from './PipettePath'
import { TipPositionEntry } from './TipPosition'
import { Mix } from './Mix'

interface QuickTransferAdvancedSettingsProps {
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
}

export function QuickTransferAdvancedSettings(
  props: QuickTransferAdvancedSettingsProps
): JSX.Element | null {
  const { state, dispatch } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const [selectedSetting, setSelectedSetting] = React.useState<string | null>(
    null
  )

  let pipettePath: string = ''
  if (state.path === 'single') {
    pipettePath = t('pipette_path_single')
  } else if (state.path === 'multiAspirate') {
    pipettePath = t('pipette_path_multi_aspirate')
  } else if (state.path === 'multiDispense') {
    pipettePath = t('pipette_path_multi_dispense')
  }

  const baseSettingsItems = [
    {
      option: t('aspirate_flow_rate'),
      value: t('flow_rate_value', { flow_rate: state.aspirateFlowRate }),
      enabled: true,
      onClick: () => {
        setSelectedSetting('aspirate_flow_rate')
      },
    },
    {
      option: t('dispense_flow_rate'),
      value: t('flow_rate_value', { flow_rate: state.dispenseFlowRate }),
      enabled: true,
      onClick: () => {
        setSelectedSetting('dispense_flow_rate')
      },
    },
    {
      option: t('pipette_path'),
      value: pipettePath,
      enabled: state.transferType !== 'transfer',
      onClick: () => {
        if (state.transferType !== 'transfer')
          setSelectedSetting('pipette_path')
      },
    },
  ]

  // Aspirate Settings
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

  const aspirateSettingsItems = [
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
    <Flex
      gridGap={SPACING.spacing40}
      flexDirection={DIRECTION_COLUMN}
      marginTop="12rem"
    >
      {/*Base Settings*/}
      <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
        {selectedSetting == null
          ? baseSettingsItems.map(displayItem => (
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
                      {displayItem.value}
                    </StyledText>
                    {displayItem.enabled ? (
                      <Icon name="more" size={SIZE_2} />
                    ) : null}
                  </Flex>
                </Flex>
              </ListItem>
            ))
          : null}
        {selectedSetting === 'aspirate_flow_rate' ? (
          <FlowRateEntry
            kind="aspirate"
            state={state}
            dispatch={dispatch}
            onBack={() => {
              setSelectedSetting(null)
            }}
          />
        ) : null}
        {selectedSetting === 'dispense_flow_rate' ? (
          <FlowRateEntry
            kind="dispense"
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

      {/*Aspirate Settings*/}
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
            ? aspirateSettingsItems.map(displayItem => (
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
                        {displayItem.value !== ''
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
            <TipPositionEntry // TODO: WRONG COMPONENT
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
    </Flex>
  )
}
