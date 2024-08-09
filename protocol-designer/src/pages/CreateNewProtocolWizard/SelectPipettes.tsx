import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
  RadioButton,
} from '@opentrons/components'
import { WizardBody } from './WizardBody'

import type { WizardTileProps } from './types'

export function SelectPipettes(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed, watch } = props
  const { t } = useTranslation(['create_new_protocol', 'shared'])
  //   const pipettesByMount = watch('pipettesByMount')
  const fields = watch('fields')
  const [pipetteType, setPipetteType] = React.useState<string | null>(null)

  return (
    <WizardBody
      stepNumber={2}
      header={t('add_pip')}
      subHeader={t('which_pip')}
      proceed={() => {
        proceed(1)
      }}
      goBack={() => {
        goBack(1)
      }}
      disabled={false}
      //   disabled={
      //     pipettesByMount.left.tiprackDefURI == null &&
      //     pipettesByMount.right.tiprackDefURI == null
      //   }
    >
      <>
        <StyledText
          desktopStyle="headingSmallBold"
          marginBottom={SPACING.spacing16}
        >
          {t('pip_type')}
        </StyledText>
        <Flex gridGap={SPACING.spacing4}>
          <RadioButton
            onChange={() => {
              setPipetteType('single')
            }}
            buttonLabel={t('shared:one_channel')}
            buttonValue="single"
            isSelected={pipetteType === 'single'}
          />
          <RadioButton
            onChange={() => {
              setPipetteType('multi')
            }}
            buttonLabel={t('shared:eight_channel')}
            buttonValue="multi"
            isSelected={pipetteType === 'multi'}
          />
          {fields.robotType === OT2_ROBOT_TYPE ? null : (
            <RadioButton
              onChange={() => {
                setPipetteType('96')
              }}
              buttonLabel={t('shared:ninety_six_channel')}
              buttonValue="96"
              isSelected={pipetteType === '96'}
            />
          )}
        </Flex>
      </>
      {pipetteType != null ? (
        <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING.spacing32}>
          <StyledText
            desktopStyle="headingSmallBold"
            marginBottom={SPACING.spacing16}
          >
            {t('pip_vol')}
          </StyledText>
          <Flex gridGap={SPACING.spacing4}>
            {'TODO: finish up this component'}
          </Flex>
        </Flex>
      ) : null}
    </WizardBody>
  )
}
