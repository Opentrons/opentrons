<template>
	<div class="calibration-modal">
		<div class="well-img">
			<img src="../assets/img/well_bottom.png" v-show="placeableType('default')" />
			<img src="../assets/img/tiprack_top.png" v-show="placeableType('tiprack')"/>
			<img src="../assets/img/point_top.png" v-show="placeableType('point')"/>
		</div>

		<div class="update bottom" v-show="placeableType('default') || placeableType('point')">
			<span class="position bottom">Bottom</span>
			<button class="btn-placeable save bottom" @click="calibratePlaceable(placeable,instrument)">Save </button>
			<button class="btn-placeable moveto" :class="{'disabled': !placeable.calibrated}" @click="moveToPlaceable(placeable,instrument)">Move To </button>
		</div>

		<div class="update top" v-show="placeableType('tiprack')">
			<span class="position top">Tiprack</span>
			<button class="btn-placeable save top" @click="calibratePlaceable(placeable,instrument)">Save </button>
			<button class="btn-placeable moveto" :class="{'disabled': !placeable.calibrated}" @click="moveToPlaceable(placeable,instrument)">Move To </button>
			<button class="pick-tip" :class="{'disabled': !placeable.calibrated}">Pick Up Tip</button>
		</div>
	</div>
</template>

<script>
  export default {
    name: 'CalibratePlaceable',
    props: ['instrument', 'placeable', 'type'],
    methods: {
			placeableType(type) {
				return this.type === type
			},
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
      }
    }
  }
</script>
