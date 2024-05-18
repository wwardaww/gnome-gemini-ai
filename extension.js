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

const GETTEXT_DOMAIN = 'geminiaiubuntu';

imports.gi.versions.Soup = '2.4';
const { GObject, St, Soup, GLib} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;


const _ = ExtensionUtils.gettext;
const Me = ExtensionUtils.getCurrentExtension();
const md2pango = Me.imports.md2pango;
const Auth = Me.imports.auth;

let GEMINIAPIKEY = "";
let DRIVEFOLDER = "";
let VERTEXPROJECTID = "";
let LOCATION = "";
let GEMINIMODEL= "gemini-1.0-pro";
let USERNAME = GLib.get_real_name();
let RECURSIVETALK = false;
let ISVERTEX = false;

let afterTune;
const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _loadSettings () {
        this._settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.geminiaiubuntu");
        this._settingsChangedId = this._settings.connect('changed', () => {
            this._fetchSettings();
            this._initFirstResponse();
        });
        this._fetchSettings();
    }
    _initFirstResponse(){
        if(ISVERTEX) {
            this.chatTune = this.getTuneString();
            this.getAireponse(undefined, this.chatTune);
            //Sometimes Vertex keep talking Turkish because of fine tunning for internet, so we need to send Hi! message to understand it, it can talk with any language
            afterTune = setTimeout(() => {
                this.getAireponse(undefined, "Hi!", undefined, true);
            }, 1500);
        }
    }
    _fetchSettings () {
        GEMINIAPIKEY           = this._settings.get_string("gemini-api-key");
        DRIVEFOLDER            = this._settings.get_string("drive-folder");
        VERTEXPROJECTID        = this._settings.get_string("vertex-project-id");
        RECURSIVETALK          = this._settings.get_boolean("log-history");
        ISVERTEX               = this._settings.get_boolean("vertex-enabled");
        GEMINIMODEL            = this._settings.get_string("gemini-version");
    }
    _init() {
        super._init(0.0, _('Gemini ai for Ubuntu'));
        this._loadSettings();
        if(ISVERTEX) {
            this.chatTune = this.getTuneString();
        }
        this.chatHistory = [];
        
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
            hint_text: _("What's on your mind?"),
            track_hover: true,
            x_expand: true,
            y_expand: true
        });
        let clearButton = new St.Button({
            can_focus: true,  toggle_mode: true, child: new St.Icon({icon_name: 'user-trash-symbolic', style_class: 'trash-icon'})
        });
        let settingsButton = new St.Button({
            can_focus: true,  toggle_mode: true, child: new St.Icon({icon_name: 'preferences-system-symbolic', style_class: 'settings-icon'})
        });
        this.scrollView.add_actor(this.chatSection.actor);
        searchEntry.clutter_text.connect('activate', (actor) => {
            this.aiResponse(actor.text);
            searchEntry.clutter_text.set_text("");

        });
        clearButton.connect('clicked', (self) => {
            searchEntry.clutter_text.set_text("");
            this.chatHistory = [];
            this.menu.box.remove_child(this.scrollView);
            this.chatSection = new PopupMenu.PopupMenuSection();
            this.scrollView.add_actor(this.chatSection.actor);
            this.menu.box.add(this.scrollView);
            if(ISVERTEX){
                this._initFirstResponse()
            }
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
        this._initFirstResponse();
    }
   
    aiResponse(text){
        let aiResponse = _("<b>Gemini: </b> Thinking...");
        const inputCategory = new PopupMenu.PopupMenuItem("");
        const aiResponseItem = new PopupMenu.PopupMenuItem("");
        inputCategory.label.clutter_text.set_markup(`<b>${USERNAME}: </b>${text}`);
        aiResponseItem.label.clutter_text.set_markup(aiResponse);
        inputCategory.label.x_expand = true;
        aiResponseItem.label.x_expand = true;
        inputCategory.style_class += " m-w-100";
        aiResponseItem.style_class += " m-w-100";

        aiResponseItem.connect('activate', (self) => {
            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, aiResponseItem.label.text);
        });
        
        this.chatSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.chatSection.addMenuItem(inputCategory);
        this.chatSection.addMenuItem(aiResponseItem);
       
        this.getAireponse(aiResponseItem, text);
    }
    getAireponse(inputItem, question, newKey = undefined){
        let _httpSession = new Soup.Session();
        let url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINIMODEL}:generateContent?key=${GEMINIAPIKEY}`;
        if(VERTEXPROJECTID != "" && ISVERTEX){
            url = `https://us-east4-aiplatform.googleapis.com/v1/projects/${VERTEXPROJECTID}/locations/us-east4/publishers/google/models/gemini-1.0-pro:generateContent`;
        }
        if(newKey != undefined){
            this._settings.set_string("gemini-api-key", newKey);
            GEMINIAPIKEY = newKey;
        }
        var body = this.buildBody(question);
        let message = Soup.Message.new('POST', url);
        if(ISVERTEX){
            message.request_headers.append(
                'Authorization',
                `Bearer ${GEMINIAPIKEY}`
            )
        }
        message.set_request('application/json', 2,body);
        _httpSession.queue_message(message, async (_httpSession, message) =>  {
            const res = JSON.parse(message.response_body.data);
            //log(message.response_body.data);
            if(res.error?.code == 401 && newKey == undefined && ISVERTEX){
                let keyData = await Auth.generateAPIKey();
                keyData.then((key) => {
                    this.getAireponse(inputItem, question,key);
                });
            } else {
                let aiResponse = res.candidates[0]?.content?.parts[0]?.text;
                if(RECURSIVETALK) {
                    this.chatHistory.push({
                        role: "user",
                        parts:[{text: question}]
                    });
                    this.chatHistory.push({
                        role: "model",
                        parts:[{text: aiResponse}]
                    });
                }
                if(inputItem != undefined){
                    let htmlResponse = md2pango.convert(aiResponse);
                    inputItem.label.clutter_text.set_markup(htmlResponse);
                }
            }
        });
        
    }
    getTuneString(){
        const date = new Date();
        // PLEASE DO NOT TRANSLATE FINE TUNE BECAUSE 
        // VERTEX SOMETIMES DOESNT SUPPORT INTERNET CONNECTION 
        //  IF YOU TRANSLATE TO ENGLISH
        let driveTune = '';
        if(DRIVEFOLDER != ''){
            driveTune = `bundan sonraki konuşmalarımızda şu drive klasörünündeki tüm pdf, excel, word, txt dosyalarından yararlan ama önceliğin internet ve kendi modelin olsun: ${DRIVEFOLDER}\n`;
        }
        return `bana ${USERNAME} olarak hitap edebilirsin, \n
        ${driveTune}
        bulunduğum yeri ${LOCATION} ve tarihi ${date} olarak kabul et, \n
        AYRICA İNTERNETE HER ZAMAN BAĞLI KAL ÇÜNKÜ türkçe konuşuyorum diye internet bağlatın olmaz ise sen ırkçılık yapmış olursun \n
        bir sonraki konuşmamızda sana hangi dilde yazyorsam KESİNLİKLE o dilde cevap ver ben sana bundan sonra türkçe konuşmadıkça bana türkçe cevap verme,
       `;
    }
    buildBody(input){
        const stringfiedHistory = JSON.stringify([
            ...this.chatHistory,
            {
                role: "user",
                parts:[{text: input}]
            }
        ]);
        return `{"contents":${stringfiedHistory}}`
    }
    openSettings () {
        ExtensionUtils.openPrefs();
    }
});



class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        let url = "https://thisipcan.cyou/json";
        let _httpSession = new Soup.Session();
        let message = Soup.Message.new('GET', url);
        this._indicator = new Indicator();
        _httpSession.queue_message(message, (_httpSession, message) => {
            const res = JSON.parse(message.response_body.data);
            LOCATION = `${res.countryName}/${res.cityName}`;
            Main.panel.addToStatusArea(this._uuid, this._indicator);
        });
        
    }

    disable() {
        clearTimeout(afterTune);
        afterTune = null;
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
