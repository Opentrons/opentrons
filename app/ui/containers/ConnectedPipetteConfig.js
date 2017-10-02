import React from 'react'
import {connect} from 'react-redux'

import PipetteConfig from '../components/PipetteConfig'

const mapStateToProps = (state) => ({
  instruments: [
    {
      axis: 'left', // axis: 'b'from api
      channels: 'single', // channels: 1 from api
      volume: 200, // max_volume: 200 from api
      isProbed: false
    },
    {
      axis: 'right',
      channels: 'multi',
      volume: 200,
      isProbed: false
    }
  ]
})

function ConnectedPipetteConfig (props) {
  return (
    <PipetteConfig {...props} />
  )
}

export default connect(mapStateToProps)(ConnectedPipetteConfig)
