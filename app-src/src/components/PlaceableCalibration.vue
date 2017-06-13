<template>
  <div class="placeable-calibration">
    <button class='btn-calibrate save' @click='calibrate()'>SAVE {{placeable.label}}</button>
    <button :class="[{'disabled': !isCalibrated()}, 'btn-calibrate', 'move-to']" @click='moveToPosition()'>MOVE TO {{placeable.label }}</button>
  </div>
</template>

<script>
  import { trackEvent } from '../analytics'
  export default {
    name: 'PlaceableCalibration',
    data () {
      return {
      }
    },
    props: ['instrument', 'placeable'],
    methods: {
      calibrate () {
        let slot = this.placeable.slot
        let label = this.placeable.label
        let axis = this.instrument.axis
        this.$store.dispatch('calibrate', {slot, label, axis})

        function deckCalibrated () {
          // TODO: Add a condition in the state that tracks if deck is calibrated
          if (!this.$store.state.tasks || this.$store.state.tasks.deck.length === 0) return false

          let deckCalibrated = this.$store.state.tasks.deck.every((placeable) => {
            return placeable.instruments.every((instrument) => {
              return instrument.calibrated
            })
          })
          return deckCalibrated
        }

        if (deckCalibrated.bind(this)()) {
          trackEvent('DECK_CALIBRATED')
        }
      },
      moveToPosition () {
        let slot = this.placeable.slot
        let label = this.placeable.label
        let axis = this.instrument.axis
        this.$store.dispatch('moveToPosition', {slot, label, axis})
      },
      isCalibrated () {
        return this.placeable.instruments.find(element => element.axis === this.instrument.axis).calibrated
      }
    }
  }
</script>