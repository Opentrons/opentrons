/* Gets run every time the user is in protocol_setup/ anything. */

var stubData = [{
        task_type: "select_protocol",
        steps: [{
            id: 'uniquekey1',
            data: {
                selected_file: 'elisa.json', // DEFAULT
                required: true,
                completed: false,
                previous_runs: [{
                    id: 'foo1',
                    file_name: 'elisa.json',
                    description: "FOO",
                    last_run: 'timestamp',
                    run_count: 34,

                }, {
                    id: 'foo2',
                    file_name: 'talen.json',
                    description: "BAR",
                    last_run: 'timestamp',
                    run_count: 234,
                }]
            }
        }]
    }, {
        task_type: "check_protocol",
        steps: [{
                id: 'cp1',
                data: {
                    check_type: 'verify_syntax',
                    required: true,
                    completed: true,
                    error: 'invalid syntax line 42',
                    support_docs: [{
                        text: 'JSON Lint',
                        type: 'link',
                        url: 'http://jsonlint.com/'

                    }]
                }
            }, {
                id: 'cp2',
                data: {
                    check_type: 'processing',
                    required: true,
                    completed: true,
                    error: 'undefined labware line 67',
                    support_docs: [{
                        text: 'Error Support Documentation',
                        type: 'link',
                        url: 'http://www.animalplanet.com/tv-shows/my-cat-from-hell/'
                    }]
                }
            }

        ]
    }, {
        task_type: "calibrate",
        steps: [{
            id: 'uniquekey3',
            data: {
                required: true,
                completed: false,
                user_container_name: 'p200-rack',
                container_name: 'tiprack.p200',
                pipette: "p200 Multi Channel",
                actuator: "center",
                deck_position: 'A1',
                x: 0,
                y: 0,
                z: 0
            }
        }, {
            id: 'uniquekey4',
            data: {
                required: true,
                completed: false,
                user_container_name: 'Trough',
                container_name: 'reservior.12',
                pipette: "p200 Multi Channel",
                actuator: "center",
                deck_position: 'C3',
                x: 0,
                y: 0,
                z: 0
            }
        }, {
            id: 'uniquekey5',
            data: {
                required: true,
                completed: false,
                user_container_name: 'Standard',
                container_name: 'microplate.96.pcr.flat',
                pipette: "p200 Multi Channel",
                actuator: "center",
                deck_position: 'E1',
                x: 0,
                y: 0,
                z: 0
            }
        }, {
            id: 'uniquekey6',
            data: {
                required: true,
                completed: false,
                user_container_name: 'Trash',
                container_name: 'point',
                pipette: "p200 Multi Channel",
                actuator: "center",
                deck_position: 'B2',
                x: 0,
                y: 0,
                z: 0
            }
        }, {
            id: 'uniquekey7',
            data: {
                required: true,
                completed: false,
                user_container_name: 'Source-1',
                container_name: 'microplate.96.pcr.flat',
                pipette: "p200 Multi Channel",
                actuator: "center",
                deck_position: 'D1',
                x: 0,
                y: 0,
                z: 0
            }
        }, {
            id: 'uniquekey8',
            data: {
                required: true,
                completed: false,
                user_container_name: 'Output-1',
                container_name: 'microplate.96.pcr.flat',
                pipette: "p200 Multi Channel",
                actuator: "center",
                deck_position: 'C1',
                x: 0,
                y: 0,
                z: 0
            }
        }]
    }, {
        task_type: "calibrate_pipette",
        steps: [{
            id: 'uniquekey9',
            data: {
                required: true,
                completed: false,
                pipette: "p200 Multi Channel",
                actuator: "center",
                top: 0,
                bottom: 0,
                blowout: 0,
                droptip: 0
            }
        }]
    }

];

// Send selected protocol.
//{ step_id: 'uniquekey1', data: { completed: true, selected_file: 'foo1' }}

// Upload new protocol.
// (foo2 generated as ID for uploaded protocol)
//{ step_id: 'uniquekey1', data: { completed: true, selected_file: 'foo2' }}

// Change calibration
//{ step_id: 'uniquekey2', data: { x: 1, y: 3, z: 10 } }

// Reuse the old calibration.
//{ step_id: 'uniquekey2', data: { completed: true } }

wizard = new StepWizard();

wizard.setTaskTransforms({
    enumerate: function(task) {
        return !!(task.steps[0].title || false);
    },
    href: function(task) {
        return task.steps[0].href;
    },
    title: function(task) {
        if (!task.title) {
            var words = task.task_type.split('_');
            words = words.map(function(word) {
                return word[0].toUpperCase() + word.slice(1);
            });
            return words.join(' ');
        }
    },
    n_steps: function(task) {
        return task.steps.length;
    }

});

