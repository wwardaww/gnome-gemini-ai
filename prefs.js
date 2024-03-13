const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Lang = imports.lang;

const Gettext = imports.gettext;
const _ = Gettext.domain('geminiaiubuntu').gettext;
const SCHEMA_NAME = 'org.gnome.shell.extensions.geminiaiubuntu';


var SettingsSchema = ExtensionUtils.getSettings(SCHEMA_NAME);
function init() {
    let localeDir = Extension.dir.get_child('locale');
    if (localeDir.query_exists(null))
        Gettext.bindtextdomain('geminiaiubuntu', localeDir.get_path());
}
function buildPrefsWidget() {
    const geminiAi = new GeminiaiSettings();
    return geminiAi.main;
}

const GeminiaiSettings = new Lang.Class({
    Name: 'Geminiai.Prefs.Widget',
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
        const defaultFolder = SettingsSchema.get_string("drive-folder");
        const defaultLog = SettingsSchema.get_boolean("log-history")
        const defaultVertex = SettingsSchema.get_boolean("vertex-enabled")
        const defaultVertexProject = SettingsSchema.get_string("vertex-project-id")

        const label = new Gtk.Label({
            label: _("Geminiai API Key"),
            halign: Gtk.Align.START
        });
        const apiKey = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer()
        });

        const labelFolder = new Gtk.Label({
            label: _("Drive Folder"),
            halign: Gtk.Align.START
        });
        const folderUrl = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer()
        });

        const histroyLabel = new Gtk.Label({
            label: _("Remember talk history"),
            halign: Gtk.Align.START
        });;
        const histroyButton = new Gtk.Switch();

        const vertexLabel = new Gtk.Label({
            label: _("Enable Vertex API"),
            halign: Gtk.Align.START
        });
        const VertexButton = new Gtk.Switch();

        const vertexProjectLabel = new Gtk.Label({
            label: _("Vertex Project ID"),
            halign: Gtk.Align.START
        });
        const VertexProject = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer()
        });
        const save = new Gtk.Button({
            label: _('Save')
        });
        const statusLabel = new Gtk.Label({
            label: "",
            useMarkup: true,
            halign: Gtk.Align.START
        });

        histroyButton.set_active(defaultLog);
        VertexButton.set_active(defaultVertex);
        apiKey.set_text(defaultKey);
        VertexProject.set_text(defaultVertexProject);
        folderUrl.set_text(defaultFolder);
        save.connect('clicked', () => {
            SettingsSchema.set_string("gemini-api-key", apiKey.get_buffer().get_text());
            SettingsSchema.set_string("drive-folder", folderUrl.get_buffer().get_text());
            SettingsSchema.set_string("vertex-project-id", VertexProject.get_buffer().get_text());
            SettingsSchema.set_boolean("log-history", histroyButton.state);
            SettingsSchema.set_boolean("vertex-enabled", VertexButton.state);
            statusLabel.set_markup(_("Your preferences have been saved"));
        });

        // col, row, 1, 1
        this.main.attach(label, 0, 0, 1, 1);
        this.main.attach(apiKey, 3, 0, 1, 1);

        this.main.attach(labelFolder, 0, 1, 1, 1);
        this.main.attach(folderUrl, 3, 1, 1, 1);

        this.main.attach(histroyLabel, 0, 2, 1, 1);
        this.main.attach(histroyButton, 2, 2, 1, 1);

        this.main.attach(vertexLabel, 0, 3, 1, 1);
        this.main.attach(VertexButton, 2, 3, 1, 1);

        this.main.attach(vertexProjectLabel, 0, 4, 1, 1);
        this.main.attach(VertexProject, 3, 4, 1, 1);

        this.main.attach(save, 3, 5, 1, 1);
        this.main.attach(statusLabel, 0, 5, 1, 1);
    }
});