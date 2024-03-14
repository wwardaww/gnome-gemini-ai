import GLib from 'gi://GLib';


export function generateAPIKey(){
    let keyStream = GLib.spawn_command_line_sync("gcloud auth application-default print-access-token").toString();
    const keyArray = keyStream.split(",");
    return keyArray[1].replace(/(\r\n|\n|\r)/gm, "");
}
