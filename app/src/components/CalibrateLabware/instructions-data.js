// @flow
import * as React from 'react'
import type { LabwareCalibrationProps } from './ConfirmPositionDiagram'

type Step = 'one' | 'two'
type Channels = 'single' | 'multi'
type TypeKey =
  | 'tiprack'
  | 'trough'
  | 'tuberack'
  | 'plate384'
  | 'plate96'
  | 'reservoir'
  | 'reservoirCentered'

const DIAGRAMS: {
  [TypeKey]: { [Channels]: { [Step]: string, ... }, ... },
  ...,
} = {
  tiprack: {
    single: {
      one: require('./images/step-1-tiprack-single@3x.png'),
      two: require('./images/step-2-tiprack-single@3x.png'),
    },
    multi: {
      one: require('./images/step-1-tiprack-multi@3x.png'),
      two: require('./images/step-2-tiprack-multi@3x.png'),
    },
  },
  reservoir: {
    single: {
      one: require('./images/step-1-trough-single@3x.png'),
      two: require('./images/step-2-trough-single@3x.png'),
    },
    multi: {
      one: require('./images/step-1-trough-multi@3x.png'),
      two: require('./images/step-2-trough-multi@3x.png'),
    },
  },
  reservoirCentered: {
    single: {
      one: require('./images/step-1-trough-centered-single@3x.png'),
      two: require('./images/step-2-trough-single@3x.png'),
    },
    multi: {
      one: require('./images/step-1-trough-multi@3x.png'),
      two: require('./images/step-2-trough-multi@3x.png'),
    },
  },
  trough: {
    single: {
      one: require('./images/step-1-trough-single@3x.png'),
      two: require('./images/step-2-trough-single@3x.png'),
    },
    multi: {
      one: require('./images/step-1-trough-multi@3x.png'),
      two: require('./images/step-2-trough-multi@3x.png'),
    },
  },
  tuberack: {
    single: {
      one: require('./images/step-1-tuberack@3x.png'),
      two: require('./images/step-2-tuberack@3x.png'),
    },
    multi: {
      one: require('./images/step-1-tuberack@3x.png'),
      two: require('./images/step-2-tuberack@3x.png'),
    },
  },
  plate96: {
    single: {
      one: require('./images/step-1-96-wellplate-single@3x.png'),
      two: require('./images/step-2-96-wellplate-single@3x.png'),
    },
    multi: {
      one: require('./images/step-1-96-wellplate-multi@3x.png'),
      two: require('./images/step-2-96-wellplate-multi@3x.png'),
    },
  },
  plate384: {
    single: {
      one: require('./images/step-1-384-wellplate-single@3x.png'),
      two: require('./images/step-2-384-wellplate-single@3x.png'),
    },
    multi: {
      one: require('./images/step-1-384-wellplate-multi@3x.png'),
      two: require('./images/step-2-384-wellplate-multi@3x.png'),
    },
  },
}

const DIAGRAMS_BOTTOM: {
  [TypeKey]: { [Channels]: { [Step]: string, ... }, ... },
  ...,
} = {
  tiprack: {
    single: {
      one: require('./images/step-1-tiprack-single@3x.png'),
      two: require('./images/step-2-tiprack-single@3x.png'),
    },
    multi: {
      one: require('./images/step-1-tiprack-multi@3x.png'),
      two: require('./images/step-2-tiprack-multi@3x.png'),
    },
  },
  trough: {
    single: {
      one: require('./images/step-1-trough-single@3x.png'),
      two: require('./images/step-2-trough-bottom@3x.png'),
    },
    multi: {
      one: require('./images/step-1-trough-multi@3x.png'),
      two: require('./images/step-2-trough-bottom@3x.png'),
    },
  },
  reservoir: {
    single: {
      one: require('./images/step-1-trough-single@3x.png'),
      two: require('./images/step-2-trough-bottom@3x.png'),
    },
    multi: {
      one: require('./images/step-1-trough-multi@3x.png'),
      two: require('./images/step-2-trough-bottom@3x.png'),
    },
  },
  reservoirCentered: {
    single: {
      one: require('./images/step-1-trough-centered-single@3x.png'),
      two: require('./images/step-2-trough-bottom@3x.png'),
    },
    multi: {
      one: require('./images/step-1-trough-multi@3x.png'),
      two: require('./images/step-2-trough-bottom@3x.png'),
    },
  },
  tuberack: {
    single: {
      one: require('./images/step-1-tuberack@3x.png'),
      two: require('./images/step-2-tuberack-bottom@3x.png'),
    },
    multi: {
      one: require('./images/step-1-tuberack@3x.png'),
      two: require('./images/step-2-tuberack-bottom@3x.png'),
    },
  },
  plate96: {
    single: {
      one: require('./images/step-1-96-wellplate-single@3x.png'),
      two: require('./images/step-2-96-wellplate-bottom@3x.png'),
    },
    multi: {
      one: require('./images/step-1-96-wellplate-multi@3x.png'),
      two: require('./images/step-2-96-wellplate-bottom@3x.png'),
    },
  },
  plate384: {
    single: {
      one: require('./images/step-1-384-wellplate-single@3x.png'),
      two: require('./images/step-2-384-wellplate-bottom@3x.png'),
    },
    multi: {
      one: require('./images/step-1-384-wellplate-multi@3x.png'),
      two: require('./images/step-2-384-wellplate-bottom@3x.png'),
    },
  },
}

