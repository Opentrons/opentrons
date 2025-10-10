import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  Flex,
  ListButton,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { AUTOMATIC, MANUAL } from '@opentrons/step-generation'

import { TipSelectionWizard } from './TipSelectionWizard'
import styles from './tiptrackingfield.module.css'

import type { TipTrackingOption } from '@opentrons/step-generation'
import type { FieldPropsByName } from '../types'

interface TipTrackingFieldProps {
  propsForFields: FieldPropsByName
  padding?: string
}

export function TipTrackingField(props: TipTrackingFieldProps): JSX.Element {
  const { propsForFields } = props
  const { t } = useTranslation('form')
  const [showTipSelectionModal, setShowTipSelectionModal] = useState<boolean>(
    false
  )
  const tipTrackingOptions: Array<{
    title: string
    description: string
    value: TipTrackingOption
  }> = [
    {
      title: t('step_edit_form.field.tip_tracking.options.automatic.title'),
      description: t(
        'step_edit_form.field.tip_tracking.options.automatic.description'
      ),
      value: AUTOMATIC,
    },
    {
      title: t('step_edit_form.field.tip_tracking.options.manual.title'),
      description: t(
        'step_edit_form.field.tip_tracking.options.manual.description'
      ),
      value: MANUAL,
    },
  ]

  return (
    <Flex className={styles.container}>
      <Flex className={styles.options_container}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('step_edit_form.field.tip_tracking.label')}
        </StyledText>
        <Flex className={styles.radio_buttons_container}>
          {tipTrackingOptions.map(({ title, description, value }, i) => (
            <RadioButton
              key={i}
              buttonLabel={title}
              buttonSubLabel={{
                label: description,
                align: 'vertical',
              }}
              buttonValue={value}
              onChange={() => {
                propsForFields.tip_tracking.updateValue(value)
              }}
              isSelected={propsForFields.tip_tracking.value === value}
              largeDesktopBorderRadius
            />
          ))}
        </Flex>
      </Flex>
      {propsForFields.tip_tracking.value === MANUAL && (
        <Flex className={styles.manual_container}>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t('step_edit_form.field.tip_tracking.manual.title')}
          </StyledText>
          <ListButton
            width="100%"
            padding={`${SPACING.spacing20} ${SPACING.spacing12}`}
            type="noActive"
            onClick={() => {
              setShowTipSelectionModal(true)
            }}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {t(
                'step_edit_form.field.tip_tracking.manual.description.no_tips'
              )}
            </StyledText>
          </ListButton>
        </Flex>
      )}
      {showTipSelectionModal && (
        <TipSelectionWizard
          setShowTipSelectionModal={setShowTipSelectionModal}
          formTiprackUri={propsForFields.tipRack.value as string}
          pipetteId={propsForFields.pipette.value as string}
        />
      )}
    </Flex>
  )
}
