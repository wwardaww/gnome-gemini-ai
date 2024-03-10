/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const GETTEXT_DOMAIN = 'my-indicator-extension';

const { GObject, St, Soup, GLib} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;


const _ = ExtensionUtils.gettext;
const Me = ExtensionUtils.getCurrentExtension();
const md2pango = Me.imports.md2pango;
const Prefs = Me.imports.prefs;



let GEMINIAPIKEY = "";

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _loadSettings () {
        this._settings = Prefs.SettingsSchema;
        this._settingsChangedId = this._settings.connect('changed', () => {
            this._fetchSettings();
        });
        this._fetchSettings();
    }
    _fetchSettings () {
        GEMINIAPIKEY           = this._settings.get_string("gemini-api-key");
    }
    _init() {
        super._init(0.0, _('My Shiny Indicator'));
        this.username = GLib.get_real_name();
        this._loadSettings();
        this.add_child(new St.Icon({style_class: 'gemini-icon'}));
        this.menu.actor.style_class = "m-w-100"
      
        let item = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
        });
        this.chatSection = new PopupMenu.PopupMenuSection();
        this.scrollView = new St.ScrollView({
            style_class: 'chat-scroll-section'
        });
       
        let searchEntry = new St.Entry({
            name: 'aiEntry',
            style_class: 'ai-entry',
            can_focus: true,
            hint_text: _('Ne yapabilirim?'),
            track_hover: true,
            x_expand: true,
            y_expand: true
        });
        let clearButton = new St.Button({
            can_focus: true,  toggle_mode: true, child: new St.Icon({icon_name: 'app-remove-symbolic', style_class: 'clear-button'})
        });
        let settingsButton = new St.Button({
            can_focus: true,  toggle_mode: true, child: new St.Icon({icon_name: 'settings-symbolic', style_class: 'clear-button'})
        });
        this.scrollView.add_actor(this.chatSection.actor);
        searchEntry.clutter_text.connect('activate', (actor) => {
            log(`Activated: ${actor.text}`);
            this.aiResponse(actor.text);
            searchEntry.clutter_text.set_text("");

        });
        clearButton.connect('clicked', (self) => {
            searchEntry.clutter_text.set_text("");
            this.menu.box.remove_child(this.scrollView);
            this.chatSection = new PopupMenu.PopupMenuSection();
            this.scrollView.add_actor(this.chatSection.actor);
            this.menu.box.add(this.scrollView);
        });
        settingsButton.connect('clicked', (self) => {
            this.openSettings();
        });
        if(GEMINIAPIKEY == ""){
            this.openSettings();
        }
        item.add(searchEntry);
        item.add(clearButton);
        item.add(settingsButton);
        this.menu.addMenuItem(item);
        this.menu.box.add(this.scrollView);
    }
    aiResponse(text){
        let aiResponse = "<b>Gemini: </b> Düşünüyorum...";
        const inputCategory = new PopupMenu.PopupMenuItem("");
        const aiResponseItem = new PopupMenu.PopupMenuItem("");
        inputCategory.label.clutter_text.set_markup(`<b>${this.username}: </b>${text}`);
        aiResponseItem.label.clutter_text.set_markup(aiResponse);
        inputCategory.label.x_expand = true;
        aiResponseItem.label.x_expand = true;
        inputCategory.style_class += " m-w-100";
        aiResponseItem.style_class += " m-w-100";

        aiResponseItem.connect('activate', (self) => {
            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, aiResponseItem.label.text);
            log(`Copied: ${aiResponseItem.label.text}`);
        });
        
        this.chatSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.chatSection.addMenuItem(inputCategory);
        this.chatSection.addMenuItem(aiResponseItem);
       
        this.getAireponse(aiResponseItem, text);
    }
    getAireponse(inputItem, question){
        log(`API key: ${GEMINIAPIKEY}`);
        let _httpSession = new Soup.Session();
        let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINIAPIKEY}`;
        var body = `{"contents":[{"parts":[{"text":"${question}"}]}]}`

        let message = Soup.Message.new('POST', url);

        message.set_request('application/json', 2,body);
        _httpSession.queue_message(message, function (_httpSession, message){
            const res = JSON.parse(message.response_body.data);
            let aiResponse = res.candidates[0]?.content?.parts[0]?.text;
            let htmlResponse = md2pango.convert(aiResponse);

            inputItem.label.clutter_text.set_markup(htmlResponse);
        });
        
    }
    openSettings () {
        log("settingsde");
        if (typeof ExtensionUtils.openPrefs === 'function') {
            ExtensionUtils.openPrefs();
        } else {
            Util.spawn([
                "gnome-shell-extension-prefs",
                Me.uuid
            ]);
        }
    }
});



class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
