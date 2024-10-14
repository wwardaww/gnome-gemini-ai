use std::cell::RefCell;
use std::collections::HashMap;
use std::env;
use std::fs::{read_to_string, File};
use std::io::{self, Read, Write};
use std::rc::Rc;
use std::str::FromStr;
use sysinfo::{Pid, System};

use tao::{
    dpi::{LogicalSize, Size},
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    platform::unix::WindowExtUnix,
    window::WindowBuilder,
};
use wry::WebViewBuilder;

fn main() -> wry::Result<()> {
    let args: Vec<String> = env::args().collect();
    let mut dir: &str = "";
    let mut s_path: String = "lstr.strg".to_owned();
    if args.len() >= 4 {
        dir = args[4].as_str();
        s_path = format!("{}/gui/lstr.strg", dir);
    }
    let translation: String = get_translations(dir.to_string());
    let s = System::new_all();
    let self_pid = std::process::id();
    let parent_pid = std::os::unix::process::parent_id();
    let mut suicide = false;
    for process in s.processes_by_exact_name("geminigui") {
        if process.parent() == Some(Pid::from_u32(self_pid))
            || process.parent() == Some(Pid::from_u32(parent_pid))
        {
            continue;
        } else {
            process.kill();
            suicide = true;
        };
    }
    if suicide {
        std::process::exit(1)
    };
    let event_loop = EventLoop::new();
    let html: &str = include_str!("ui.html");

    let mut theme: &str = "default";
    if args.len() >= 2 {
        theme = args[1].as_str();
    }
    let storage_data = get_storage(&s_path);
    let mut storage_string: String = "undefined".to_owned();
    if storage_data != None {
        storage_string = storage_data.unwrap();
    }
    #[allow(unused_mut)]
    let mut builder = WindowBuilder::new()
        .with_decorations(false)
        .with_transparent(true)
        .with_resizable(true)
        .with_title("Gemini Ai")
        .with_inner_size(Size::Logical(LogicalSize {
            width: 500.0,
            height: 250.0,
        }));

    let window = Rc::new(RefCell::new(builder.build(&event_loop).unwrap()));
    let mut mouse_pos = window.borrow().cursor_position().unwrap();
    mouse_pos.x += 100.0;
    if args.len() >= 3 {
        mouse_pos.x = f64::from_str(args[2].as_str()).unwrap() - 330.0;
        mouse_pos.y = f64::from_str(args[3].as_str()).unwrap();
    }
    window.borrow().set_outer_position(mouse_pos);
    let mut sys_v: String = "{".to_owned();
    for _i in 0..args.len() {
        if args[_i].contains("=") {
            let parts = args[_i].split("=").collect::<Vec<&str>>();
            sys_v.push_str(format!("{}: \"{}\",", parts[0], parts[1]).as_str());
        }
    }
    sys_v.push_str("}");
    let l_window = window.borrow();
    let vbox = l_window.default_vbox().unwrap();
    let builder = {
        use wry::WebViewBuilderExtUnix;

        WebViewBuilder::new_gtk(vbox)
    };
    let _webview = builder
        .with_transparent(true)
        .with_ipc_handler({
            let win = Rc::clone(&window);
            move |req| {
                let message = req.body();
                let parts = message.split("=").collect::<Vec<&str>>();
                let cmd = parts[0];
                let ipc_args = parts[1];
                match cmd {
                    "resize" => {
                        let size = ipc_args.split(",").collect::<Vec<&str>>();
                        let w_size = win.borrow().inner_size();
                        let n_size = LogicalSize::new(
                            if size[0] == "0" {
                                w_size.width
                            } else {
                                f64::from_str(size[0]).unwrap() as u32
                            },
                            if size[1] == "0" {
                                w_size.height
                            } else {
                                f64::from_str(size[1]).unwrap() as u32
                            },
                        );

                        win.borrow().set_inner_size(n_size);
                    }
                    "store" => {
                        let byte_string = ipc_args.split(",").collect::<Vec<&str>>();
                        let mut byte_array: Vec<u8> = vec![];
                        byte_string.iter().for_each(|x| {
                            byte_array.push(x.parse::<u8>().unwrap());
                        });

                        save_storage(byte_array, &s_path);
                    }
                    "popout" => {
                        win.borrow().set_decorations(true);
                    }
                    _ => {}
                }
            }
        })
        .with_html(
            html.replace("class='default'", format!("class='{}'", theme).as_str())
                .replace(
                    "let translator;",
                    format!("const translator={{{}}};", translation.as_str()).as_str(),
                )
                .replace(
                    "var sysVars;",
                    format!("var sysVars={};", sys_v.as_str()).as_str(),
                )
                .replace(
                    "var storage;",
                    format!("var storage={};", storage_string).as_str(),
                ),
        )
        .build()?;
    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        if let Event::WindowEvent {
            event: WindowEvent::CloseRequested,
            ..
        } = event
        {
            *control_flow = ControlFlow::Exit
        }
    });
}
fn get_translations(dir: String) -> String {
    let mut path: String = dir;
    if path == "" {
        path = env::current_dir().unwrap().to_str().unwrap().to_string();
    }
    let locale = env::var("LANG").unwrap();
    let lang_code = locale.split('_').next().unwrap();

    let mut back_path = ".";
    if path.contains("target") {
        back_path = "../../..";
    }
    let formatted_path = format!(
        "{}/{}/locales/{}/LC_MESSAGES/{}.mo",
        path, back_path, lang_code, lang_code
    );
    let mo_file_path = formatted_path.as_str();
    let mut t_string = String::new();
    let translations = parse_mo_file(mo_file_path);
    match translations {
        Ok(t) => {
            for (msgid, msgstr) in &t {
                if msgid == "" {
                    continue;
                }
                let t_msgid: String = msgid.replace("\n", "<br>");
                let t_msgstr: String = msgstr.replace("\n", "<br>");
                t_string += &format!("\"{}\": \"{}\",\n", t_msgid, t_msgstr);
            }
        }
        Err(_) => {
            t_string = "".to_string();
        }
    }
    return t_string;
}
fn parse_mo_file(path: &str) -> Result<HashMap<String, String>, Box<dyn std::error::Error>> {
    let mut file = File::open(path)?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)?;

    let mut translations = HashMap::new();

    // Magic number check
    let magic = u32::from_le_bytes([buffer[0], buffer[1], buffer[2], buffer[3]]);
    if magic != 0x950412de && magic != 0xde120495 {
        return Err(Box::new(io::Error::new(
            io::ErrorKind::InvalidData,
            "Invalid MO file",
        )));
    }

    // Header fields
    let num_strings = u32::from_le_bytes([buffer[8], buffer[9], buffer[10], buffer[11]]) as usize;
    let original_table_offset =
        u32::from_le_bytes([buffer[12], buffer[13], buffer[14], buffer[15]]) as usize;
    let translation_table_offset =
        u32::from_le_bytes([buffer[16], buffer[17], buffer[18], buffer[19]]) as usize;

    for i in 0..num_strings {
        let orig_offset = original_table_offset + i * 8;
        let trans_offset = translation_table_offset + i * 8;

        let orig_str_len = u32::from_le_bytes([
            buffer[orig_offset],
            buffer[orig_offset + 1],
            buffer[orig_offset + 2],
            buffer[orig_offset + 3],
        ]) as usize;
        let orig_str_pos = u32::from_le_bytes([
            buffer[orig_offset + 4],
            buffer[orig_offset + 5],
            buffer[orig_offset + 6],
            buffer[orig_offset + 7],
        ]) as usize;

        let trans_str_len = u32::from_le_bytes([
            buffer[trans_offset],
            buffer[trans_offset + 1],
            buffer[trans_offset + 2],
            buffer[trans_offset + 3],
        ]) as usize;
        let trans_str_pos = u32::from_le_bytes([
            buffer[trans_offset + 4],
            buffer[trans_offset + 5],
            buffer[trans_offset + 6],
            buffer[trans_offset + 7],
        ]) as usize;

        let orig_str =
            String::from_utf8_lossy(&buffer[orig_str_pos..orig_str_pos + orig_str_len]).to_string();
        let trans_str =
            String::from_utf8_lossy(&buffer[trans_str_pos..trans_str_pos + trans_str_len])
                .to_string();

        translations.insert(orig_str, trans_str);
    }

    Ok(translations)
}
fn save_storage(data: Vec<u8>, path: &String) {
    let mut file = File::create(path).unwrap();
    let content = String::from_utf8(data).unwrap();
    _ = file.write_all(content.as_bytes());
}
fn get_storage(path: &String)-> Option<String>{
   match read_to_string(path) {
    Ok(content) => Some(content),
    Err(_) => None,
   }
}