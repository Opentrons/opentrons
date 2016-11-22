<template>
  <span>
    <button class="btn-calibrate save" @click="calibratePlaceable(placeable, instrument)">SAVE</button>
    <button :class="[{'disabled': !placeable.calibrated}, 'btn-calibrate', 'move-to']" @click="moveToPlaceable(placeable, instrument)">MOVE TO</button>
    <button v-show="isTiprack" :class="[{'disabled': !placeable.calibrated}, 'btn-calibrate', 'move-to']" @click="pickUpTip(instrument)">PICK UP TIP</button>
    <button v-show="isTiprack" :class="[{'disabled': !placeable.calibrated}, 'btn-calibrate', 'move-to']" @click="dropTip(instrument)">DROP TIP</button>
  </span>
</template>

<script>
  export default {
    name: "CalibratePlaceable",
    props: ["instrument", "placeable"],
    methods: {
      calibratePlaceable(placeable, instrument) {
        let slot = placeable.slot
        let label = placeable.label
        let axis = instrument.axis
        this.$store.dispatch("calibrate", {slot: slot, label: label, axis: axis})
      },
      moveToPlaceable(placeable,instrument) {
        let slot = placeable.slot
        let label = placeable.label
        let axis = instrument.axis
        this.$store.dispatch("moveToPosition", {slot: slot, label: label, axis: axis})
      },
      pickUpTip(instrument) {
        let axis = instrument.axis
        this.$store.dispatch("pickUpTip", { axis: axis })
      },
      dropTip(instrument) {
        let axis = instrument.axis
        this.$store.dispatch("dropTip", { axis: axis })
      },
      isTiprack() {
        this.placeable.label.includes("tiprack")
      }
    }
  }
</script>
