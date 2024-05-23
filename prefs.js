const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const Gettext = imports.gettext;
const _ = ExtensionUtils.gettext;
const SCHEMA_NAME = 'org.gnome.shell.extensions.geminiaiubuntu';
const MODELS = ['gemini-1.0-pro', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest'];

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
        this._settings = ExtensionUtils.getSettings(SCHEMA_NAME);
        const defaultKey =  this._settings.get_string("gemini-api-key");
        const defaultModel = this._settings.get_string("gemini-version");
        const defaultFolder =  this._settings.get_string("drive-folder");
        const defaultLog =  this._settings.get_boolean("log-history")
        const defaultVertex =  this._settings.get_boolean("vertex-enabled")
        const defaultVertexProject =  this._settings.get_string("vertex-project-id")

        const label = new Gtk.Label({
            label: _("Geminiai API Key"),
            halign: Gtk.Align.START
        });
        const apiKey = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer()
        });
        const howToButton = new Gtk.LinkButton({
            label: _("How to get API key?"),
            uri: 'https://github.com/wwardaww/gnome-gemini-ai?tab=readme-ov-file#using-gemini-api-key'
        });

        const labelFolder = new Gtk.Label({
            label: _("Drive Folder for Vertex \n (optional)"),
            halign: Gtk.Align.START
        });
        const folderUrl = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer()
        });

        const histroyLabel = new Gtk.Label({
            label: _("Remember talk history"),
            halign: Gtk.Align.START
        });
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
            halign: Gtk.Align.CENTER
        });

        const modelLabel = new Gtk.Label({
            label: _("Select Gemini Model"),
            halign: Gtk.Align.START
        });

        let model = new Gtk.ListStore();
        model.set_column_types([GObject.TYPE_STRING]);
        const modelVersion = new Gtk.ComboBox({model: model});

        let rendererText = new Gtk.CellRendererText();
        modelVersion.pack_start(rendererText, true);
        modelVersion.add_attribute(rendererText, 'text', 0);

        for(let i = 0; i < MODELS.length; i++) {
            model.set(model.append(), [0], [MODELS[i]]);
        }
        

        histroyButton.set_active(defaultLog);
        VertexButton.set_active(defaultVertex);
        modelVersion.set_active(MODELS.findIndex((i) => i == defaultModel));
        apiKey.set_text(defaultKey);
        VertexProject.set_text(defaultVertexProject);
        folderUrl.set_text(defaultFolder);


        let selectedModel
        modelVersion.connect('changed', function(entry) {
            let [success, iter] = modelVersion.get_active_iter();
            if (!success)
                return;
            selectedModel = model.get_value(iter, 0); 
        });

        save.connect('clicked', () => {
            this._settings.set_string("gemini-api-key", apiKey.get_buffer().get_text());
            this._settings.set_string("gemini-version", selectedModel);
            this._settings.set_string("drive-folder", folderUrl.get_buffer().get_text());
            this._settings.set_string("vertex-project-id", VertexProject.get_buffer().get_text());
            this._settings.set_boolean("log-history", histroyButton.state);
            this._settings.set_boolean("vertex-enabled", VertexButton.state);
            statusLabel.set_markup(_("Your preferences have been saved"));
        });

        // col, row, 1, 1
        this.main.attach(label, 0, 0, 1, 1);
        this.main.attach(apiKey, 2, 0, 2, 1);
        this.main.attach(howToButton, 4, 0, 1, 1);

        this.main.attach(modelLabel, 0, 1, 1, 1);
        this.main.attach(modelVersion, 2, 1, 2, 1);

        this.main.attach(labelFolder, 0, 2, 1, 1);
        this.main.attach(folderUrl, 2, 2, 2, 1);

        this.main.attach(histroyLabel, 0, 3, 1, 1);
        this.main.attach(histroyButton, 2, 3, 1, 1);

        this.main.attach(vertexLabel, 0, 4, 1, 1);
        this.main.attach(VertexButton, 2, 4, 1, 1);

        this.main.attach(vertexProjectLabel, 0, 5, 1, 1);
        this.main.attach(VertexProject, 2, 5, 2, 1);

        this.main.attach(save, 2, 6, 1, 1);
        this.main.attach(statusLabel, 0, 7, 4, 1);

    } 
});