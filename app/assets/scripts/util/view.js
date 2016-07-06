/**
 * This view code works in conjunction with some other code that takes the
 * templates in the views folder and dumps them as named script tags in
 * the DOM.
 *
 * So if you want to render the template in views/foo/bar.html,
 * you'd use 'foo.bar' as the name.
 */

function View(templateName) {
    var selector = 'script[name="'+templateName+'"][type="template"]';
    var template = document.querySelector(selector);
    if (template) {
        template = template.innerHTML;
    } else {
        template = "Can't find template "+templateName;
    }
    this.template = Handlebars.compile(template);
    this._data = {};
    this.container = null;
}

View.prototype = {

    template: '',
    _data: null,

    render: function() {
        if (!this.container) return;
        var html = this.template(this._data);
        this.container.innerHTML = html;
    },

    attach: function(id) {
        var container = document.getElementById(id);
        if (!container) {
            throw new Error(
                "Can't attach view to container ID: "+id
            )
        }
        this.container = container;
    },

    clearData: function() {
        this._data = {};
        this.render();
    },

    setData: function(obj) {
        for (var k in obj) this._data[k] = obj[k];
        
        this.render();
    },

    onRender: function(fun) {
        this.render_triggers.push(fun);
        console.log(this.render_triggers.length);
    }

};