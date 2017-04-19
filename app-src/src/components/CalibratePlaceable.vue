<template>
  <div id="task-placeable">     
    <modal v-if="showModal" @close="showModal = false" :placeable="placeable" :instrument="instrument">
    </modal>

    <button class='btn-calibrate save' @click='calibrate()'>SAVE</button>
    <button :class="[{'disabled': !isCalibrated}, 'btn-calibrate', 'move-to']" @click='moveToPosition()'>MOVE TO</button>
  
    <span class="more-info">
    <a role="button" id="show-modal" @click="showModal = true">?</a>
    </span>
  </div>
</template>

<script>
  import Modal from './Modal.vue'

  export default {
    name: 'CalibratePlaceable',
    data () {
      return {
        showModal: false
      }
    },
    props: ['instrument', 'placeable'],
    components: {
      Modal
    },
    methods: {
      calibrate () {
        let slot = this.placeable.slot
        let label = this.placeable.label
        let axis = this.instrument.axis
        this.$store.dispatch('calibrate', {slot, label, axis})
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
        return this.instrument.calibrated
      }
    }
  }

</script>
