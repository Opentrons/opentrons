import { useTranslation } from 'react-i18next'

import {
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'

import { useToaster } from '/app/organisms/ToasterOven'

import { DISPENSE_SETTING_OPTIONS as SETTING_OPTIONS } from '../../constants'

import type {
  DispenseSettingOption,
  QuickTransferSummaryState,
  SettingItem,
} from '../../types'

interface UseDispenseSettingsConfigProps {
  state: QuickTransferSummaryState
  setSelectedSetting: (setting: DispenseSettingOption | null) => void
}

export function useDispenseSettingsConfig({
  state,
  setSelectedSetting,
}: UseDispenseSettingsConfigProps): SettingItem[] {
  const { t, i18n } = useTranslation(['quick_transfer', 'shared'])
  const { makeSnackbar } = useToaster()

  const getBlowoutValueCopy = (): string | undefined => {
    if (state.blowOut === 'dest_well') {
      return t('blow_out_into_destination_well')
    } else if (state.blowOut === 'source_well') {
      return t('blow_out_into_source_well')
    } else if (
      state.blowOut != null &&
      state.blowOut.cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE
    ) {
      return t('blow_out_into_trash_bin')
    } else if (
      state.blowOut != null &&
      WASTE_CHUTE_FIXTURES.includes(state.blowOut.cutoutFixtureId)
    ) {
      return t('blow_out_into_waste_chute')
    }
  }

  const dispenseSettingsItems = [
    {
      option: 'dispense_flow_rate',
      copy: t('dispense_flow_rate'),
      value: t('flow_rate_value', { flow_rate: state.dispenseFlowRate }),
      enabled: true,
      onClick: () => {
        setSelectedSetting('dispense_flow_rate')
      },
    },
    {
      option: 'dispense_tip_position',
      copy: t('tip_position'),
      value:
        state.tipPositionDispense !== undefined
          ? t('tip_position_value', { position: state.tipPositionDispense })
          : '',
      enabled: true,
      onClick: () => {
        setSelectedSetting('dispense_tip_position')
      },
    },
    {
      option: 'dispense_submerge',
      copy: t('submerge'),
      value:
        state.submergeDispense !== undefined
          ? t('submerge_value', {
              speed: state.submergeDispense.speed,
              position: state.submergeDispense.positionFromBottom,
            })
          : '',
      enabled: true,
      onClick: () => {
        setSelectedSetting(SETTING_OPTIONS.DISPENSE_SUBMERGE)
      },
    },
    {
      option: 'dispense_delay',
      copy: t('delay'),
      value:
        state.delayDispense !== undefined
          ? t('delay_value', {
              delay: state.delayDispense.delayDuration,
              position: state.delayDispense.positionFromBottom,
            })
          : '',
      enabled: true,
      onClick: () => {
        setSelectedSetting('dispense_delay')
      },
    },
    {
      option: 'dispense_mix',
      copy: t('mix'),
      value:
        state.mixOnDispense !== undefined
          ? t('mix_value', {
              volume: state.mixOnDispense?.mixVolume,
              reps: state.mixOnDispense?.repetitions,
            })
          : '',
      enabled:
        state.transferType === 'transfer' ||
        state.transferType === 'consolidate',
      onClick: () => {
        if (
          state.transferType === 'transfer' ||
          state.transferType === 'consolidate'
        ) {
          setSelectedSetting('dispense_mix')
        } else {
          makeSnackbar(t('advanced_setting_disabled') as string)
        }
      },
    },
    // ToDo replace dummy configs for push out
    {
      option: 'dispense_push_out',
      copy: t('push_out'),
      value: 'dummy Push Out',
      enabled: false,
      onClick: () => {
        // (kk: 04/07/2025)ToDo add push out
        // setSelectedSetting('push_out')
      },
    },
    {
      option: 'dispense_retract',
      copy: t('retract'),
      value:
        state.retractDispense !== undefined
          ? t('retract_value', {
              speed: state.retractDispense.speed,
              position: state.retractDispense.positionFromBottom,
            })
          : '',
      enabled: true,
      onClick: () => {
        setSelectedSetting('dispense_retract')
      },
    },
    {
      option: 'dispense_blow_out',
      copy: t('blow_out'),
      value:
        state.transferType === 'distribute'
          ? t('disabled')
          : i18n.format(getBlowoutValueCopy(), 'capitalize'),
      enabled: state.transferType !== 'distribute',
      onClick: () => {
        if (state.transferType === 'distribute') {
          makeSnackbar(t('advanced_setting_disabled') as string)
        } else {
          setSelectedSetting('dispense_blow_out')
        }
      },
    },
    {
      option: 'dispense_touch_tip',
      copy: t('touch_tip'),
      value:
        state.touchTipDispense !== undefined
          ? t('touch_tip_value', {
              // speed: state.touchTipDispense.speed,
              // position: state.touchTipDispense.positionFromBottom,
            })
          : '',
      enabled: false,
      onClick: () => {
        console.log('will be implemented soon')
        // setSelectedSetting('dispense_touch_tip')
      },
    },
    {
      option: 'dispense_air_gap',
      copy: t('air_gap'),
      value:
        state.airGapDispense !== undefined
          ? t('air_gap_value', { volume: state.airGapDispense })
          : t('option_disabled'),
      enabled: true,
      onClick: () => {
        setSelectedSetting('dispense_air_gap')
      },
    },
  ]

  return dispenseSettingsItems
}
