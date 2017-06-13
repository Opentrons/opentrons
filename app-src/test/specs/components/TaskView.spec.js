/* global describe, it */
import { expect } from 'chai'
import VueRouter from 'vue-router'
import { getRenderedVm } from '../../util.js'
import TaskView from 'src/components/TaskView.vue'

function getMockStore () {
  return {
    state: {
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
          }
        ],
        deck: [
          {
            slot: 'A1',
            label: 'p200-rack',
            type: 'tiprack-200ul',
            href: { a: '/calibrate/a/A1/p200-rack' },
            instruments: [{ axis: 'a', calibrated: false, label: 'p200' }]
          }
        ]
      }
    }
  }
}

const mockStore = getMockStore()
const router = new VueRouter({
  routes: [
  { name: 'instrument', path: '/calibrate/:instrument', component: TaskView },
  { name: 'placeable', path: '/calibrate/:instrument/:slot/:placeable', component: TaskView }]
})
const taskView = getRenderedVm(TaskView, null, null, mockStore, router)

router.push({name: 'placeable', params: {instrument: 'a', slot: 'A1', placeable: 'p200-rack'}})

describe('TaskView.vue', () => {
  it('should retrieve and render the correct instrument info', () => {
    let instrument = taskView.instrument()
    expect(instrument.axis).to.equal('a')
    expect(instrument.label).to.equal('p200')

    let instrumentInfo = taskView.$el.querySelector('#instrument-pane h1')
    let pipetteChannels = taskView.channels
    let pipetteLocation = taskView.instrumentLocation
    expect(pipetteChannels).to.equal('multi')
    expect(pipetteLocation).to.equal('right')
    expect(instrumentInfo.innerHTML).to.contain('p200')
    expect(instrumentInfo.innerHTML).to.contain(pipetteLocation).and.to.contain(pipetteChannels)
  })
  it('should should retrieve render the correct placeable info', () => {
    router.push('/calibrate/a/A1/p200-rack')
    let placeable = taskView.placeable()
    expect(placeable.slot).to.equal(taskView.params().slot)
    expect(placeable.label).to.equal('p200-rack')
    let placeableInfo = taskView.$el.querySelector('#placeable-pane h1')
    expect(placeableInfo.innerHTML).to.contain(placeable.slot).and.to.contain(placeable.label)
  })
})
