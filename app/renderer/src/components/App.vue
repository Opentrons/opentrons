<template>
  <div>
    <header id="home-connect">
        <Home></Home>
        <div class="logo">
          <img src="assets/img/logo_rgb_transparent.png" />
        </div>
        <nav class="connect">
          <Connect></Connect>
        </nav>
    </header>
    <section id="protocol">
        <!-- <form ref="form" @submit="uploadProtocol" action="http://127.0.0.1:5000/upload" method="POST" enctype="multipart/form-data" :class="['step-upload', classObject]"> -->
        <form class="upload">
            <div class="fileUpload">
                <span>Click or Drag to Upload</span>
                <input ref="input" type="file" name="file" class="upload" />
            </div>
        </form>
    </section>
    <main id="container">
        <aside id="jog">
            <h2 class="title" id="xy">Jog [XY]</h2>
            <h2 class="title" id="z">Jog [Z]</h2>
            <h2 class="title" id="p">Plunger</h2>
            <hr>
            <section id="jog-controls">
                <span class="xy">

                    <button class="btn y up">&uarr;</button>
                    <button class="btn x left">&larr;</button>
                    <button class="btn y down">&darr;</button>
                    <button class="btn x right">&rarr;</button>
                </span>
                <span class="z">
                    <button class="btn z up">&uarr;</button>
                    <button class="btn z down">&darr;</button>
                </span>
                <span class="p">
                    <button class="btn p up">&uarr;</button>
                    <button class="btn p down">&darr;</button>
                </span>
            </section>
            <h2 class="title">Select Increment [mm]</h2>
            <hr>
            <section id="increment">
                <div>
                    <input type="radio" id="50" name="increment" value="50" />
                    <label for="50"><span></span>50</label>
                </div>
                <div>
                    <input type="radio" id="20" name="increment" value="20" />
                    <label for="20"><span></span>20</label>
                </div>
                <div>
                    <input type="radio" id="10" name="increment" value="10" />
                    <label for="10"><span></span>10</label>
                </div>
                <div>
                    <input type="radio" id="1" name="increment" value="1" />
                    <label for="1"><span></span>1</label>
                </div>
                <div>
                    <input type="radio" id="0.5" name="increment" value="0.5" />
                    <label for="0.5"><span></span>0.5</label>
                </div>
                <div>
                    <input type="radio" id="0.1" name="increment" value="0.1" />
                    <label for="0.1"><span></span>0.1</label>
                </div>
                <div>
                    <input type="radio" id="slot" name="increment" value="slot" />
                    <label for="slot"><span></span>SLOT</label>
                </div>
            </section>
            <h2 class="title">Move to Slot</h2>
            <hr>
            <section id="deck">
                <div class="deck">
                    <button>A3</button>
                    <button>B3</button>
                    <button>C3</button>
                    <button>D3</button>
                    <button>E3</button>
                    <button>A2</button>
                    <button>B2</button>
                    <button>C2</button>
                    <button>D2</button>
                    <button>E2</button>
                    <button>A1</button>
                    <button>B1</button>
                    <button>C1</button>
                    <button>D1</button>
                    <button>E1</button>
                </div>
            </section>
        </aside>
        <section id="task-pane">
            <aside id="step-list">
                <div class="instrument">
                    <h3 class="title">p200</h3>
                    <ul>
                        <li><a class="completed">[A1] tiprack200</a></li>
                        <!-- router link active class automatically applied
                by router, this is just for demo purposed here -->
                        <li><a class="router-link-active">[B2] trash</a></li>
                        <li><a>[C1] plate</a></li>
                        <li><a>[C2] tuberack</a></li>
                        <li><a>Pipette</a></li>
                    </ul>
                </div>
                <div class="instrument">
                    <h3 class="title">p10</h3>
                    <ul>
                        <li><a>[A1] tiprack10</a></li>
                        <li><a>[B2] trash</a></li>
                        <li><a>[C1] plate</a></li>
                        <li><a>[C2] tuberack</a></li>
                        <li><a>Pipette</a></li>
                    </ul>
                </div>
            </aside>
            <section id="task">
                <h1 class="title">Calibrate the p10 pipette to the center of your trash container</h1>
                <button class="btn-calibrate save">SAVE</button>
                <button class="btn-calibrate move-to">MOVE TO</button>
                 <button class="btn-calibrate move-to">PICK UP TIP</button>
                  <button class="btn-calibrate move-to">DROP TIP</button>
            </section>
        </section>
    </main>
  <div>
</template>


<script>
  import Connect from './Connect.vue'
  import Home from './Home.vue'

  export default {
    components: {
      Connect,
      Home
    }
  }
</script>

<style lang="sass">
  @import "../assets/sass/new.scss"
</style>
