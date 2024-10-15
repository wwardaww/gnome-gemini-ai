const { GObject, Gtk, GLib} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = imports.misc.extensionUtils.getCurrentExtension();


// Disable translation for older version
if(typeof _ !== 'function'){
    _ = (str) => str;
}

function init() {
    ExtensionUtils.initTranslations("geminiaiubuntu");
}
function buildPrefsWidget() {
    const geminiAi = new GeminiaiSettings();
    return geminiAi.main;
}

const GeminiaiSettings = new GObject.Class({
    Name: 'Geminiai.Prefs.Widget',
    _init: function() {
        const theme = 'dark';
        const userName  =GLib.get_real_name();
        GLib.spawn_command_line_async(Extension.path +`/gui/target/debug/geminigui ${theme} ${0} ${0} ${Extension.path} userName=${userName} settings=true`);
        this.main = new Gtk.Grid();
    } 
});