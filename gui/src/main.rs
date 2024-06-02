use std::env;
use sysinfo::{Pid, System};
use tao::{
    dpi::{LogicalSize, Size},
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::WindowBuilder,
};
use wry::WebViewBuilder;
fn main() -> wry::Result<()> {
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
        .with_html(html.replace("class='default'", format!("class='{}'", theme).as_str()))
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
