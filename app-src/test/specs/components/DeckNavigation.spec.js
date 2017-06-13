/* global describe, it */
import { expect } from 'chai'
import DeckNavigation from 'src/components/DeckNavigation.vue'
import { getRenderedVm } from '../../util.js'

function getMockStore () {
  return {
    state: {
      versions: {
        ot_version: {
          version: 'hood'
        }
      },
      apiContainers: {
        'tiprack-200ul': {
          'origin-offset': {
            'x': 11.24,
            'y': 14.34
          },
          'locations': {
            'A1': {
              'x': 0,
              'y': 0,
              'z': 0,
              'diameter': 5.0,
              'depth': 60
            },
            'B1': {
              'x': 9,
              'y': 0,
              'z': 0,
              'diameter': 5.0,
              'depth': 60
            }
          }
        },
        'point': {
          'locations': {
            'A1': {
              'x': 0,
              'y': 0,
              'z': 0,
              'depth': 0,
              'diameter': 0,
              'total-liquid-volume': 1
            }
          }
        }
      },
      tasks: {
        instruments: [
          {
            axis: 'a',
            blow_out: 0,
            bottom: 0,
            channels: 8,
            drop_tip: 0,
            href: '/calibrate/a',
            label: 'p200',
            max_volume: 200,
            top: 0
          },
          {
            axis: 'b',
            blow_out: 0,
            bottom: 0,
            channels: 8,
            drop_tip: 0,
            href: '/calibrate/b',
            label: 'p10',
            max_volume: 10,
            top: 0
          }
        ]
      }
    }
  }
}

let instrument = {'axis': 'a'}
let deck = [
  { slot: 'A1',
    label: 'p200-rack',
    type: 'tiprack-200ul',
    href: { a: '/calibrate/a/A1/p200-rack' },
    instruments: [{ axis: 'a', calibrated: false, label: 'p200' }]
  },
  { slot: 'B2',
    label: 'trash',
    type: 'point',
    href: { b: '/calibrate/b/B2/trash' },
    instruments: [{ axis: 'b', calibrated: false, label: 'p10' }]
  }]

const mockStore = getMockStore()
const propsData = { instrument, deck }
let deckMap = getRenderedVm(DeckNavigation, propsData, mockStore)

describe('DeckNavigation.vue', () => {
  it('receives deck and instrument as props', () => {
    expect(typeof deckMap.deck[0]).to.equal('object')
  })
  it('renders the correct number of slots based on robot type', () => {
    const slots = deckMap.$el.querySelectorAll('.deck-slot')
    expect(slots.length).to.equal(10)
  })
})
