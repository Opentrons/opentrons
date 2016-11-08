<template>
	<section id="task-pipette" >
		<h1 class="title">Calibrate the p10 pipette</h1>
		<span>
		<div class="calibrate-pipette">
			<section class="calibrate top" @mouseenter="toggleMode('top')">
				<span class="title">TOP</span>
				<button @click="calibrateInstrument(currentAxis(), 'top')" class="btn-calibrate save">SAVE</button>
				<button @click="moveToPlungerPosition(currentAxis(), 'top')" class="btn-calibrate move-to">MOVE TO</button>
			</section>

			<section class="calibrate bottom" @mouseenter="toggleMode('bottom')">
				<span class="title">BOTTOM</span>
				<button @click="calibrateInstrument(currentAxis(), 'bottom')" class="btn-calibrate save">SAVE</button>
				<button @click="moveToPlungerPosition(currentAxis(), 'bottom')" class="btn-calibrate move-to">MOVE TO</button>
			</section>

			<section class="calibrate blowout" @mouseenter="toggleMode('blow-out')">
				<span class="title">BLOWOUT</span>
				<button @click="calibrateInstrument(currentAxis(), 'blow_out')" class="btn-calibrate save">SAVE</button>
				<button @click="moveToPlungerPosition(currentAxis(), 'blow_out')" class="btn-calibrate move-to">MOVE TO</button>
			</section>

			<section class="calibrate drop-tip" @mouseenter="toggleMode('drop-tip')">
				<span class="title">DROP TIP</span>
				<button @click="calibrateInstrument(currentAxis(), 'drop_tip')" class="btn-calibrate save">SAVE</button>
				<button @click="moveToPlungerPosition(currentAxis(), 'drop_tip')" class="btn-calibrate move-to">MOVE TO</button>
			</section>
		</div>
		<div class="pipette-diagrams" v-bind:class="currentMode">
            <img src="../assets/img/pipette_top.png"/>
        </div>
		</span>
		<section class="calibrate tips">
		<button @click="pickUpTip(currentAxis())" class="btn-calibrate move-to">PICK UP TIP</button>
		<button @click="dropTip(currentAxis())" class="btn-calibrate move-to">DROP TIP</button>
		</section>
	</section>
</template>

<script>
  export default {
    name: 'CalibrateInstrument',
    data: function() {
      return {
        currentMode : 'drop-tip'
      }
    },
    methods: {
			currentAxis() {
				return this.$route.params.instrument
			},
			toggleMode(mode){
        this.currentMode = mode
        console.log(mode)
      },
    	calibrateInstrument(axis, position) {
    		this.$store.dispatch("calibrate", {axis, position})
    	},
      moveToPlungerPosition(axis, position) {
        this.$store.dispatch("moveToPosition", {axis, position})
      },
			pickUpTip(axis) {
		    this.$store.dispatch("pickUpTip", { axis })
		  },
		  dropTip(axis) {
		    this.$store.dispatch("dropTip", { axis })
		  }
    }
  }
</script>
