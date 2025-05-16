import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  LegacyStyledText,
  RESPONSIVENESS,
  TYPOGRAPHY,
} from '@opentrons/components'

import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { SimpleWizardInProgressBody } from '/app/molecules/SimpleWizardBody'

import type {
  CreateCommand,
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { ModuleCalibrationWizardStepProps } from './types'

interface CloseDoorProps extends ModuleCalibrationWizardStepProps {
  deckConfig: DeckConfiguration
  fixtureIdByCutoutId: { [cutoutId in CutoutId]?: CutoutFixtureId }
}

const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

export const CloseDoor = (
  props: CloseDoorProps
): JSX.Element | null => {
  const {
    proceed,
    goBack,
    isRobotMoving,
    attachedModule,
    chainRunCommands,
    setErrorMessage,
  } = props
  const { t, i18n } = useTranslation(['module_wizard_flows'])
  
  const headerContent = (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <Icon name="ot-alert" size="2.5rem" />
      <LegacyStyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightBold}>
        {t('close_doors')}
      </LegacyStyledText>
    </Flex>
  )

  const bodyText = (
    <>
        <LegacyStyledText css={BODY_STYLE}>
          <Trans
            t={t}
            i18nKey={'close_doors_description'}
            components={{
              bold: <strong />,
            }}
          />
        </LegacyStyledText>
    </>
  )

  const handleHomeShuttle = (): void => {
    const homeCommands: CreateCommand[] = [
      {
        commandType: 'unsafe/flexStacker/prepareShuttle' as const,
        params: { moduleId: attachedModule.id, ignoreLatch: true },
      },
    ]

    chainRunCommands?.(homeCommands, false)
      .then(() => {
        proceed()
      })
      .catch((e: Error) => {
        setErrorMessage(`error homing stacker shuttle: ${e.message}`)
      })
  }

  if (isRobotMoving) {
    return (
      <SimpleWizardInProgressBody
        // TODO ND: 9/6/23 use spinner until animations are made
        alternativeSpinner={null}
        description={t('stand_back')}
      />
    )
  } 
  
  else {
    return (
      <GenericWizardTile
        header={headerContent}
        rightHandBody={null}
        bodyText={bodyText}
        proceedButtonText={t('continue')}
        proceed={handleHomeShuttle}
        back={goBack}
      />
    )
  } 
}
