import { StyledText } from '../StyledText'
import styles from './slider.module.css'

interface SliderProps {
  /** Title of slider */
  title: string
  /** Subtext of slider */
  subtext: string
  /** Default value of slider */
  value: number
  /** Function to do something with the value of the slider */
  adjustValue: (value: number) => void
}

export function Slider({
  value,
  title,
  subtext,
  adjustValue,
}: SliderProps): JSX.Element {
  return (
    <div className={styles.slider_setting_container}>
      <div className={styles.slider_setting_text_container}>
        <StyledText desktopStyle="bodyDefaultSemiBold">{title}</StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">{subtext}</StyledText>
      </div>
      <div className={styles.slider_value_container}>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={e => {
            adjustValue(Number(e.target.value))
          }}
          className={styles.slider_basic}
          // @ts-expect-error Expected. We want to use style here to avoid more complex
          //  data-attribute CSS calculations.
          style={{ '--slider-progress': `${value}%` }}
          aria-label={title}
        />
        <StyledText
          className={styles.slider_percentage}
          desktopStyle="bodyDefaultSemiBold"
        >
          {`${value}%`}
        </StyledText>
      </div>
    </div>
  )
}
