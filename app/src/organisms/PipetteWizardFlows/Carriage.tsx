import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import capitalize from 'lodash/capitalize'
import { SPACING } from '@opentrons/components'
import { SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import unscrewCarriage from '../../assets/images/change-pip/unscrew-carriage.png'
import { FLOWS } from './constants'

import type { PipetteWizardStepProps } from './types'

export const Carriage = (props: PipetteWizardStepProps): JSX.Element | null => {
  const { goBack, proceed, flowType, selectedPipette } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])

  //  this should never happen but to be safe
  if (selectedPipette === SINGLE_MOUNT_PIPETTES || flowType === FLOWS.CALIBRATE)
    return null

  return (
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
      proceedButtonText={capitalize(t('shared:continue'))}
      proceed={proceed}
      back={goBack}
    />
  )
}
