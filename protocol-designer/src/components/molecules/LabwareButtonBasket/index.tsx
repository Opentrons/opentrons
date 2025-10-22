import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { LabwareButton } from '../../atoms'
import styles from './labwarebuttonbasket.module.css'

import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

interface LabwareButtonBasketProps {
  stackOfLabware: string[]
  labware: AllTemporalPropertiesForTimelineFrame['labware']
  setSelectedLabware: (
    selectedLabwareId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => void
  selectedLabware: string[]
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
        {stackOfLabware.map((item, index) =>
          labware[item] ? (
            <LabwareButton
              key={`${item}_${index}`}
              numberInStack={stackOfLabware.length - 1 - index}
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
