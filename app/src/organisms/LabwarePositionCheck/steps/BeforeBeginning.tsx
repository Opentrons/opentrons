import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { LegacyStyledText } from '@opentrons/components'

import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'
import { WizardRequiredEquipmentList } from '/app/molecules/WizardRequiredEquipmentList'
import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'

import type { ReactNode } from 'react'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'
import type { State } from '/app/redux/types'

export function BeforeBeginning(props: LPCWizardContentProps): ReactNode {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const { runId, commandUtils } = props
  const { protocolName } = useSelector(
    (state: State) => state.protocolRuns[runId]?.lpc
  ) ?? { protocolName: '', labwareDefs: [] }

  const requiredEquipmentList = [
    {
      loadName: t('all_modules_and_labware_from_protocol', {
        protocol_name: protocolName,
      }),
      displayName: t('all_modules_and_labware_from_protocol', {
        protocol_name: protocolName,
      }),
    },
    { loadName: 'calibration_probe', displayName: t('calibration_probe') },
  ]

  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      desktopHeaderBtnCopy={t('exit')}
      desktopFooterBtnCopy={t('move_gantry_to_front')}
      oddHeaderBtnCopy={t('move_gantry_to_front')}
      onClickButton={commandUtils.headerCommands.handleProceed}
      secondaryButtonProps={{
        buttonText: t('exit'),
        buttonCategory: 'rounded',
        buttonType: 'tertiaryLowLight',
        onClick: commandUtils.headerCommands.handleCloseWithoutHome,
      }}
    >
      <TwoColumn>
        <DescriptionContent
          headline={t('shared:before_you_begin')}
          message={
            <Trans
              t={t}
              i18nKey="labware_position_check_description"
              components={{ block: <LegacyStyledText forwardedAs="p" /> }}
            />
          }
        />
        {/* TODO(jh, 02-25-25): EXEC-1245. */}
        <WizardRequiredEquipmentList equipmentList={requiredEquipmentList} />
      </TwoColumn>
    </LPCContentContainer>
  )
}
