// leave at least 2 line with only a star on it below, or doc generation fails
/**
 *
 *
 * Placeholder for custom user javascript
 * mainly to be overridden in profile/static/custom/custom.js
 * This will always be an empty file in IPython
 *
 * User could add any javascript in the `profile/static/custom/custom.js` file.
 * It will be executed by the ipython notebook at load time.
 *
 * Same thing with `profile/static/custom/custom.css` to inject custom css into the notebook.
 *
 *
 * The object available at load time depend on the version of IPython in use.
 * there is no guaranties of API stability.
 *
 * The example below explain the principle, and might not be valid.
 *
 * Instances are created after the loading of this file and might need to be accessed using events:
 *     define([
 *        'base/js/namespace',
 *        'base/js/events'
 *     ], function(IPython, events) {
 *         events.on("app_initialized.NotebookApp", function () {
 *             IPython.keyboard_manager....
 *         });
 *     });
 *
 * __Example 1:__
 *
 * Create a custom button in toolbar that execute `%qtconsole` in kernel
 * and hence open a qtconsole attached to the same kernel as the current notebook
 *
 *    define([
 *        'base/js/namespace',
 *        'base/js/events'
 *    ], function(IPython, events) {
 *        events.on('app_initialized.NotebookApp', function(){
 *            IPython.toolbar.add_buttons_group([
 *                {
 *                    'label'   : 'run qtconsole',
 *                    'icon'    : 'icon-terminal', // select your icon from http://fortawesome.github.io/Font-Awesome/icons
 *                    'callback': function () {
 *                        IPython.notebook.kernel.execute('%qtconsole')
 *                    }
 *                }
 *                // add more button here if needed.
 *                ]);
 *        });
 *    });
 *
 * __Example 2:__
 *
 * At the completion of the dashboard loading, load an unofficial javascript extension
 * that is installed in profile/static/custom/
 *
 *    define([
 *        'base/js/events'
 *    ], function(events) {
 *        events.on('app_initialized.DashboardApp', function(){
 *            require(['custom/unofficial_extension.js'])
 *        });
 *    });
 *
 * __Example 3:__
 *
 *  Use `jQuery.getScript(url [, success(script, textStatus, jqXHR)] );`
 *  to load custom script into the notebook.
 *
 *    // to load the metadata ui extension example.
 *    $.getScript('/static/notebook/js/celltoolbarpresets/example.js');
 *    // or
 *    // to load the metadata ui extension to control slideshow mode / reveal js for nbconvert
 *    $.getScript('/static/notebook/js/celltoolbarpresets/slideshow.js');
 *
 *
 * @module IPython
 * @namespace IPython
 * @class customjs
 * @static
 */
 // functions for removing elements from DOM of page in Jupyter Notebook
op_dom = {
    /************
     * Settings *
     ************/
    is_active: true,
    
    /*************
     * Functions *
     *************/

    ele_delete: function() {
        if(!op_dom.is_active) return;
        // Buttons in `file`
        $("#file_menu").parent().remove();
        // Buttons in `view`
        $("#toggle_header").remove();
        // Buttons in `help`
        $("#notebook_tour").remove();
        $("#keyboard_shortcuts").remove();
        $("#edit_keyboard_shortcuts").remove();
        $("#help_menu").children()[0].remove();
    },

    ele_delete_after: function() {
        if(!op_dom.is_active) return;
        // Buttons in `widget`
        // Due to a delay loading of the widget,
        // the DOM related to widget must be deleted
        // via postMessage from other origin.
        $("#widget-submenu").parent().remove();
    },

    init: function() {
        op_dom.ele_delete();
    },
}

