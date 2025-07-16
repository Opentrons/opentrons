import { useTranslation } from 'react-i18next'

import { useToaster } from '/app/organisms/ToasterOven'

import { ASPIRATE_SETTING_OPTIONS as SETTING_OPTIONS } from '../../constants'

import type { Dispatch } from 'react'
import type {
  AspirateSettingOption,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
  SettingItem,
} from '../../types'

interface UseAspirateSettingsConfigProps {
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  setSelectedSetting: (setting: AspirateSettingOption | null) => void
  isMultiTransfer: boolean
}

export function useAspirateSettingsConfig({
  state,
  dispatch,
  setSelectedSetting,
  isMultiTransfer,
}: UseAspirateSettingsConfigProps): SettingItem[] {
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const { makeSnackbar } = useToaster()

  const sourceIsReservoir =
    state.source.metadata.displayCategory === 'reservoir'

  const aspirateSettingsItems: SettingItem[] = [
    {
      option: SETTING_OPTIONS.ASPIRATE_FLOW_RATE,
      copy: t('aspirate_flow_rate'),
      value: t('flow_rate_value', { flow_rate: state.aspirateFlowRate }),
      enabled: true,
      onClick: () => {
        setSelectedSetting(SETTING_OPTIONS.ASPIRATE_FLOW_RATE)
      },
    },
    {
      option: SETTING_OPTIONS.ASPIRATE_TIP_POSITION,
      copy: t('tip_position'),
      value:
        state.tipPositionAspirate !== null
          ? t('tip_position_value', { position: state.tipPositionAspirate })
          : '',
      enabled: true,
      onClick: () => {
        setSelectedSetting(SETTING_OPTIONS.ASPIRATE_TIP_POSITION)
      },
    },
    {
      option: SETTING_OPTIONS.ASPIRATE_SUBMERGE,
      copy: t('submerge'),
      value:
        state.submergeAspirate !== undefined
          ? t('submerge_value', {
              speed: state.submergeAspirate.speed,
              delayDuration: state.submergeAspirate.delayDuration,
              position: state.submergeAspirate.positionFromBottom,
            })
          : '',
      enabled: true,
      onClick: () => {
        setSelectedSetting(SETTING_OPTIONS.ASPIRATE_SUBMERGE)
      },
    },
    {
      option: SETTING_OPTIONS.PRE_WET_TIP,
      copy: t('pre_wet_tip'),
      value: state.preWetTip ? t('option_enabled') : t('option_disabled'),
      enabled: true,
      onClick: () => {
        setSelectedSetting(SETTING_OPTIONS.PRE_WET_TIP)
      },
    },
    {
      option: SETTING_OPTIONS.ASPIRATE_MIX,
      copy: t('mix'),
      value:
        state.mixOnAspirate !== undefined
          ? t('mix_value', {
              volume: state.mixOnAspirate?.mixVolume,
              reps: state.mixOnAspirate?.repetitions,
            })
          : '',
      enabled:
        state.transferType === 'transfer' ||
        state.transferType === 'distribute',
      onClick: () => {
        if (
          state.transferType === 'transfer' ||
          state.transferType === 'distribute'
        ) {
          setSelectedSetting(SETTING_OPTIONS.ASPIRATE_MIX)
        } else {
          makeSnackbar(t('advanced_setting_disabled') as string)
        }
      },
    },
    {
      option: SETTING_OPTIONS.ASPIRATE_CONDITION,
      copy: t('condition'),
      value:
        state.conditionAspirate != null || state.conditionAspirate !== 0
          ? t('volume', { volume: state.conditionAspirate })
          : '',
      enabled: isMultiTransfer,
      onClick: () => {
        setSelectedSetting(SETTING_OPTIONS.ASPIRATE_CONDITION)
      },
    },
    {
      option: SETTING_OPTIONS.ASPIRATE_DELAY,
      copy: t('delay'),
      value:
        state.delayAspirate !== undefined
          ? t('delay_value', {
              delay: state.delayAspirate.delayDuration,
            })
          : '',
      enabled: true,
      onClick: () => {
        setSelectedSetting(SETTING_OPTIONS.ASPIRATE_DELAY)
      },
    },
    {
      option: SETTING_OPTIONS.ASPIRATE_RETRACT,
      copy: t('retract'),
      value:
        state.retractAspirate !== undefined
          ? t('retract_value', {
              speed: state.retractAspirate.speed,
              delayDuration: state.retractAspirate.delayDuration,
              position: state.retractAspirate.positionFromBottom,
            })
          : '',
      enabled: true,
      onClick: () => {
        setSelectedSetting(SETTING_OPTIONS.ASPIRATE_RETRACT)
      },
    },
    {
      option: SETTING_OPTIONS.ASPIRATE_TOUCH_TIP,
      copy: t('touch_tip'),
      value:
        state.touchTipAspirate !== undefined
          ? t('touch_tip_value', {
              speed: state.touchTipAspirateSpeed,
              position: state.touchTipAspirate,
            })
          : '',
      enabled: !sourceIsReservoir,
      onClick: () => {
        if (!sourceIsReservoir) {
          setSelectedSetting(SETTING_OPTIONS.ASPIRATE_TOUCH_TIP)
        } else {
          makeSnackbar(t('advanced_setting_disabled') as string)
        }
      },
    },
    {
      option: SETTING_OPTIONS.ASPIRATE_AIR_GAP,
      copy: t('air_gap'),
      value:
        state.airGapAspirate !== undefined
          ? t('air_gap_value', { volume: state.airGapAspirate })
          : t('option_disabled'),
      enabled: true,
      onClick: () => {
        setSelectedSetting(SETTING_OPTIONS.ASPIRATE_AIR_GAP)
      },
    },
  ]

  return aspirateSettingsItems.filter(
    item =>
      item.option !== SETTING_OPTIONS.ASPIRATE_CONDITION || isMultiTransfer
  )
}
