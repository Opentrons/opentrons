(function() {

    function StepWizard() {
        this.template_root = '';
        this.data = false;
        this.checklist_view = null;
        this.task_view = null;
        this.task_transforms = {};
        this.step_transforms = {};
        this.current_step = {}; //current step object
        this.current_task = {}; //current 
        this.step_index = 0;
        this.task_index = 0;

    }

    StepWizard.prototype = {

        setTemplateRoot: function(name) {
            /**
             Sets the root name of templates to be utilized for 
             the step wizard.
            */
            this.template_root = name;
        },

        setData: function(data) {
            /** 
             Updates step wizard data, which then triggers a
             re-render of everything.
            */
            this.data = data;
            this.current_task = this.data[this.task_index];
            this.current_step = this.current_task.steps[this.step_index];
            this.applyTransforms();
            this.render();
        },

        attachChecklist: function(containerID) {
            /**
             Sets the container of the checklist element.
             When step data is rendered, all will be sent to the
             checklist template.
            */
            this.checklist_container = containerID;
            if (!this.data) return;
            this.checklist_view = new View(this.template_root + 'checklist');
            this.checklist_view.attach(containerID);
        },

        attachTaskPane: function(containerID) {
            /**
             Sets the container of the taskpane element.
             When step data is rendered, only the current step will
             be sent to the task pane template.
            
             Additionally, the task pane template will be automatically
             grabbed from the set of templates by its template name.
            
             For example, protocol_setup/calibration/jog/12 will
             render the jog step template and pass in the data for 
             the step with the ID of 12.
            */
            this.task_container = containerID;
        },

        ensureViews: function() {
            if (this.checklist_container && !this.checklist_view) {
                this.checklist_view = new View(this.template_root + 'checklist');
                this.checklist_view.attach(this.checklist_container);
            }
            if (this.task_container && !this.task_view) {
                this.task_view = new View(
                    this.template_root + this.current_task.task_type
                );
                this.task_view.attach(this.task_container);
            }
        },

        render: function() {
            if (!this.data) return;
            this.ensureViews();
            if (this.checklist_view) {
                this.checklist_view.setData({ steps: this.data });
            }
            if (this.task_view) {
                this.attachTaskPane(this.task_container);
                this.task_view.setData(this.current_step);
            }
        },

        setStepTransforms: function(taskType, transforms) {
            /**
             Allows you to pass an object for each taskType which modifies the
             step data that gets sent from LabSuite to the template by running a 
             function attached to each key.

             Functions get passed the all step data and return the value
             for that key, which then gets added to the data that gets passed
             to the template.

             This is a one-way binding.
             */
            if (!transforms) {
                transforms = taskType;
                taskType = '_global';
            }
            this.step_transforms[taskType] = transforms;
        },

        applyTransforms: function() {
            this.applyStepTransforms();
            this.applyTaskTransforms();
            return (JSON.parse(JSON.stringify(this.data)));
        },

        setTaskTransforms: function(taskType, transforms) {
            /**
             Allows you to add metadata to tasks.

             Functions get passed the whole set of task data and return the value
             for that key, which then gets added to the data that gets passed
             to the template.

             All tasks use the same transformations.

             This is a one-way binding.
             */
            if (!transforms) {
                transforms = taskType;
                taskType = '_global';
            }
            this.task_transforms[taskType] = transforms;
        },

        applyTaskTransforms: function() {
            // For each task...
            for (k in this.data) {
                this.transformData(
                    this.task_transforms[this.data[k].task_type],
                    this.data[k]
                );
                this.transformData(
                    this.task_transforms._global,
                    this.data[k]
                );
            }
        },

        applyStepTransforms: function() {
            // For each task...
            for (k in this.data) {
                var task = this.data[k];
                var taskType = task.task_type;
                var transforms = this.step_transforms[taskType];
                task.index = k;
                for (i in task.steps) {
                    // Tie step to its parent task_type and position.
                    task.steps[i].task_type = taskType;
                    task.steps[i].step_index = i;
                    task.steps[i].task_index = k;
                    // Booleans to hide Prev/Next btns for first and last step
                    task.steps[i].first = (k == 0 && i == 0);
                    task.steps[i].last = (k >= this.data.length - 1 && i >= task.steps.length - 1);

                    // Task type-specific.
                    this.transformData(
                        this.step_transforms[taskType],
                        task.steps[i]
                    );
                    // Global
                    this.transformData(
                        this.step_transforms._global,
                        task.steps[i]
                    );
                }
            }
        },

        getStepLocation: function() {
            //get current task and step objects
            var task = this.current_task;
            var step = this.current_step;
            //get indexes for both task and step 
            this.task_index = this.data.indexOf(task);
            this.step_index = task.steps.indexOf(step);
        },

        prevStep: function() {
            //set the prev and next
            this.getStepLocation();
            var prev_step_index, prev_task_index;
            //if first step in current task, advance to last step in prev task group
            if (this.step_index == 0) {
                prev_task_index = this.task_index - 1;
                var prev_task = this.getTaskByIndex(prev_task_index);
                prev_step_index = prev_task.steps.length - 1;
            }
            //otherwise, advance to prev step in current task group
            else {
                prev_task_index = this.task_index;
                prev_step_index = this.step_index - 1;
            }
            //get prev step object
            var prev = wizard.getStepByIndex(prev_task_index, prev_step_index);
            //update url and load paths and views 
            window.location = wizard.getStepHref(prev.id);

        },

        nextStep: function() {
            this.getStepLocation();
            //find the length of step array within current task
            var num_steps = this.current_task.steps.length - 1;
            var next_step_index, next_task_index;
            //if last step in current task, advance to first step in next task group
            if (this.step_index == num_steps) {
                next_task_index = this.task_index + 1;
                next_step_index = 0;
            }
            //otherwise, advance to next step in current task group
            else {
                next_task_index = this.task_index;
                next_step_index = this.step_index + 1;
            }
            //get next step object
            var next = wizard.getStepByIndex(next_task_index, next_step_index);
            //update url and load paths and views 
            window.location = wizard.getStepHref(next.id);

        },

        transformData: function(transforms, data) {
            if (!transforms) return;
            var cache = (JSON.parse(JSON.stringify(data)));
            for (t in transforms) {
                // We don't want the data passed into the
                // transform to be mutated directly.
                var clone = (JSON.parse(JSON.stringify(cache)));
                // But we do want to mutate step data.
                var val = transforms[t](clone);
                if (val !== undefined) data[t] = val;
            }
        },
        getStepByID: function(stepID) {
            for (var i in this.data) {
                var task = this.data[i];
                for (var j in task.steps) {
                    var step = task.steps[j];
                    if (step.id == stepID) {
                        return [task, step];
                    }
                }
            }
            throw new Error("Invalid step id: " + stepID);
        },

        setStepByID: function(stepID) {
            task_step = this.getStepByID(stepID);
            this.setCurrentTaskStep(task_step[0], task_step[1]);
        },

        setCurrentTaskStep: function(task, step) {
            this.current_task.active = false;
            this.current_task = task;
            task.active = true;
            this.current_step.active = false;
            this.current_step = step;
            step.active = true;
            this.task_view = false;
            this.render();
        },

        getStepByIndex: function(task, step) {
            return this.data[task].steps[step];
        },

        getTaskByIndex: function(task) {
            return this.data[task];
        },

        setStepByIndex: function(task, step) {
            var id = this.data[task].steps[step].id;
            this.setStepByID(id);
        },

        // Returns index of last step in given task
        // Needed for finding previous step when switching tasks.
        getStepCount: function(task) {
            return this.data[task].steps.length - 1;
        },

        getStepHref: function(id) {
            return this.getStepByID(id)[1].href;
        }

    }

    function Step(wizard, taskType, data) {
        this.wizard = wizard;
        this.task_type = taskType;
        this.data = data;
    }

    Step.prototype = {
        set: function(data) {
            wizard.setData(newStepDataResponseFromLabSuite);
        }
    }

    window.StepWizard = StepWizard;

}());
