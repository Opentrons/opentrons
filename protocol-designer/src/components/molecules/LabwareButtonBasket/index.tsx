import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { LabwareButton } from '../../organisms/LabwareButton'
import styles from './labwarebuttonbasket.module.css'

import type { MouseEvent, ReactNode } from 'react'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

interface LabwareButtonBasketProps {
  stackOfLabware: string[]
  labware: AllTemporalPropertiesForTimelineFrame['labware']
  setSelectedLabware: (
    selectedLabwareId: string,
    event: MouseEvent<HTMLButtonElement>
  ) => void
  selectedLabware: string[]
}
export function LabwareButtonBasket(
  props: LabwareButtonBasketProps
): ReactNode {
  const { stackOfLabware, labware, selectedLabware, setSelectedLabware } = props
  const { t } = useTranslation('protocol_steps')

  return (
    <div className={styles.basket}>
      <StyledText desktopStyle="captionRegular">{t('top_of_stack')}</StyledText>
      <div className={styles.basket_container}>
        {stackOfLabware.map((item, index) =>
          labware[item] ? (
            <LabwareButton
              key={item}
              numberInStack={stackOfLabware.length - index}
              displayName={labware[item].def.metadata.displayName}
              isSelected={selectedLabware.includes(item)}
              onClick={(id, event) => {
                setSelectedLabware(id, event)
              }}
              id={item}
            />
          ) : null
        )}
      </div>
      <StyledText desktopStyle="captionRegular">
        {t('bottom_of_stack')}
      </StyledText>
    </div>
  )
}
