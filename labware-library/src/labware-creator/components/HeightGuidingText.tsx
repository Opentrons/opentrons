import type { LabwareType } from '../fields'

export const HeightGuidingText = (props: {
  labwareType: LabwareType | null | undefined
}): JSX.Element => {
  const { labwareType } = props
  const footer = (
    <p>
      The height measurement informs the robot of the top and bottom of your
      labware.
    </p>
  )
  if (labwareType === 'tubeRack') {
    return (
      <>
        <p>Place your tubes inside the rack.</p>
        <p>
          Reference{' '}
          <strong>from the top of the tube to bottom of the rack.</strong>{' '}
          Include any tube lip. Exclude any cover or cap.
        </p>
        {footer}
      </>
    )
  }
  if (labwareType === 'aluminumBlock') {
    return (
      <>
        <p>Put your labware on top of the aluminum block.</p>
        <p>
          Reference{' '}
          <strong>
            from the top of your labware to the bottom of the block.
          </strong>{' '}
          Include any well or tube lip. Exclude any cover or cap.
        </p>
        {footer}
      </>
    )
  }
  if (labwareType === 'filterPlate' || labwareType === 'wellPlate') {
    return (
      <>
        <p>
          Measure the total height of the labware: from the highest point on top
          down to the lowest point. Include any well tips or nozzles that hang
          below the skirt.
        </p>
        <p>
          Skirt height is optional. Measure the skirt itself, from its top edge
          down to the bottom of the skirt. Enter 0 if the labware has no skirt.
          Where the plate sits on a parent (for example nested into a collection
          plate) is set later with stacking offsets.
        </p>
        {footer}
      </>
    )
  }
  if (labwareType === 'tipRack') {
    return (
      <>
        <p>
          Include the <strong>adapter and tops of the pipette tips</strong> in
          the measurement.
        </p>
        {footer}
      </>
    )
  }
  return (
    <>
      <p>
        Include any lips or flanges here, and exclude any cover or cap when
        measuring. If your labware is more than one tip length above the deck,
        it may be incompatible with some tip + pipette combinations.
      </p>
      {footer}
    </>
  )
}
