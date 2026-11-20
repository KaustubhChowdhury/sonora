// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    std::panic::set_hook(Box::new(|info| {
        let msg = format!("PANIC: {:?}\nBacktrace: {:?}", info, std::backtrace::Backtrace::capture());
        let _ = std::fs::write("panic.log", msg.as_bytes());
        if let Some(mut dir) = dirs::data_local_dir() {
            dir.push("com.sonora.player");
            let _ = std::fs::create_dir_all(&dir);
            dir.push("panic.log");
            let _ = std::fs::write(dir, msg.as_bytes());
        }
    }));

    sonora_lib::run();
}
