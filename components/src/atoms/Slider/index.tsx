import clsx from 'clsx'

import { COLORS } from '../../helix-design-system'
import { StyledText } from '../StyledText'
import styles from './slider.module.css'

interface SliderProps {
  /** Value of slider as percentage */
  value: number
  /** Function to do something with the value of the slider */
  adjustValue: (value: number) => void
  /** Optional label for the slider */
  label?: string
}

export function Slider({
  value,
  label,
  adjustValue,
}: SliderProps): JSX.Element {
  return (
    <div className={styles.slider_container}>
      <div
        className={clsx(styles.slider_text_container_label, {
          [styles.slider_text_container_no_label]: label == null,
        })}
      >
        {label != null ? (
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {label}
          </StyledText>
        ) : null}
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {value}%
        </StyledText>
      </div>
      <input
        type="range"
        min="1"
        max="100"
        value={value}
        onChange={e => {
          adjustValue(Number(e.target.value))
        }}
        className={styles.slider}
        // @ts-expect-error Expected. We want to use style here to avoid more complex
        //  data-attribute CSS calculations.
        style={{ '--value-percent': `${value}%` }}
        aria-label={label}
      />
    </div>
  )
}
