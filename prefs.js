const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const SCHEMA_NAME = 'org.gnome.shell.extensions.geminiaiubuntu';


var SettingsSchema = ExtensionUtils.getSettings(SCHEMA_NAME);
function init() {
}
function buildPrefsWidget() {
    const geminiAi = new GeminiaiSettings();
    return geminiAi.main;
}

const GeminiaiSettings = new GObject.Class({
    Name: 'Geminiai.Prefs.Widget',
    GTypeName: 'GeminiaiSettings',
    _init: function() {
        this.main = new Gtk.Grid({
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
            row_spacing: 12,
            column_spacing: 18,
            column_homogeneous: false,
            row_homogeneous: false
        });
        const defaultKey = SettingsSchema.get_string("gemini-api-key");
        const label = new Gtk.Label({
            label: "Geminiai API Key",
            halign: Gtk.Align.START
        });
        const apiKey = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer()
        });
        const save = new Gtk.Button({
            label: 'Save'
        });
        apiKey.set_text(defaultKey);
        save.connect('clicked', () => {
            log("key: " + apiKey.get_buffer().get_text());
            log("key Value: " + apiKey.value);
            SettingsSchema.set_string("gemini-api-key", apiKey.get_buffer().get_text());
        });
        this.main.attach(label, 0, 0, 1, 1);
        // row, col
        this.main.attach(apiKey, 1, 0, 2, 1);
        this.main.attach(save, 3, 0, 3, 1);
    }
});