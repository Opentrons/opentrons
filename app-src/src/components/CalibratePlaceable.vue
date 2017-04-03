<template>
  <div id="task-placeable">
      <h1>{{placeable.label}} at slot {{placeable.slot}}</h1><br>
      <h1 class='title'>
        Calibrate the {{instrument.label}} pipette to the
        {{placeable.sanitizedType === 'tiprack' ? 'center' : 'bottom'}}
        {{calibrationPoint}} of your {{placeable.label}} container
      </h1>
    <div class="more-info">
    <a role="button" id="show-modal" @click="showModal = true">more info</a>

    <modal v-if="showModal" @close="showModal = false" :placeable="placeable" :instrument="instrument">
    </modal>
    </div>
    <button class='btn-calibrate save' @click='calibrate()'>SAVE</button>
    <button :class="[{'disabled': !isCalibrated}, 'btn-calibrate', 'move-to']" @click='moveToPosition()'>MOVE TO</button>
    <button v-if='isTiprack' :class="[{'disabled': !isCalibrated}, 'btn-calibrate', 'move-to']" @click='pickUpTip()'>PICK UP TIP</button>
    <button v-if='isTiprack' :class="[{'disabled': !isCalibrated}, 'btn-calibrate', 'move-to']" @click='dropTip()'>DROP TIP</button>
  </span>
  
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
        return this.placeable.calibrated
      },
      calibrationPoint () {
        let type = this.placeable.sanitizedType
        let position = 'of the A1 well'
        if (type === 'trough') {
          position = 'of the A1 slot'
        } else if ((type === 'tiprack' || type === 'default') && this.instrument.channels === 8) {
          position = 'of the A1 row'
        } else if (type === 'point') {
          position = ''
        }
        return position
      }
    }
  }

</script>
