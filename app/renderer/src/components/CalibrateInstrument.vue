<template>

<div class="calibration-modal mode-droptip">
	<div class="pipette-img">
<!-- 	  <img src="../assets/img/pipette_top.png" class="top" />
	  <img src="../assets/img/pipette_bottom.png" class="bottom" />
	  <img src="../assets/img/pipette_blowout.png" class="blowout" /> -->
	  <img src="../assets/img/pipette_droptip.png" class="droptip" />
	</div>
	<div class="update">
	  <span class="position top">Top</span>
	  <button class="btn-update save top" @click="calibrateInstrument(instrument, 'top')">Save</button>
	  <button class="btn-update moveto " @click="moveToPlungerPosition(instrument, 'top')">Move</button>
	  <div class="spacer"></div>
	  <span class="position bottom">Bottom</span>
	  <button class="btn-update save bottom" @click="calibrateInstrument(instrument, 'bottom')">Save</button>
	  <button class="btn-update moveto " @click="moveToPlungerPosition(instrument, 'bottom')">Move</button>
	  <span class="position blowout">Blowout</span>
	  <button class="btn-update save blowout" @click="calibrateInstrument(instrument, 'blow_out')">Save</button>
	  <button class="btn-update moveto" @click="moveToPlungerPosition(instrument, 'blow_out')">Move</button>
	  <span class="position droptip">Drop Tip</span>
	  <button class="btn-update save droptip" @click="calibrateInstrument(instrument, 'drop_tip')">Save</button>
	  <button class="btn-update moveto " @click="moveToPlungerPosition(instrument, 'drop_tip')">Move</button>
	  <button class="btn-update test pick-liquid">Pick Up</button>
	  <button class="btn-update test eject-liquid">Eject</button>
	</div>
	</div>
</div>
<!-- End Calibration Modal -->
	
</template>

<script>
  export default {
    name: 'CalibrateInstrument',
    props: ['instrument'],
    data: function() {
      return {

      }
    },
    methods: {
    	calibrateInstrument(instrument, position){
    		let axis = instrument.axis
    		this.$store.dispatch("calibrateInstrument", {axis: axis, position: position})
    	},
      moveToPlungerPosition(instrument, position){
        let axis = instrument.axis
        this.$store.dispatch("moveToPlungerPosition", {axis: axis, position: position})
      }	
    },
    computed: { 
    	
    }

  }
</script>