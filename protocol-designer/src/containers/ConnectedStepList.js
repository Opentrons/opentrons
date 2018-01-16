// @flow
import {connect} from 'react-redux'

import StepList from '../components/StepList'

const steps = [
  {
    title: 'Transfer X',
    stepType: 'transfer',
    sourceLabwareName: 'X Plate',
    sourceWell: 'X2',
    destLabwareName: 'Dest X',
    destWell: 'Y2',
    id: 0,
    collapsed: false,
    substeps: [
      {
        sourceIngredientName: 'DNA',
        sourceWell: 'B1',
        destIngredientName: 'ddH2O',
        destWell: 'B2'
      },
      {
        sourceIngredientName: 'DNA',
        sourceWell: 'C1',
        destIngredientName: 'ddH2O',
        destWell: 'C2'
      },
      {
        sourceIngredientName: 'DNA',
        sourceWell: 'D1',
        destIngredientName: 'ddH2O',
        destWell: 'D2'
      }
    ]
  },
  {
    title: 'Pause 1',
    stepType: 'pause',
    id: 2
  },
  {
    title: 'Distribute X',
    description: 'Description is here',
    stepType: 'distribute',
    sourceLabwareName: 'X Plate',
    destLabwareName: 'Dest X',
    id: 3,
    substeps: [
      {
        sourceIngredientName: 'LB',
        sourceWell: 'A1',
        destIngredientName: 'ddH2O',
        destWell: 'B1'
      },
      {
        sourceIngredientName: 'LB',
        destIngredientName: 'ddH2O',
        destWell: 'B2'
      },
      {
        sourceIngredientName: 'LB',
        destIngredientName: 'ddH2O',
        destWell: 'B3'
      },
      {
        sourceIngredientName: 'LB',
        destIngredientName: 'ddH2O',
        destWell: 'B4'
      }
    ]
  },
  {
    title: 'Pause 2',
    stepType: 'pause',
    id: 4,
    description: 'Wait until operator adds new tip rack.'
  },
  {
    title: 'Consolidate X',
    stepType: 'consolidate',
    sourceLabwareName: 'Labware A',
    destLabwareName: 'Labware B',
    id: 5,
    substeps: [
      {
        sourceIngredientName: 'Cells',
        sourceWell: 'A1'
      },
      {
        sourceIngredientName: 'Cells',
        sourceWell: 'A2'
      },
      {
        sourceIngredientName: 'Cells',
        sourceWell: 'A3',
        destIngredientName: 'LB Broth',
        destWell: 'H1'
      }
    ]
  }
]

function mapStateToProps (state) {
  return {
    steps: steps, // TODO
    selectedStep: 2 // TODO
  }
}

function mapDispatchToProps (dispatch) {
  return {
    handleStepItemClickById: id => e => console.log('clicked step', id),
    handleStepItemCollapseToggleById: id => e => console.log('clicked toggle', id)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepList)
