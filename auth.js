const { GLib } = imports.gi;

 async function generateAPIKey()  {
    let key = await GLib.spawn_command_line_async("gcloud auth application-default print-access-token")[1];
    return new Promise((resolve, reject) => {
        resolve(key.toString().replace(/(\r\n|\n|\r)/gm, ""));
        reject("please check gcloud installation");
    })
    
}