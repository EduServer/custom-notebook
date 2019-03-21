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
window.addEventListener('message', function(event){
    // Will print message continuously ???
    if(event.origin !== 'http://192.168.3.80:8000') return;
    
    var act = event.data.actions;
    var msg = event.data.msg;
    // For test
    console.log("the iframe get: " + act + " " + msg);
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
            if (icell.cell_type == 'markdown' && icell.get_text().includes(msg)){
                Jupyter.notebook.scroll_to_cell(i);
                break;
            }
        }
    }
    else if(act.substring(0, 6) == 'export') {
        var format = act.substring(7)
        // false for preview
        var download = true;
        var url = Jupyter.utils.url_path_join(
            Jupyter.notebook.base_url,
            'nbconvert',
            format,
            Jupyter.utils.encode_uri_components(Jupyter.notebook.notebook_path)
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
    else{
        console.log("Unrecognized command!");
    }
    // window.parent.postMessage("data from iframe extension", '*');
}, false);

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
        var hs = $('.text_cell_render').find('h1,h2,h3,h4,h5');
        for (i = 0; i < hs.length; i ++) {
            x = hs[i];
            level = parseInt(x.tagName.substr(1));
            txt = "<li><a href='javascript:void(0);'>" + x.innerText.replace(/¶$/, '') + "</a></li>";
            diff = level - prev_level;
            for (j = 0;j < diff; j ++) {
                txt = open_tag + txt;
            }
            for (j = diff; j < 0; j ++) {
                txt = close_tag + txt;
            }
            prev_level = level
            all_txt += txt
        }
        all_txt += close_tag
        return all_txt;
    },

    rebuild: function() {
        var data = {'actions': 'notebook-heading', 'msg': navbar.get_html()};
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

navbar.init();

define(['base/js/namespace'], function(Jupyter){
    Jupyter._target = '_self';
});