const INSTRUCTIONS: {
  [TypeKey]: { [Channels]: { [Step]: React.Node, ... }, ... },
  ...,
} = {
  tiprack: {
    single: {
      one: 'Jog pipette until it is centered above tip A1.',
      two: (
        <p>
          Jog pipette until it is <strong>flush</strong> with the top of the
          tip.
        </p>
      ),
    },
    multi: {
      one: 'Jog pipette until it is centered above tips in column 1.',
      two: <p>Jog pipette until it is flush with the top of the tips.</p>,
    },
  },
  trough: {
    single: {
      one: 'Jog pipette until tip is centered by the back of trough A1.',
      two: (
        <p>
          Jog pipette tip until it is <strong>flush</strong> with the top of the
          trough.
        </p>
      ),
    },
    multi: {
      one: 'Jog pipette until tips are centered above trough A1.',
      two: (
        <p>
          Jog pipette tips until they are <strong>flush</strong> with the top of
          the trough.
        </p>
      ),
    },
  },
  reservoir: {
    single: {
      one: 'Jog pipette until tip is centered by the back of reservoir A1.',
      two: (
        <p>
          Jog pipette tip until it is <strong>flush</strong> with the top of the
          reservoir.
        </p>
      ),
    },
    multi: {
      one: 'Jog pipette until tips are centered above reservoir A1.',
      two: (
        <p>
          Jog pipette tips until they are <strong>flush</strong> with the top of
          the reservoir.
        </p>
      ),
    },
  },
  reservoirCentered: {
    single: {
      one: 'Jog pipette until tip is centered above reservoir A1.',
      two: (
        <p>
          Jog pipette tip until it is <strong>flush</strong> with the top of the
          reservoir.
        </p>
      ),
    },
    multi: {
      one: 'Jog pipette until tips are centered above reservoir A1.',
      two: (
        <p>
          Jog pipette tips until they are <strong>flush</strong> with the top of
          the reservoir.
        </p>
      ),
    },
  },
  tuberack: {
    single: {
      one: 'Jog pipette until tip is centered above tube A1.',
      two: (
        <p>
          Jog pipette tip until it is <strong>flush</strong> with the top of the
          tube.
        </p>
      ),
    },
    multi: {
      one: 'warning: you can not use a multichannel pipette with a tube rack',
      two: 'warning: you can not use a multichannel pipette with a tube rack',
    },
  },
  plate96: {
    single: {
      one: 'Jog pipette until tip is centered above well A1.',
      two: (
        <p>
          Jog pipette tip until it is <strong>flush</strong> with the top of the
          well.
        </p>
      ),
    },
    multi: {
      one: 'Jog pipette until tips are centered above the wells in column 1.',
      two: (
        <p>
          Jog pipette tips until they are <strong>flush</strong> with the top of
          the wells.
        </p>
      ),
    },
  },
  plate384: {
    single: {
      one: 'Jog pipette until tip is centered above well A1.',
      two: (
        <p>
          Jog pipette tip until it is <strong>flush</strong> with the top of the
          well.
        </p>
      ),
    },
    multi: {
      one:
        'Jog pipette until tips are centered above the wells indicated in column 1.',
      two: (
        <p>
          Jog pipette tips until they are <strong>flush</strong> with the top of
          the wells.
        </p>
      ),
    },
  },
}

