// @ flow
import * as React from 'react'
import cx from 'classnames'
import styles from './styles.css'

export type GuideProps = {|
  ...DiagramProps,
  guideVisible?: boolean,
|}

export function MeasurementGuide(props: GuideProps) {
  const { category, guideType, guideVisible } = props
  if (!category || !guideType) return null
  const diagrams = getDiagramSrc(props)
  const className = cx(styles.measurement_guide, {
    [styles.open]: guideVisible,
  })
  return (
    <div className={className}>
      {guideType} {category}
      {diagrams &&
        diagrams.map((src, index) => {
          return <img src={src} key={index} />
        })}
    </div>
  )
}

const FOOTPRINT_DIAGRAMS: { [category]: Array<?string> } = {
  wellPlate: [
    require('./images/dimensions/footprint@3x.png'),
    require('./images/dimensions/height-plate-and-reservoir@3x.png'),
  ],
  tipRack: [
    require('./images/dimensions/footprint@3x.png'),
    require('./images/dimensions/height-tip-rack@3x.png'),
  ],
  tubeRack: [
    require('./images/dimensions/footprint@3x.png'),
    require('./images/dimensions/height-tube-rack@3x.png'),
  ],
  reservoir: [
    require('./images/dimensions/footprint@3x.png'),
    require('./images/dimensions/height-plate-and-reservoir@3x.png'),
  ],
}

const SPACING_DIAGRAMS: { [category]: { [shape]: Array<?string> } } = {
  wellPlate: {
    circular: [require('./images/spacing/spacing-well-circular@3x.png')],
    rectangular: [require('./images/spacing/spacing-well-rectangular@3x.png')],
  },
  tiprack: {
    circular: [require('./images/spacing/spacing-well-circular@3x.png')],
    rectangular: [require('./images/spacing/spacing-well-rectangular@3x.png')],
  },
  tubeRack: {
    circular: [require('./images/spacing/spacing-well-circular@3x.png')],
    rectangular: [require('./images/spacing/spacing-well-rectangular@3x.png')],
  },
  reservoir: {
    rectangular: [require('./images/spacing/spacing-reservoir@3x.png')],
  },
}

export type DiagramProps = {
  guideType?: string,
  category?: string,
  shape?: string,
  wellBottomShape?: string,
}

export function getDiagramSrc(props: DiagramProps): string {
  const { guideType, category, shape, wellBottomShape } = props

  if (guideType === 'footprint') return FOOTPRINT_DIAGRAMS[category]
  else if (guideType === 'spacing') return SPACING_DIAGRAMS[category][shape]
  else if (guideType === 'measurements')
    return OFFSET[category][shape][wellBottomShape]
}
