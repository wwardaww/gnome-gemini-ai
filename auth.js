const { GLib } = imports.gi;

 function generateAPIKey() {
    let key = GLib.spawn_command_line_sync("gcloud auth application-default print-access-token")[1];
    return key.toString().replace(/(\r\n|\n|\r)/gm, "");
}