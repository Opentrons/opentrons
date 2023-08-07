import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { RESPONSIVENESS, TYPOGRAPHY } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'

import type { ModuleCalibrationWizardStepProps } from './types'

export const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

export const PlaceAdapter = (
  props: ModuleCalibrationWizardStepProps
): JSX.Element | null => {
  const { proceed, goBack, attachedModule } = props
  const { t } = useTranslation('module_wizard_flows')
  const moduleName = getModuleDisplayName(attachedModule.moduleModel)
  const handleOnClick = (): void => {
    // TODO: send calibration/moveToMaintenance command here for the pipette
    // that will be used in calibration
    proceed()
  }

  const bodyText = <StyledText css={BODY_STYLE}>{t('place_flush')}</StyledText>

  return (
    <GenericWizardTile
      header={t('place_adapter', { module: moduleName })}
      // TODO: swap this out with the right animation
      rightHandBody={<p>TODO: place adapter contents</p>}
      bodyText={bodyText}
      proceedButtonText={t('confirm_placement')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
