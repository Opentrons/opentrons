import * as React from 'react'
import {
  LabwareRender,
  LabwareOutline,
  RobotCoordsForeignDiv,
  RobotWorkSpace,
} from '@opentrons/components'
import {
  LabwareDefinition2,
  SLOT_LENGTH_MM as DEFAULT_X_DIMENSION,
  SLOT_WIDTH_MM as DEFAULT_Y_DIMENSION,
} from '@opentrons/shared-data'
import styles from './ConditionalLabwareRender.module.css'

interface Props {
  definition: LabwareDefinition2 | null
}

const calculateViewBox = (args: {
  bBox: DOMRect | undefined
  xDim: number
  yDim: number
}): string => {
  const { bBox, xDim, yDim } = args

  // by-eye margin to make sure there is no visual clipping
  const MARGIN = 5

  // calculate viewBox such that SVG is zoomed and panned with the bBox fully in view,
  // in a "zoom to fit" manner, plus some visual margin to prevent clipping
  return `${(bBox?.x ?? 0) - MARGIN} ${(bBox?.y ?? 0) - MARGIN} ${
    xDim + MARGIN * 2
  } ${yDim + MARGIN * 2}`
}

export const ConditionalLabwareRender = (props: Props): JSX.Element => {
  const { definition } = props
  const gRef = React.useRef<SVGGElement>(null)
  const [bBox, updateBBox] = React.useState<DOMRect | undefined>(
    gRef.current ? gRef.current.getBBox() : undefined
  )

  // In order to implement "zoom to fit", we're calculating the desired viewBox based on getBBox of the child.
  // So we have to actually render the child to get its bounding box. After that, we re-calculate the viewBox.
  // Once the viewBox is re-calculated, we use setState to force a re-render.
  const nextBBox = gRef.current?.getBBox()
  React.useLayoutEffect((): void => {
    if (
      nextBBox != null &&
      (nextBBox.width !== bBox?.width || nextBBox.height !== bBox?.height)
    ) {
      updateBBox(nextBBox)
    }
  }, [bBox?.height, bBox?.width, nextBBox])

  const xDim =
    definition != null
      ? bBox?.width ?? definition.dimensions.xDimension
      : DEFAULT_X_DIMENSION
  const yDim =
    definition != null
      ? bBox?.height ?? definition.dimensions.yDimension
      : DEFAULT_Y_DIMENSION

  return (
    <RobotWorkSpace viewBox={calculateViewBox({ bBox, xDim, yDim })}>
      {() =>
        definition != null ? (
          <LabwareRender definition={definition} gRef={gRef} />
        ) : (
          <>
            <LabwareOutline />
            <RobotCoordsForeignDiv
              x={0}
              y={0}
              width={xDim}
              height={yDim}
              innerDivProps={{ className: styles.error_text_wrapper }}
            >
              <div className={styles.error_text}>
                Add missing info to see labware preview
              </div>
            </RobotCoordsForeignDiv>
          </>
        )
      }
    </RobotWorkSpace>
  )
}
