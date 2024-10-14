# Advanced UI for Gemini AI Extension

## Why Do We Need an Advanced UI? Why Not Develop with GnomeJS?

* Initially, I started development using GnomeJS, but it turned out to be quite restrictive. For example, I couldn't highlight code, or display embedded images or links effectively.
* Implementing features like #11 and #4 would be difficult.
* Gnome versions 42, 43, 44, 45, and 46 differ significantly from each other. Even the HTTP session (soup library) changes between versions 42 to 43 and 43 to 44. It would be challenging to maintain compatibility across different Gnome versions and distributions.

### Why Rust?

Rust's compiler is more beginner-friendly compared to C, and since low-level programming is new to me, Rust seemed like a better choice.

## Contribution
