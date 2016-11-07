<template>
	<section id="task-pipette">
		<h1 class="title">Calibrate the p10 pipette</h1>
		<div class="calibrate-pipette">
			<section class="calibrate top">
				<span class="title">TOP</span>
				<button @click="calibrateInstrument(instrument, 'top')" class="btn-calibrate save">SAVE</button>
				<button @click="moveToPlungerPosition(instrument, 'top')" class="btn-calibrate move-to">MOVE TO</button>
			</section>

			<section class="calibrate bottom">
				<span class="title">BOTTOM</span>
				<button @click="calibrateInstrument(instrument, 'bottom')" class="btn-calibrate save">SAVE</button>
				<button @click="moveToPlungerPosition(instrument, 'bottom')" class="btn-calibrate move-to">MOVE TO</button>
			</section>

			<section class="calibrate blowout">
				<span class="title">BLOWOUT</span>
				<button @click="calibrateInstrument(instrument, 'blow_out')" class="btn-calibrate save">SAVE</button>
				<button @click="moveToPlungerPosition(instrument, 'blow_out')" class="btn-calibrate move-to">MOVE TO</button>
			</section>

			<section class="calibrate drop-tip">
				<span class="title">DROP TIP</span>
				<button @click="calibrateInstrument(instrument, 'drop_tip')" class="btn-calibrate save">SAVE</button>
				<button @click="moveToPlungerPosition(instrument, 'drop_tip')" class="btn-calibrate move-to">MOVE TO</button>
			</section>
		</div>
		<section class="calibrate tips">
		<button @click="pickUpTip(instrument)" class="btn-calibrate move-to">PICK UP TIP</button>
		<button @click="dropTip(instrument)" class="btn-calibrate move-to">DROP TIP</button>
		</section>
	</section>
</template>

<script>
  export default {
    name: 'CalibrateInstrument',
    methods: {
    	calibrateInstrument(instrument, position) {
    		let axis = instrument.axis
    		this.$store.dispatch("calibrate", {axis, position})
    	},
      moveToPlungerPosition(instrument, position) {
        let axis = instrument.axis
        this.$store.dispatch("moveToPosition", {axis, position})
      },
			pickUpTip(instrument) {
		    let axis = instrument.axis
		    this.$store.dispatch("pickUpTip", { axis: axis })
		  },
		  dropTip(instrument) {
		    let axis = instrument.axis
		    this.$store.dispatch("dropTip", { axis: axis })
		  }
    }
  }
</script>
