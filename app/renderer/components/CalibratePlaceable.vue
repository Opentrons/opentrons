<template>
  <span>
    <button class="btn-calibrate save" @click="calibratePlaceable()">SAVE</button>
    <button :class="[{'disabled': !isCalibrated}, 'btn-calibrate', 'move-to']" @click="moveToPlaceable()">MOVE TO</button>
    <button v-show="isTiprack" :class="[{'disabled': !isCalibrated}, 'btn-calibrate', 'move-to']" @click="pickUpTip()">PICK UP TIP</button>
    <button v-show="isTiprack" :class="[{'disabled': !isCalibrated}, 'btn-calibrate', 'move-to']" @click="dropTip()">DROP TIP</button>
  </span>
</template>

<script>
  export default {
    name: "CalibratePlaceable",
    props: ["instrument", "placeable"],
    methods: {
      calibratePlaceable() {
        let slot = this.placeable.slot
        let label = this.placeable.label
        let axis = this.instrument.axis
        this.$store.dispatch("calibrate", {slot, label, axis})
      },
      moveToPlaceable() {
        let slot = this.placeable.slot
        let label = this.placeable.label
        let axis = this.instrument.axis
        this.$store.dispatch("moveToPosition", {slot, label, axis})
      },
      pickUpTip() {
        let axis = this.instrument.axis
        this.$store.dispatch("pickUpTip", {axis})
      },
      dropTip() {
        let axis = this.instrument.axis
        this.$store.dispatch("dropTip", {axis})
      }
    },
    computed: {
      isTiprack() {
        return this.placeable.sanitizedType === 'tiprack'
      },
      isCalibrated() {
        return this.placeable.calibrated
      }
    }
  }
</script>
