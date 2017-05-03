<template>
  <span>
    <button class='btn-calibrate save' @click='calibrate()'>SAVE</button>
    <button :class="[{'disabled': !isCalibrated}, 'btn-calibrate', 'move-to']" @click='moveToPosition()'>MOVE TO</button>
    <button v-if='isTiprack' :class="[{'disabled': !isCalibrated}, 'btn-calibrate', 'move-to']" @click='pickUpTip()'>PICK UP TIP</button>
    <button v-if='isTiprack' :class="[{'disabled': !isCalibrated}, 'btn-calibrate', 'move-to']" @click='dropTip()'>DROP TIP</button>
  </span>
</template>

<script>
  import { trackEvent } from '../analytics'

  export default {
    name: 'CalibratePlaceable',
    props: ['instrument', 'placeable'],
    methods: {
      calibrate () {
        let slot = this.placeable.slot
        let label = this.placeable.label
        let axis = this.instrument.axis
        this.$store.dispatch('calibrate', {slot, label, axis})

        function isCalibrated () {
          // TODO: Add a condition in the state that tracks if deck is calibrated
          if (!this.$store.state.tasks || this.$store.state.tasks.length === 0) return false
          return this.$store.state.tasks.every((instrument) => {
            let placeableCalibrated = instrument.placeables.every((placeable) => {
              return placeable.calibrated
            })
            return instrument.calibrated && placeableCalibrated
          })
        }
        if (isCalibrated.bind(this)()) {
          trackEvent('DECK_CALIBRATED')
        }
      },
      moveToPosition () {
        let slot = this.placeable.slot
        let label = this.placeable.label
        let axis = this.instrument.axis
        this.$store.dispatch('moveToPosition', {slot, label, axis})
      },
      pickUpTip () {
        let axis = this.instrument.axis
        this.$store.dispatch('pickUpTip', {axis})
      },
      dropTip () {
        let axis = this.instrument.axis
        this.$store.dispatch('dropTip', {axis})
      }
    },
    computed: {
      isTiprack () {
        return this.placeable.sanitizedType === 'tiprack'
      },
      isCalibrated () {
        return this.placeable.calibrated
      }
    }
  }
</script>
