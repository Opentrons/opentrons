import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import capitalize from 'lodash/capitalize'
import {
  TYPOGRAPHY,
  COLORS,
  SPACING,
  PrimaryButton,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { getPipetteAnimations96 } from './utils'
import { BODY_STYLE, FLOWS, SECTIONS } from './constants'

import type { PipetteWizardStepProps } from './types'

export const Carriage = (props: PipetteWizardStepProps): JSX.Element | null => {
  const {
    goBack,
    flowType,
    isOnDevice,
    proceed,
    chainRunCommands,
    errorMessage,
    setShowErrorMessage,
  } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])

  const handleReattachCarriageProceed = (): void => {
    chainRunCommands?.(
      [
        {
          commandType: 'home' as const,
          params: {
            axes: ['rightZ'],
          },
        },
      ],
      false
    )
      .then(() => {
        proceed()
      })
      .catch(error => {
        setShowErrorMessage(error.message)
      })
  }

  return errorMessage != null ? (
    <SimpleWizardBody
      isSuccess={false}
      iconColor={COLORS.errorEnabled}
      header={t('shared:error_encountered')}
      subHeader={
        <Trans
          t={t}
          i18nKey={'detach_pipette_error'}
          values={{ error: errorMessage }}
          components={{
            block: <StyledText as="p" />,
            bold: (
              <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold} />
            ),
          }}
        />
      }
    />
  ) : (
    <GenericWizardTile
      header={i18n.format(
        t(flowType === FLOWS.ATTACH ? 'unscrew_carriage' : 'reattach_carriage'),
        'capitalize'
      )}
      rightHandBody={getPipetteAnimations96({
        section: SECTIONS.CARRIAGE,
        flowType: flowType,
      })}
      bodyText={
        <Trans
          t={t}
          i18nKey={
            flowType === FLOWS.ATTACH ? 'unscrew_at_top' : 'how_to_reattach'
          }
          components={{
            block: (
              <StyledText css={BODY_STYLE} marginBottom={SPACING.spacing16} />
            ),
          }}
        />
      }
      back={flowType === FLOWS.ATTACH ? undefined : goBack}
      proceedButton={
        isOnDevice ? (
          <SmallButton
            onClick={
              flowType === FLOWS.ATTACH
                ? proceed
                : handleReattachCarriageProceed
            }
            buttonText={capitalize(t('shared:continue'))}
          />
        ) : (
          <PrimaryButton
            onClick={
              flowType === FLOWS.ATTACH
                ? proceed
                : handleReattachCarriageProceed
            }
          >
            {capitalize(t('shared:continue'))}
          </PrimaryButton>
        )
      }
    />
  )
}
