<template>

<div class="calibration-modal">
	<!-- Show Images based on container type. -->
	<div class="well-img">
		<img src="../assets/img/well_bottom.png" v-show="placeableType('default')" /> 
		<img src="../assets/img/tiprack_top.png" v-show="placeableType('tiprack')"/>
		<img src="../assets/img/point_top.png" v-show="placeableType('point')"/>
	</div>

	<!-- Calibrate to bottom if point or default well -->
	<div class="update bottom" v-show="placeableType('default') || placeableType('point')">
		<span class="position bottom">Bottom</span>
		<button class="btn-update save bottom" @click="calibratePlaceable(placeable,instrument)" >Save </button>
		<button class="btn-update moveto" :class="{'disabled': !placeable.calibrated}">Move To </button>
	</div>

	<!-- Calibrate to top for tiprack, toggle pick up tip button -->
	<div class="update top" v-show="placeableType('tiprack')">
		<span class="position top">Tiprack</span>
		<button class="btn-update save top" @click="calibratePlaceable(placeable,instrument)">Save </button>
		<button class="btn-update moveto" :class="{'disabled': !placeable.calibrated}">Move To </button>
		<button class="pick-tip" :class="{'disabled': !placeable.calibrated}">Pick Up Tip</button>
	</div>

</div>
<!-- End Calibration Modal -->
	
</template>

<script>
  export default {
    name: 'CalibratePlaceable',
    props: ['instrument', 'placeable', 'type'],
    methods: {
			placeableType(type){
				return this.type === type
			},
			calibratePlaceable(placeable, instrument){
				let slot = placeable.slot
				let label = placeable.label
				let axis = instrument.axis
				this.$store.dispatch("calibratePlaceable", {slot: slot, label: label, axis: axis})
			}
    },
    computed: { 
    	currentType(){
    		return placeableType(this.type);
    	}
    }

  }
</script>