actions = {
    /************
     * Settings *
     ************/
    test_mode: false,

    /*************
     * Functions *
     *************/
    add_listeners: function() {
        requirejs(['base/js/namespace', 'base/js/utils'], function (Jupyter, utils) {
            window.addEventListener('message', function(event){
                var act = event.data.actions;
                var msg = event.data.msg;
                if(typeof(act) == "undefined") return;
                // For test
                if(actions.test_mode) console.log("the iframe get: " + act + " " + msg);
                // Switch to the event
                if(act == 'save-notebook') {
                    Jupyter.notebook.save_notebook();
                }
                else if(act == 'scroll-top') {
                    Jupyter.notebook.scroll_to_top();
                }
                else if(act == 'scroll-bottom') {
                    Jupyter.notebook.scroll_to_bottom();
                }
                else if(act == 'shutdown-kernel') {
                    Jupyter.notebook.shutdown_kernel();
                }
                else if(act == 'start-kernel') {
                    Jupyter.notebook.start_session();
                }
                else if(act == 'scroll-heading') {
                    var ncs = Jupyter.notebook.ncells();
                    for (var i = 0; i < ncs; i++) {
                        icell = Jupyter.notebook.get_cell(i);
                        if (icell.cell_type == 'markdown' && icell.inner_cell[0].innerText.includes(msg)) {
                            Jupyter.notebook.scroll_to_cell(i);
                            break;
                        }
                    }
                }
                else if(act.substring(0, 6) == 'export') {
                    var format = act.substring(7)
                    // false for preview
                    var download = true;
                    var url = utils.url_path_join(
                        Jupyter.notebook.base_url,
                        'nbconvert',
                        format,
                        utils.encode_uri_components(Jupyter.notebook.notebook_path)
                    ) + "?download=" + download.toString()
                    var w = window.open('', IPython._target);
                    if (Jupyter.notebook.dirty && Jupyter.notebook.writable) {
                        Jupyter.notebook.save_notebook().then(function() {
                            w.location = url;
                        });
                    } else {
                        w.location = url;
                    }
                }
                else if(act == 'delete-dom') {
                    op_dom.ele_delete_after();
                }
                else{
                    if(actions.test_mode) console.log("Unrecognized command!");
                }
                // window.parent.postMessage("data from iframe extension", '*');
            }, false);
        });
    },

    post_notebooksaved: function() {
        var data = {'actions': 'notebook-saved', 'msg': ""};
        window.parent.postMessage(data, '*');
    },

    post_modalshown: function() {
        var data = {'actions': 'modal-shown', 'msg': ""};
        window.parent.postMessage(data, '*');
    },

    post_modalhide: function() {
        var data = {'actions': 'modal-hide', 'msg': ""};
        window.parent.postMessage(data, '*');
    },

    init: function() {
        requirejs(['base/js/events'], function (events) {
            events.one('kernel_idle.Kernel', actions.add_listeners);
            // First build notebook-saved events
            events.on('notebook_saved.Notebook', actions.post_notebooksaved);
        });
    },
}


// functions for get Table of Content in ipynb
navbar = {
    /************
     * Settings *
     ************/
    list_tag: 'ul',
    
    /*************
     * Functions *
     *************/

    get_html: function() {
        var open_tag = '<' + navbar.list_tag + '>';
        var close_tag = '</' + navbar.list_tag + '>';
        var all_txt = '';
        var prev_level = 0;
        var hs = $('.text_cell_render').find('h1,h2,h3');
        for (i = 0; i < hs.length; i ++) {
            x = hs[i];
            level = parseInt(x.tagName.substr(1));
            txt = "<li class='step'><a href='javascript:void(0)' class='list-group-item'>" + x.innerText.replace(/¶$/, '') + "</a></li>";
            diff = level - prev_level;
            for (j = 0;j < diff; j ++) {
                txt = open_tag + txt;
            }
            for (j = diff; j < 0; j ++) {
                txt = close_tag + txt;
            }
            prev_level = level;
            all_txt += txt;
        }
        if(hs.length > 0) all_txt += close_tag;
        return all_txt;
    },

    rebuild: function() {
        var data = {'actions': 'notebook-toc', 'msg': navbar.get_html()};
        window.parent.postMessage(data, '*');
        data = {'actions': 'notebook-toc-evt', 'msg': ""};
        window.parent.postMessage(data, '*');
    },

    first_build: function() {
        navbar.rebuild();
    
        requirejs(['base/js/events'], function (events) {
            events.on('rendered.MarkdownCell delete.Cell', navbar.rebuild);
        });
    },
  
    init: function() {
        requirejs(['base/js/events'], function (events) {
            events.one('kernel_idle.Kernel', navbar.first_build);
        });
    },
}

