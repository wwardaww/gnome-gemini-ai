# Advanced UI for Gemini AI Extension

## Installing the New UI

1. **Download** the updated UI using this [link](https://github.com/wwardaww/gnome-gemini-ai/releases/latest).
2. **Copy** the downloaded files to the following directory:  
   `~/.local/share/gnome-shell/extensions/geminiaiubuntu@arda.com/gui`  
   *(Create a folder named `gui` if it does not already exist.)*
3. **Enable** the *Advanced UI* in the settings.
  ![image](https://github.com/user-attachments/assets/255f0955-ecc0-43e1-928b-bfa369ef872d)


4. **Re-enter** your API key and configure your settings.

You're all set!

## Why Do We Need an Advanced UI? Why Not Develop with GnomeJS?

* Initially, I began development using GnomeJS, but it proved to be quite restrictive. For instance, I couldn't highlight code or effectively display embedded images or links.
* Implementing features like [#11](https://github.com/wwardaww/gnome-gemini-ai/issues/11) and [#4](https://github.com/wwardaww/gnome-gemini-ai/issues/4) would be difficult.
* Gnome versions 42, 43, 44, 45, and 46 differ significantly from one another. Even the HTTP session (soup library) changes between versions 42 to 43 and 43 to 44. Maintaining compatibility across various Gnome versions and distributions would be challenging.

### Why Rust?

Rust's compiler is more beginner-friendly compared to C, and since low-level programming is new to me, Rust seemed like the better choice.

## Contribution

There are three main components of this system:

### Extension Part

This part prepares to trigger the Advanced UI in `extension.js:49` and initializes the translation in `extension.js:56`.

**Preparing the engine**:

* Detecting if the theme is dark or not.
* Determining mouse position to initialize the window on the screen.
* Setting the extension path for local storage (we can't access this from Rust because when the engine is running, it retrieves the home path).
* Defining variables for the UI (e.g., fetching the username).

### Engine Part

Here, we create the window, manage local storage through `lstr.strg`, prepare translation files, handle the WebView, and manage toggle functionality.

We call the engine using the following command:

```bash
~/.local/share/gnome-shell/extensions/geminiaiubuntu@arda.com/gui/target/debug/geminigui ${theme} ${mouse_x} ${mouse_y} ${Me.path} userName=${USERNAME}
```

If you want to use DevTools on the WebView, comment out the `.with_devtools(false)` line.

**NOTE:** All arguments are passed with '=' and accessed in HTML through `sysVars.` For more details, see the HTML part.

We can also communicate with the HTML part via the IPC protocol.

Example:

In **ui.html**, for communication with the engine: `window.ipc?.postMessage('resize=${w},${h}')`

In **main.rs**, handling the IPC:

```rust
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
        let e_text = encrypt(iv, key, &byte_array);
        save_storage(e_text, &s_path);
    }
    "popout" => {
        win.borrow().set_decorations(true);
    }
    _ => {}
}
```

#### Dependencies:

* sysinfo
* tao
* wry
* hex
* openssl

**Note:** `openssl` and `hex` are used only for encryption in storage.

### HTML Part

This part consists mainly of HTML, CSS, and JavaScript.

**Dependencies (CDN Libraries)**:

* [Markdown-it](https://github.com/markdown-it/markdown-it)
* [Highlight.js](https://highlightjs.org/)

**Key Points**:

* **Translation**: The engine provides translations through the `translator` variable, and the `translate` function returns the translated text, similar to `ExtensionUtils.gettext`.
* **Communication with the Engine**: When sending data to the engine, we initialize our functions. For example, when resizing the window, we call `window.resizeTo(w, h)`, which triggers `window.ipc?.postMessage('resize=${w},${h}')`.
* **System Variables**: The engine passes terminal arguments and storage data to the HTML as shown below:

  The `userName` variable is passed through the terminal or the extension itself.

  ```js
    var sysVars = { userName: "arda" };
    var storage = {
      "chatHistory": [
        {
          "role": "user",
          "parts": [{"text": "hi sup"}]
        },
        {
          "role": "model",
          "parts": [{"text": "Hey! Not much, just hanging out and ready to answer your questions. What's up with you?
  "}]
        }
      ],
      "settings": {
        "apiKey": "somekey",
        "model": "gemini-1.5-flash-002",
        "theme": "dark"
      }
    };
  ```