const INSTRUCTIONS_BOTTOM: {
  [TypeKey]: { [Channels]: { [Step]: React.Node, ... }, ... },
  ...,
} = {
  tiprack: {
    single: {
      one: 'Jog pipette until it is centered above tip A1.',
      two: (
        <p>
          Jog pipette until it is <strong>flush</strong> with the top of the
          tip.
        </p>
      ),
    },
    multi: {
      one: 'Jog pipette until it is centered above tips in column 1.',
      two: <p>Jog pipette until it is flush with the top of the tips.</p>,
    },
  },
  trough: {
    single: {
      one: 'Jog pipette until tip is centered by the back of trough A1.',
      two: (
        <p>
          Jog pipette until the tip is <strong>just barely</strong> touching the
          bottom.
        </p>
      ),
    },
    multi: {
      one: 'Jog pipette until tips are centered above trough A1.',
      two: (
        <p>
          Jog pipette until tips are <strong>just barely</strong> touching the
          bottom.
        </p>
      ),
    },
  },
  reservoir: {
    single: {
      one: 'Jog pipette until tip is centered by the back of reservoir A1.',
      two: (
        <p>
          Jog pipette until the tip is <strong>just barely</strong> touching the
          bottom.
        </p>
      ),
    },
    multi: {
      one: 'Jog pipette until tips are centered above reservoir A1.',
      two: (
        <p>
          Jog pipette until tips are <strong>just barely</strong> touching the
          bottom.
        </p>
      ),
    },
  },
  reservoirCentered: {
    single: {
      one: 'Jog pipette until tip is centered above reservoir A1.',
      two: (
        <p>
          Jog pipette until the tip is <strong>just barely</strong> touching the
          bottom.
        </p>
      ),
    },
    multi: {
      one: 'Jog pipette until tips are centered above reservoir A1.',
      two: (
        <p>
          Jog pipette until tips are <strong>just barely</strong> touching the
          bottom.
        </p>
      ),
    },
  },
  tuberack: {
    single: {
      one: 'Jog pipette until tip is centered above tube A1.',
      two: (
        <p>
          Jog pipette until the tip is <strong>just barely</strong> touching the
          bottom.
        </p>
      ),
    },
    multi: {
      one: 'warning: you can not use a multichannel pipette with a tube rack',
      two: 'warning: you can not use a multichannel pipette with a tube rack',
    },
  },
  plate96: {
    single: {
      one: 'Jog pipette until tip is centered above well A1.',
      two: (
        <p>
          Jog pipette until the tip is <strong>just barely</strong> touching the
          bottom.
        </p>
      ),
    },
    multi: {
      one: 'Jog pipette until tips are centered above the wells in column 1.',
      two: (
        <p>
          Jog pipette until tips are <strong>just barely</strong> touching the
          bottom.
        </p>
      ),
    },
  },
  plate384: {
    single: {
      one: 'Jog pipette until tip is centered above well A1.',
      two: (
        <p>
          Jog pipette until the tip is <strong>just barely</strong> touching the
          bottom.
        </p>
      ),
    },
    multi: {
      one:
        'Jog pipette until tips are centered above the wells indicated in column 1.',
      two: (
        <p>
          Jog pipette until tips are <strong>just barely</strong> touching the
          bottom.
        </p>
      ),
    },
  },
}

export function getDiagramSrc(
  props: LabwareCalibrationProps
): { [Step]: string, ... } {
  const typeKey = getTypeKey(props)
  const channelsKey = getChannelsKey(props)
  if (props.calibrateToBottom) {
    return DIAGRAMS_BOTTOM[typeKey][channelsKey]
  }
  return DIAGRAMS[typeKey][channelsKey]
}

export function getInstructionsByType(
  props: LabwareCalibrationProps
): { [Step]: React.Node, ... } {
  const typeKey = getTypeKey(props)
  const channelsKey = getChannelsKey(props)

  if (props.calibrateToBottom) {
    return INSTRUCTIONS_BOTTOM[typeKey][channelsKey]
  }
  return INSTRUCTIONS[typeKey][channelsKey]
}

function getTypeKey(props: LabwareCalibrationProps) {
  const { labware, useCenteredTroughs } = props
  const { type, isTiprack } = labware
  let typeKey
  if (isTiprack) {
    typeKey = 'tiprack'
  } else if (type.includes('trough')) {
    typeKey = 'trough'
  } else if (type.includes('reservoir')) {
    if (useCenteredTroughs) {
      typeKey = 'reservoirCentered'
    } else {
      typeKey = 'reservoir'
    }
  } else if (type.includes('tube') || type.includes('vial')) {
    typeKey = 'tuberack'
  } else if (type.includes('384')) {
    typeKey = 'plate384'
  } else {
    typeKey = 'plate96'
  }
  return typeKey
}

function getChannelsKey(props: LabwareCalibrationProps) {
  const { channels } = props.calibrator
  const channelsKey = channels === 8 ? 'multi' : 'single'
  return channelsKey
}
