import * as React from 'react'
import { ColorResult, TwitterPicker } from 'react-color'
import { colors } from '../swatchColors'

import styles from './ColorPicker.css'

interface ColorPickerProps {
  liquidId: string
}

export function ColorPicker(props: ColorPickerProps): JSX.Element {
  const [showColorPicker, setShowColorPicker] = React.useState<boolean>(false)
  const [currentColor, setCurrentColor] = React.useState<ColorResult['hex']>(
    '#000'
  )
  return (
    <div>
      <div
        className={styles.swatch}
        onClick={() => setShowColorPicker(showColorPicker => !showColorPicker)}
      >
        <div
          className={styles.color}
          style={{
            backgroundColor: currentColor,
          }}
        />
      </div>
      {showColorPicker ? (
        <div className={styles.popover}>
          <div
            className={styles.cover}
            onClick={() => setShowColorPicker(false)}
          />
          <TwitterPicker
            colors={colors}
            color={currentColor}
            onChange={color => {
              setCurrentColor(color.hex)
              setShowColorPicker(showColorPicker => !showColorPicker)
            }}
            triangle="top-left"
          />
        </div>
      ) : null}
    </div>
  )
}
