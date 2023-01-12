import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import capitalize from 'lodash/capitalize'
import {
  COLORS,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'
import unscrewCarriage from '../../assets/images/change-pip/unscrew-carriage.png'
import { FLOWS } from './constants'
import { CheckZAxisButton } from './CheckZaxisButton'

import type { PipetteWizardStepProps, ZAxisScrewStatus } from './types'

export const Carriage = (props: PipetteWizardStepProps): JSX.Element | null => {
  const { goBack, proceed, flowType, selectedPipette } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  const [
    zAxisScrewStatus,
    setZAxisScrewStatus,
  ] = React.useState<ZAxisScrewStatus>('unknown')

  React.useEffect(() => {
    if (zAxisScrewStatus === 'attached' || zAxisScrewStatus === 'detached')
      proceed()
  }, [proceed, zAxisScrewStatus])

  //  this should never happen but to be safe
  if (selectedPipette === SINGLE_MOUNT_PIPETTES || flowType === FLOWS.CALIBRATE)
    return null

  return zAxisScrewStatus === 'stillAttached' ? (
    <SimpleWizardBody
      iconColor={COLORS.errorEnabled}
      header={t('z_axis_still_attached')}
      subHeader={t('detach_z_axis_screw_again')}
      isSuccess={false}
    >
      <SecondaryButton
        onClick={() => setZAxisScrewStatus('unknown')}
        marginRight={SPACING.spacing2}
      >
        {t('cancel_attachment')}
      </SecondaryButton>
      <PrimaryButton
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        //  TODO(jr 1/12/23): wire this up correctly when we wire up backend for checking z axis screw
        onClick={() => setZAxisScrewStatus('attached')}
      >
        {t('shared:try_again')}
      </PrimaryButton>
    </SimpleWizardBody>
  ) : (
    <GenericWizardTile
      header={t(
        flowType === FLOWS.ATTACH ? 'unscrew_carriage' : 'reattach_carriage'
      )}
      rightHandBody={
        <img
          //  TODO(jr 12/2/22): update images
          src={flowType === FLOWS.ATTACH ? unscrewCarriage : unscrewCarriage}
          style={{ marginTop: '-3.5rem' }}
          alt={
            flowType === FLOWS.ATTACH ? 'Unscrew gantry' : 'Reattach carriage'
          }
        />
      }
      bodyText={
        <Trans
          t={t}
          i18nKey={
            flowType === FLOWS.ATTACH ? 'unscrew_at_top' : 'how_to_reattach'
          }
          components={{
            block: <StyledText as="p" marginBottom={SPACING.spacing4} />,
          }}
        />
      }
      back={goBack}
      proceedButton={
        <CheckZAxisButton
          proceedButtonText={capitalize(t('shared:continue'))}
          setZAxisScrewStatus={setZAxisScrewStatus}
        />
      }
    />
  )
}
