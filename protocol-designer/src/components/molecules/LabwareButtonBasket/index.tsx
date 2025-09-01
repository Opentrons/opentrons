import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { LabwareButton } from '../../atoms'
import styles from './labwarebuttonbasket.module.css'

import type { Dispatch, SetStateAction } from 'react'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

interface LabwareButtonBasketProps {
  stackOfLabware: string[]
  labware: AllTemporalPropertiesForTimelineFrame['labware']
  setSelectedLabware: Dispatch<SetStateAction<string>>
  selectedLabware: string
}
export function LabwareButtonBasket(
  props: LabwareButtonBasketProps
): JSX.Element {
  const { stackOfLabware, labware, selectedLabware, setSelectedLabware } = props
  const { t } = useTranslation('protocol_steps')

  return (
    <div className={styles.basket}>
      <StyledText desktopStyle="captionRegular">{t('top_of_stack')}</StyledText>
      <div className={styles.basket_container}>
        {stackOfLabware.map((item, index) => (
          <LabwareButton
            key={`${item}_${index}`}
            numberInStack={index + 1}
            displayName={labware[item].def.metadata.displayName}
            isSelected={selectedLabware === item}
            onClick={id => {
              setSelectedLabware(id)
            }}
            id={item}
          />
        ))}
      </div>
      <StyledText desktopStyle="captionRegular">
        {t('bottom_of_stack')}
      </StyledText>
    </div>
  )
}
