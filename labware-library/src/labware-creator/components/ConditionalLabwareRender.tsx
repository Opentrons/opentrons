import { useLayoutEffect, useRef, useState } from 'react'
import isEqual  from 'lodash/isEqual'

import {
  LabwareOutline,
  LabwareRender,
  RobotCoordsForeignDiv,
  RobotWorkSpace,
} from '@opentrons/components'
import {
  SLOT_LENGTH_MM as DEFAULT_X_DIMENSION,
  SLOT_WIDTH_MM as DEFAULT_Y_DIMENSION,
} from '@opentrons/shared-data'

import styles from './ConditionalLabwareRender.module.css'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

interface Props {
  definition: LabwareDefinition2 | null
}

const calculateViewBox = (bBox: DOMRect): string => {
  // by-eye margin to make sure there is no visual clipping
  const MARGIN = 5

  // calculate viewBox such that SVG is zoomed and panned with the bBox fully in view,
  // in a "zoom to fit" manner, plus some visual margin to prevent clipping
  const x = bBox.x - MARGIN
  const y = bBox.y - MARGIN
  const xDimension = bBox.width + MARGIN * 2
  const yDimension = bBox.height + MARGIN * 2
  return `${x} ${y} ${xDimension} ${yDimension}`
}

const areBBoxesEqual = (
  a: DOMRect | undefined,
  b: DOMRect | undefined
): boolean => {
  return isEqual(
    {
      x: a?.x,
      y: a?.y,
      width: a?.width,
      height: a?.height,
    },
    {
      x: b?.x,
      y: b?.y,
      width: b?.width,
      height: b?.height,
    }
  )
}

export const ConditionalLabwareRender = (props: Props): JSX.Element => {
  const { definition } = props
  return definition === null ? (
    <Placeholder />
  ) : (
    <PopulatedPreview definition={definition} />
  )
}

const PopulatedPreview = (props: {
  definition: LabwareDefinition2
}): JSX.Element => {
  const { definition } = props
  const gRef = useRef<SVGGElement>(null)
  const [bBox, updateBBox] = useState<DOMRect | undefined>(
    gRef.current?.getBBox()
  )

  // In order to implement "zoom to fit", we're calculating the desired viewBox based on getBBox of the child.
  // So we have to actually render the child to get its bounding box. After that, we re-calculate the viewBox.
  // Once the viewBox is re-calculated, we use setState to force a re-render.
  useLayoutEffect((): void => {
    const nextBBox = gRef.current?.getBBox()
    if (!areBBoxesEqual(bBox, nextBBox)) updateBBox(nextBBox)
  }, [
    bBox,
    // This dep array needs to include anything that can affect the contents of the rendered SVG.
    definition,
  ])

  return (
    <RobotWorkSpace
      viewBox={
        // If we haven't calculated a zoom-to-fit viewBox yet, we can use any arbitrary
        // value. Our useLayoutEffect will ensure it gets replaced with a real value
        // before the user sees it.
        bBox == null ? '0 0 0 0' : calculateViewBox(bBox)
      }
    >
      {() => <LabwareRender definition={definition} gRef={gRef} />}
    </RobotWorkSpace>
  )
}

const Placeholder = (): JSX.Element => {
  return (
    <RobotWorkSpace
      viewBox={`0 0 ${DEFAULT_X_DIMENSION} ${DEFAULT_Y_DIMENSION}`}
    >
      {() => (
        <>
          <LabwareOutline
            width={DEFAULT_X_DIMENSION}
            height={DEFAULT_Y_DIMENSION}
          />
          <RobotCoordsForeignDiv
            x={0}
            y={0}
            width={DEFAULT_X_DIMENSION}
            height={DEFAULT_Y_DIMENSION}
            innerDivProps={{ className: styles.error_text_wrapper }}
          >
            <div className={styles.error_text}>
              Add missing info to see labware preview
            </div>
          </RobotCoordsForeignDiv>
        </>
      )}
    </RobotWorkSpace>
  )
}