wizard.setTaskTransforms('calibrate', {
    title: function(task) {
        return "Calibrate Containers";
    },
    href: function(task) {
        return 'protocol_setup/calibrate/' + task.id;
    }
});

wizard.setTaskTransforms('calibrate_pipette', {
    title: function(task) {
        return "Calibrate Pipette";
    },
    href: function(task) {
        return 'protocol_setup/calibrate_pipette/' + task.id;
    }
})

// Type-specific step transforms.
wizard.setStepTransforms('calibrate', {
    title: function(step) {
        var name = step.data.user_container_name || step.data.container_name;
        name = name[0].toUpperCase() + name.slice(1);
        return name + " (" + step.data.deck_position + ")"
    },
    isSingle: function(step){
        var pipette = step.data.pipette.split(' ');
        if (pipette[1].toLowerCase()== "single"){
            return true;
        }else{
            return false;
        }
    },
    image_top: function(step) {
        var pipette = step.data.pipette.split(' ');
        var image = pipette[1].toLowerCase() + "." + step.data.container_name + ".top.jpg";
        return image;
    },
    image_front: function(step) {
        var pipette = step.data.pipette.split(' ');
        var image = pipette[1].toLowerCase() + "." + step.data.container_name + ".front.jpg";
        return image;
    },
    isContainer: function(step) {
        var info = step.data.container_name.split('.');
        if (info[0] == "point") {
            return false
        } else {
            return true
        };
    },

});

wizard.setStepTransforms('calibrate_pipette', {
    title: function(step) {
        var name = step.data.pipette;
        var a = step.data.actuator;
        a = a.charAt(0);
        return name + " (" + a + ")";
    },
    centerPipette: function(step){
        var a = step.data.actuator;
        if (a =="center"){
            return true;
        }else{
            return false;
        }
    }
});

wizard.setStepTransforms('review_deckmap', {
    deckmap: function(step) {
        var arrKeys = [];
        //loop through array of all possible keys
        //check if a key matches an assigned deckslot
        //if step.deckmap[v]
        //output data format for template
        var output = [
            { slot: "a1", container: "tiprack.200", title: "p200 Tiprack" },
            { slot: "a2", container: false, title: false },
            { slot: "a3", container: false, title: false },
            { slot: "b1", container: false, title: false },
            { slot: "b2", container: "point", title: "Trash" },
            { slot: "b3", container: false, title: false },
            { slot: "c1", container: "plate.96.flat.10.4mm", title: "Source" },
            { slot: "c2", container: false, title: false },
            { slot: "c3", container: "trough.12row", title: "Trough" },
            { slot: "d1", container: "plate.96.flat.10.4mm", title: "Output" },
            { slot: "d2", container: false, title: false },
            { slot: "d3", container: false, title: false },
            { slot: "e1", container: "plate.96.flat.10.4mm", title: "Standards" },
            { slot: "e2", container: false, title: false },
            { slot: "e3", container: false, title: false }
        ];
    }
});

wizard.setStepTransforms('check_protocol', {
    title: function(step) {
        var name = step.data.check_type;
        var words = step.data.check_type.split('_');
        words = words.map(function(word) {
            return word[0].toUpperCase() + word.slice(1);
        });
        return words.join(' ');
    }
});

// Global step transforms run on all steps.
wizard.setStepTransforms({
    href: function(step) {
        return '/protocol_setup/' + step.task_type + '/' + step.id;
    },
    first_step: function(step) {
        return step.first;
    },
    last_step: function(step) {
        return step.last;
    },
    index: function(step) {
        return step.task_index + '-' + step.step_index + '-' + step.num_steps;
    },
    completed: function(step){
        return step.data.completed;
    }

});

wizard.setTemplateRoot('protocol_setup.');
wizard.setData(stubData);
wizard.attachChecklist('step-list');
wizard.attachTaskPane('task-pane');

var stepID = window.location.pathname.split('/').pop();
wizard.setStepByID(stepID);


// Event delegation lives here
// (sends wizard commands)
delegateEvent('click', 'li', function() {
    console.log(arguments);
});



//Delegators to handle prev next functionality
delegateEvent('click', '.prev', function() {    
    wizard.prevStep();
});

delegateEvent('click', '.next', function() {
    wizard.nextStep();
});



// Delegator to handle forms goes here.
delegateEvent('submit', 'form[method=magic]', function(e, el) {
    e.preventDefault();
    var form = new FormData(el);
    var bestThing = form.get('bestThing');
    console.log("The best thing ever is:" + bestThing)
});

delegateEvent('submit', 'form[method=upload]', function(e, el) {
    e.preventDefault();
    var form = new FormData(el);
    var protocol = form.get('file');
    console.log("protocol uploaded: " + protocol);
});
