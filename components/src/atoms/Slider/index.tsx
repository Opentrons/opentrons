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
  /** Optional color for the unfilled (right) track. Defaults to blue-20. */
  backgroundColor?: string
}

export function Slider({
  value,
  label,
  adjustValue,
  backgroundColor,
}: SliderProps): JSX.Element {
  const style: React.CSSProperties & Record<string, string> = {
    '--value-percent': `${value}%`,
    ...(backgroundColor != null && {
      '--slider-unfilled': backgroundColor,
    }),
  }
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
        style={style}
        aria-label={label}
      />
    </div>
  )
}
