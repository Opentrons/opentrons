import { useTranslation } from 'react-i18next'
import { useToaster } from '/app/organisms/ToasterOven'
import { ACTIONS } from '../../constants'

import type { Dispatch } from 'react'
import type {
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../../types'

export interface SettingItem {
  option: string
  copy: string
  value: string
  enabled: boolean
  onClick: () => void
}

interface UseAspirateSettingsConfigProps {
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  setSelectedSetting: (setting: string | null) => void
}

export function useAspirateSettingsConfig(
  props: UseAspirateSettingsConfigProps
): SettingItem[] {
  const { state, dispatch, setSelectedSetting } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const { makeSnackbar } = useToaster()

  const sourceIsReservoir =
    state.source.metadata.displayCategory === 'reservoir'

  const SETTING_OPTIONS = {
    ASPIRATE_FLOW_RATE: 'aspirate_flow_rate',
    ASPIRATE_TIP_POSITION: 'aspirate_tip_position',
    ASPIRATE_SUBMERGE: 'aspirate_submerge',
    PRE_WET_TIP: 'pre_wet_tip',
    ASPIRATE_MIX: 'aspirate_mix',
    ASPIRATE_DELAY: 'aspirate_delay',
    ASPIRATE_RETRACT: 'aspirate_retract',
    ASPIRATE_TOUCH_TIP: 'aspirate_touch_tip',
    ASPIRATE_AIR_GAP: 'aspirate_air_gap',
  } as const

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
    // ToDo replace dummy configs for submerge
    {
      option: SETTING_OPTIONS.ASPIRATE_SUBMERGE,
      copy: t('submerge'),
      value: '', // t('submerge_value', { volume: 'dummy' }),
      enabled: false,
      onClick: () => {},
    },
    {
      option: SETTING_OPTIONS.PRE_WET_TIP,
      copy: t('pre_wet_tip'),
      value: state.preWetTip ? t('option_enabled') : '',
      enabled: true,
      onClick: () => {
        dispatch({
          type: ACTIONS.SET_PRE_WET_TIP,
          preWetTip: !state.preWetTip,
        })
      },
    },
    {
      option: SETTING_OPTIONS.ASPIRATE_MIX,
      copy: t('mix'),
      value:
        state.mixOnAspirate !== undefined
          ? t('mix_value', {
              volume: state.mixOnAspirate?.mixVolume,
              reps: state.mixOnAspirate?.repititions,
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
      option: SETTING_OPTIONS.ASPIRATE_DELAY,
      copy: t('delay'),
      value:
        state.delayAspirate !== undefined
          ? t('delay_value', {
              delay: state.delayAspirate.delayDuration,
              position: state.delayAspirate.positionFromBottom,
            })
          : '',
      enabled: true,
      onClick: () => {
        setSelectedSetting(SETTING_OPTIONS.ASPIRATE_DELAY)
      },
    },
    // ToDo replace dummy configs for retract
    {
      option: SETTING_OPTIONS.ASPIRATE_RETRACT,
      copy: t('retract'),
      value: '', // t('submerge_value', { volume: 'dummy' }),
      enabled: false,
      onClick: () => {},
    },
    {
      option: SETTING_OPTIONS.ASPIRATE_TOUCH_TIP,
      copy: t('touch_tip'),
      value:
        state.touchTipAspirate !== undefined
          ? t('touch_tip_value', { position: state.touchTipAspirate })
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
          : '',
      enabled: true,
      onClick: () => {
        setSelectedSetting(SETTING_OPTIONS.ASPIRATE_AIR_GAP)
      },
    },
  ]

  return aspirateSettingsItems
}
