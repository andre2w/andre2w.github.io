---
layout: post
asset-type: post
title: "Notes on Rust: Crates, Modules and Cargo"
date: 2023-02-25 00:00:00 +00:00
author: André Guelfi Torres
tags:
    - rust
    - notes on rust
---

In the Rust world they use the word `crate` to identify a library that doesn’t have an entry point, and a binary to be something with a entry point. 

# Modules

Modules are the way that rust uses to organize and group code. You can declare modules using the `mod` keyword. The way the code is structured in the folder is also the way where you will have your crates path, but isn’t simple like creating the folder and the files then importing it, you need to create a file with the module declaration. 

You can also use modules as a way to group code and control what do you expose, you have the `pub` modifier that makes the method public, since the default is to make everything private from it’s parents. Let’s use the restaurant example from the rust book we would need to create the following.

We have a `main.rs`:

```rust
pub mod front_of_house;

fn main() {
    crate::front_of_house::hosting::add_to_waitlist();
    // Relative import is also allowed
    front_of_house::hosting::add_to_waitlist();
}
```

```rust
// src/front_of_house.rs
pub mod hosting;
```

```rust
// src/front_of_house/hosting.rs
pub fn add_to_waitlist() {
    println!("Add to waitlist")
}
```

The file structure would be:

```
restaurant
├── Cargo.lock
├── Cargo.toml
└── src
    ├── front_of_house
    │   └── hosting.rs
    ├── front_of_house.rs
    └── main.rs
```

- `main.rs` has the declaration for the `front_of_house` module,
- `front_of_house.rs` has the declaration for the `hosting` module.
- `hosting.rs` has the function `add_to_waitlist`.

Everything that has the `pub` keyword inside the `hosting.rs` file will be available to be used in the `main.rs`  through the `crate::front_of_house::hosting::add_to_wallet()`.

# The `use` keyword

Specifying the full path every time you are going to call a function might not be the most ergonomic thing, to avoid that there’s the `use` keyword that allows you to import things to the file. 

We import the `hosting` module to the `src/main.rs` file. 

```rust
pub mod front_of_house;

use front_of_house::hosting;

fn main() {
    hosting::add_to_waitlist();
}
```

## Conventions around `use`

Now rust has some conventions that were created with the time about how do you import things. In case of functions you should import the module and use the the module name and the function name in combination like we have in the example above. This way the reader knows that the function comes from another module. 

Now for struct, enums and other values you should import the entire path. So if we add an enum to our `hosting` module

```rust
// src/front_of_house/hosting.rs
#[derive(Debug)]
pub enum CustomerType {
    REGULAR,
    VIP,
}

pub fn add_to_waitlist(customer_type: CustomerType) {
    println!("Add to waitlist {:?} customer", customer_type);
}
```

We can use the entire thing without having to do `hosting::CustomerType`

```rust
// src/main.rs
pub mod front_of_house;

use front_of_house::hosting;
use front_of_house::hosting::CustomerType;

fn main() {
    hosting::add_to_waitlist(CustomerType::REGULAR);
}
```

The only exception for this rule is when you have two objects with the same name in a file, then you need to import the module to remove that ambiguity.

```rust
use std::fmt;
use std::io;

fn function1() -> fmt::Result {
    // --snip--
}

fn function2() -> io::Result<()> {
    // --snip--
}
```

Another alternative is using the `as` keyword that allow you to rename an import. 

```rust
use std::fmt::Result;
use std::io::Result as IoResult;

fn function1() -> Result {
    // --snip--
}

fn function2() -> IoResult<()> {
    // --snip--
}
```

### syntax sugar

Rust also has some unix like syntax sugar for importing so you don’t have to keep importing the same thing over and over. 

The first one is using curly braces to import multiple things from the same path. 

```rust
// This two imports
use std::cmp::Ordering;
use std::io;

// Can be turned into a single one
use std::{cmp::Ordering, io};
// You can use `self` to import std::io and a submodule
use std::io::{self, Write}
```

And there’s also a glob (`*`) operator in case you want to import everything that is public for that path. 

```rust
use std::collections::*;

fn main() {
    let hash_map = HashMap::new()
}
```

When using the glob operator you might end up not knowing if is something in the scope or something that was defined by your program.

### re-exporting with `pub use`.

Finally, you have the reexport with the `pub use`. This will make something that you imported available to the other packages. This is good when you want to export a different structure to the users. 

```rust
mod front_of_house;

pub use front_of_house::hosting;

fn main() {
    hosting::add_to_waitlist();
}
```

# Using cargo

Cargo is rust build system and package manager, it’s a very good tool but it has some quirks.

## Multiple entry points

Sometimes you want to have different entry points for your application. I was doing the Advent of Code and wanted to have everything into a single project but run them in isolation. 

### Multiple bins with a bin folder

Cargo can compile and run multiple executables if you have them under the `src/bin` folder. So in the case were we have a code challenge every day, we can have a structure like 

```
advent_of_code
├── Cargo.lock
├── Cargo.toml
└── src
    ├── bin
    |   ├── day_1.rs
    │   └── day_2.rs
    └── main.rs
```

We put the main method inside those files in the `bin` folder:

```rust
// src/bin/day_1.rs
fn main() {
    println!("Day 1");
}

// src/bin/day_2.rs
fn main() {
    println!("Day 2");
}
```

Now that we have multiple bins, we must specify the one we want to run. In this case we have three options, `advent_of_code` that is the root binary from `src/main.rs`, `day_1` and `day_2` that are inside `src/bin`.

```rust
$ cargo run --bin advent_of_code
    Finished dev [unoptimized + debuginfo] target(s) in 0.00s
     Running `target\debug\advent_of_code.exe`
Hello, world!

$ cargo run --bin day_1
   Compiling advent_of_code v0.1.0 (C:\Users\andre\projects\advent_of_code)
    Finished dev [unoptimized + debuginfo] target(s) in 0.26s
     Running `target\debug\day_1.exe`
Day 1

$ cargo run --bin day_2
   Compiling advent_of_code v0.1.0 (C:\Users\andre\projects\advent_of_code)
    Finished dev [unoptimized + debuginfo] target(s) in 0.23s
     Running `target\debug\day_2.exe`
Day 2
```

### Multiple bins within `Cargo.toml`

In case you don’t want to have the bin folder, there’s also the possibility to specify the binary in the `Cargo.toml` file. So we have the same project with a different structure

```rust
advent_of_code
├── Cargo.lock
├── Cargo.toml
└── src
    ├── day_1.rs
    ├── day_2.rs
    └── main.rs
```

Then in the `Cargo.toml` we should specify the all the three entry points:

```rust
[package]
name = "advent_of_code"
version = "0.1.0"
edition = "2021"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html
[[bin]]
name = "day_1"
path = "src/day_1.rs"

[[bin]]
name = "day_2"
path = "src/_day_2.rs"

[dependencies]
```

You can run the same way using the `cargo run --bin bin_name`.