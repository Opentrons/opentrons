// @flow

import { _getGroupMetadataDisplayCategory } from '../fieldsToLabware'

describe('_getGroupMetadataDisplayCategory', () => {
  it('should return null for wellPlate', () => {
    const result = _getGroupMetadataDisplayCategory({
      aluminumBlockChildType: null,
      labwareType: 'wellPlate',
    })
    expect(result).toBe(null)
  })

  it('should return "tubeRack" for tubeRack', () => {
    const result = _getGroupMetadataDisplayCategory({
      aluminumBlockChildType: null,
      labwareType: 'tubeRack',
    })
    expect(result).toEqual('tubeRack')
  })

  it('should return "wellPlate" for aluminumBlock with "pcrPlate" child', () => {
    const result = _getGroupMetadataDisplayCategory({
      aluminumBlockChildType: 'pcrPlate',
      labwareType: 'aluminumBlock',
    })
    expect(result).toEqual('wellPlate')
  })

  it('should return "tubeRack" for aluminumBlock with "tubes" or "pcrTubeStrip" child', () => {
    const childTypes = ['tubes', 'pcrTubeStrip']
    childTypes.forEach(childType => {
      const result = _getGroupMetadataDisplayCategory({
        aluminumBlockChildType: childType,
        labwareType: 'aluminumBlock',
      })
      expect(result).toEqual('tubeRack')
    })
  })
})