op_dom.init();

actions.init();

navbar.init();

/////////////////////////////////////////////////////////////
/**
    Define functions (override official version)
**/
/////////////////////////////////////////////////////////////
// Modal actions Broadcast
define(['base/js/dialog'], function(dialog){
    var new_modal = function (options) {

        var modal = $("<div/>")
            .addClass("modal")
            .addClass("fade")
            .attr("role", "dialog");
        var dialog = $("<div/>")
            .addClass("modal-dialog")
            .appendTo(modal);
        var dialog_content = $("<div/>")
            .addClass("modal-content")
            .appendTo(dialog);
        if(typeof(options.body) === 'string' && options.sanitize !== false){
            options.body = $("<p/>").text(options.body);
        }
        dialog_content.append(
            $("<div/>")
                .addClass("modal-header")
                .mousedown(function() {
                  $(".modal").draggable({handle: '.modal-header'});
                })
                .append($("<button>")
                    .attr("type", "button")
                    .addClass("close")
                    .attr("data-dismiss", "modal")
                    .attr("aria-hidden", "true")
                    .html("&times;")
                ).append(
                    $("<h4/>")
                        .addClass('modal-title')
                        .text(options.title || "")
                )
        ).append(
            $("<div/>")
                .addClass("modal-body")
                .append(
                    options.body || $("<p/>")
                )
        );
        
        var footer = $("<div/>").addClass("modal-footer");
        
        var default_button;
        
        for (var label in options.buttons) {
            var btn_opts = options.buttons[label];
            var button = $("<button/>")
                .addClass("btn btn-default btn-sm")
                .attr("data-dismiss", "modal")
                .text(i18n.msg.translate(label).fetch());
            if (btn_opts.id) {
                button.attr('id', btn_opts.id);
            }
            if (btn_opts.click) {
                button.click($.proxy(btn_opts.click, dialog_content));
            }
            if (btn_opts.class) {
                button.addClass(btn_opts.class);
            }
            footer.append(button);
            if (options.default_button && label === options.default_button) {
                default_button = button;
            }
        }
        if (!options.default_button) {
            default_button = footer.find("button").last();
        }
        dialog_content.append(footer);
        // hook up on-open event
        modal.on("shown.bs.modal", function () {
            actions.post_modalshown();
            setTimeout(function () {
                default_button.focus();
                if (options.open) {
                    $.proxy(options.open, modal)();
                }
            }, 0);
        });
        
        // destroy modal on hide, unless explicitly asked not to
        if (options.destroy === undefined || options.destroy) {
            modal.on("hidden.bs.modal", function () {
                modal.remove();
            });
        }
        modal.on("hidden.bs.modal", function () {
            actions.post_modalhide();
            if (options.notebook) {
                var cell = options.notebook.get_selected_cell();
                if (cell) cell.select();
            }
            if (options.keyboard_manager) {
                options.keyboard_manager.enable();
                options.keyboard_manager.command_mode();
            }
        });
        
        if (options.keyboard_manager) {
            options.keyboard_manager.disable();
        }
        
        if(options.backdrop === undefined){
          options.backdrop = 'static';
        }
        
        return modal.modal(options);
    };

    dialog.modal = new_modal;

});

define(['base/js/namespace'], function(Jupyter){
    Jupyter._target = '_self';
});