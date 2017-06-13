/* global describe, it */
import { expect } from 'chai'
import VueRouter from 'vue-router'
import InstrumentNavigation from 'src/components/InstrumentNavigation.vue'
import { getRenderedVm } from '../../util.js'

let instrument = {
  axis: 'a',
  blow_out: 0,
  bottom: 0,
  channels: 8,
  drop_tip: 0,
  href: '/calibrate/a',
  label: 'p200',
  max_volume: 200,
  top: null,
  calibrated: false
}

function getMockStore () {
  return {
    state: {
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
        ],
        deck: [
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
          }
        ]
      }
    }
  }
}

const propsData = { instrument }
const mockStore = getMockStore()
const router = new VueRouter({
  routes: [
  { name: 'instrument', path: '/calibrate/:instrument', component: InstrumentNavigation }
  ]
})

let instrumentNavigation = getRenderedVm(InstrumentNavigation, propsData, null, mockStore, router)

router.push({name: 'instrument', params: {instrument: 'a'}})

describe('InstrumentNavigation.vue', () => {
  it('should change active plunger position when clicked ', () => {
    expect(instrumentNavigation.$data.plungerMode).to.equal('mode-top')
    let bottomBtn = instrumentNavigation.$el.querySelector('li.bottom')
    bottomBtn.click()
    expect(instrumentNavigation.$data.plungerMode).to.equal('mode-bottom')
  })
  it('should render a pipette button for each intrument in tasks', () => {
    const pipetteBtns = instrumentNavigation.$el.querySelectorAll('button.tab')
    expect(pipetteBtns.length).to.equal(2)
  })
  it('should toggle active pipette when a pipette button it clicked', () => {
  })
})
