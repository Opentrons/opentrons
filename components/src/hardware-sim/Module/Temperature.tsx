import * as React from 'react'

import { COLORS } from '../../ui-style-constants'

export interface TemperatureVizProps {
  targetTemperature: number | null
}

const ROOM_TEMPERATURE_C = 23

export function Temperature(props: TemperatureVizProps): JSX.Element {
  const { targetTemperature } = props
  let ledLightColor = COLORS.transparent
  if (targetTemperature != null) {
    ledLightColor = targetTemperature <= ROOM_TEMPERATURE_C
      ? COLORS.mediumBlueEnabled
      : COLORS.red4
  }

  return (
    <>
      <g id="darkFill">
        <path d="M74,89.3c-2.2,0-4.2-1.2-5.3-3H6.1V19.2H0.4V9.6h5.7V3.7h62.6c1.1-1.8,3.1-3,5.3-3h123V45v41.3v3H74z M28.5,39.5c0-1.5-1.2-2.7-2.7-2.7l0,0c-1.5,0-2.7,1.2-2.7,2.7v10.9c0,1.5,1.2,2.7,2.7,2.7s2.7-1.2,2.7-2.7V39.5z M46.3,34.4H32.1 v21.2h14.2V34.4L46.3,34.4z"
          style={{ fillRule: 'evenodd', clipRule: 'evenodd', fill: 'rgb(230, 230, 230)' }}>
        </path>
      </g>
      <g id="outline">
        <path d="M197.7,0H5.3v90h192.4V0z M6.7,1.4h189.6v87.1H6.7V1.4z"></path>
      </g>
      <g id="labwareSurface">
        <path d="M197.7,0H74c-3.8,0-7,3.1-7,7v76c0,3.8,3.1,7,7,7h123.7V0z M74,88.6c-3,0-5.5-2.5-5.5-5.5V7c0-3,2.5-5.5,5.5-5.5h122.3 v87.1H74z"></path>
      </g>
      <g id="innerWalls">
        <path d="M6,86.4h62.5v-0.7H6V86.4z M6,4.1h63.4V3.3H6L6,4.1L6,4.1z"></path>
      </g>
      <g id="powerButton">
        <path d="M6.4,9.2H0v10.3h6.4V9.2z M0.7,9.9h5v8.9h-5V9.9z"></path>
      </g>
      <g id="displayPanel">
        <path d="M46.3,34.1H32.1c-0.2,0-0.4,0.2-0.4,0.4v21.2c0,0.2,0.2,0.4,0.4,0.4h14.2c0.2,0,0.4-0.2,0.4-0.4V34.4 C46.7,34.2,46.5,34.1,46.3,34.1z M32.5,34.8h13.4v20.4H32.5V34.8z">
        </path>
      </g>
      <g id="statusLight">
        <path
          fill={ledLightColor}
          stroke={COLORS.black}
          strokeWidth={0.5}
          d="M 25.8 36.5 c -1.7 0 -3.1 1.4 -3.1 3.1 v 10.9 c 0 1.7 1.4 3.1 3.1 3.1 s 3.1 -1.4 3.1 -3.1 v -11 C 28.9 37.8 27.5 36.5 25.8 36.5 z"/>
      </g >
    </>
  )
}
