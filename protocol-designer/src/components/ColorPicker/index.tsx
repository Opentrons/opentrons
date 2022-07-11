import * as React from 'react'
import { ColorResult, TwitterPicker } from 'react-color'
import { COLORS } from '@opentrons/components'

import styles from './ColorPicker.css'

interface ColorPickerProps {
  value: string
  onChange: (hex: ColorResult['hex']) => void
}

export function ColorPicker(props: ColorPickerProps): JSX.Element {
  const [showColorPicker, setShowColorPicker] = React.useState<boolean>(false)

  return (
    <div>
      <div
        className={styles.swatch}
        style={
          showColorPicker ? { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.41)' } : {}
        }
        onClick={() => setShowColorPicker(showColorPicker => !showColorPicker)}
      >
        <div
          className={styles.color}
          style={{
            backgroundColor: props.value,
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
            colors={COLORS.liquidColors}
            color={props.value}
            onChange={(color, event) => {
              props.onChange(color.hex)
              setShowColorPicker(showColorPicker => !showColorPicker)
            }}
            triangle="top-right"
          />
        </div>
      ) : null}
    </div>
  )
}
