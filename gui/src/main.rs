use std::env;
use sysinfo::{Pid, System};
use std::collections::HashMap;
use std::fs::File;
use std::io::{self, Read};
use tao::{
    dpi::{LogicalSize, Size},
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::WindowBuilder,
};
use wry::WebViewBuilder;



fn main() -> wry::Result<()> {
    let translation: String = get_translations();
    let s = System::new_all();
    let self_pid = std::process::id();
    let parent_pid = std::os::unix::process::parent_id();
    let mut suicide = false;
    for process in s.processes_by_exact_name("geminigui") {
        if process.parent() == Some(Pid::from_u32(self_pid)) || process.parent() == Some(Pid::from_u32(parent_pid)) { continue; }
        else { process.kill(); suicide = true; };
       
    }
    if suicide {std::process::exit(1)};
    let event_loop = EventLoop::new();
    let html: &str = include_str!("ui.html");
    let args: Vec<String> = env::args().collect();
    let mut theme: &str = "default";
    if args.len() >= 2 {
        theme = args[1].as_str();
    }

    #[allow(unused_mut)]
    let mut builder = WindowBuilder::new()
        .with_decorations(false)
        .with_transparent(true)
        .with_inner_size(Size::Logical(LogicalSize {
            width: 400.0,
            height: 200.0,
        }));

    let window = builder.build(&event_loop).unwrap();
    let mut mouse_pos = window.cursor_position().unwrap();
    mouse_pos.x += 100.0;
    window.set_outer_position(mouse_pos);

    let builder = {
        use tao::platform::unix::WindowExtUnix;
        use wry::WebViewBuilderExtUnix;
        let vbox = window.default_vbox().unwrap();
        WebViewBuilder::new_gtk(vbox)
    };
    let _webview = builder
        .with_transparent(true)
        .with_html(html.replace("class='default'", format!("class='{}'", theme).as_str()).replace("TEXTTRANSLATION", translation.as_str()))
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
fn get_translations()-> String {
    let current_dir = env::current_dir().unwrap();
    let locale = env::var("LANG").unwrap();
    let lang_code = locale.split('_').next().unwrap();
   
    let formatted_path = format!("{}/../locales/{}/LC_MESSAGES/{}.mo", current_dir.to_str().unwrap(), lang_code, lang_code);
    println!("{:?}", formatted_path);
    let mo_file_path = formatted_path.as_str();
    let mut t_string = String::new();
    
    let translations = parse_mo_file(mo_file_path);
    match translations {
        Ok(t) => {
            for (msgid, msgstr) in &t {
                t_string += &format!("\"{}\": `{}`,\n", msgid, msgstr);
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
        return Err(Box::new(io::Error::new(io::ErrorKind::InvalidData, "Invalid MO file")));
    }

    // Header fields
    let num_strings = u32::from_le_bytes([buffer[8], buffer[9], buffer[10], buffer[11]]) as usize;
    let original_table_offset = u32::from_le_bytes([buffer[12], buffer[13], buffer[14], buffer[15]]) as usize;
    let translation_table_offset = u32::from_le_bytes([buffer[16], buffer[17], buffer[18], buffer[19]]) as usize;

    for i in 0..num_strings {
        let orig_offset = original_table_offset + i * 8;
        let trans_offset = translation_table_offset + i * 8;

        let orig_str_len = u32::from_le_bytes([buffer[orig_offset], buffer[orig_offset + 1], buffer[orig_offset + 2], buffer[orig_offset + 3]]) as usize;
        let orig_str_pos = u32::from_le_bytes([buffer[orig_offset + 4], buffer[orig_offset + 5], buffer[orig_offset + 6], buffer[orig_offset + 7]]) as usize;

        let trans_str_len = u32::from_le_bytes([buffer[trans_offset], buffer[trans_offset + 1], buffer[trans_offset + 2], buffer[trans_offset + 3]]) as usize;
        let trans_str_pos = u32::from_le_bytes([buffer[trans_offset + 4], buffer[trans_offset + 5], buffer[trans_offset + 6], buffer[trans_offset + 7]]) as usize;

        let orig_str = String::from_utf8_lossy(&buffer[orig_str_pos..orig_str_pos + orig_str_len]).to_string();
        let trans_str = String::from_utf8_lossy(&buffer[trans_str_pos..trans_str_pos + trans_str_len]).to_string();

        translations.insert(orig_str, trans_str);
    }

    Ok(translations)
}