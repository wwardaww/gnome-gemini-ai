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
            row_spacing: 10,
            column_spacing: 14,
            column_homogeneous: false,
            row_homogeneous: false
        });
        const defaultKey = SettingsSchema.get_string("gemini-api-key");
        const defaultLog = SettingsSchema.get_boolean("log-history")
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

        const histroyLabel = new Gtk.Label({
            label: "Remember talk history",
            halign: Gtk.Align.START
        });;
        const histroyButton = new Gtk.Switch();
        histroyButton.set_active(defaultLog);
        apiKey.set_text(defaultKey);
        save.connect('clicked', () => {
            SettingsSchema.set_string("gemini-api-key", apiKey.get_buffer().get_text());
            SettingsSchema.set_boolean("log-history", histroyButton.state);
        });


        this.main.attach(label, 0, 0, 1, 1);
        // col, row
        this.main.attach(apiKey, 3, 0, 1, 1);
        this.main.attach(histroyLabel, 0, 1, 1, 1);
        this.main.attach(histroyButton, 2, 1, 1, 1);
        this.main.attach(save, 2, 3, 1, 1);
    }
});