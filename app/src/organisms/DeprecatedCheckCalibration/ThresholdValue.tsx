import * as React from 'react'

interface Props {
  thresholdVector: [number, number, number]
}

export function ThresholdValue(props: Props): JSX.Element {
  const value = props.thresholdVector.find(axis => axis > 0)
  // @ts-expect-error(sa, 2021-05-27): avoiding src code change, cast to value to string
  const formattedValue = parseFloat(value).toFixed(1)
  return <span>{`±${formattedValue} mm`}</span>
}
