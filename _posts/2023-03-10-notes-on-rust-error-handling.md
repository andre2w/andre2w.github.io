---
layout: post
asset-type: post
title: "Notes on Rust: Error Handling"
date: 2023-03-10 00:00:00 +00:00
author: André Guelfi Torres
tags:
    - rust
    - notes on rust
---

There’s no way to run away from errors, eventually they will happen. Usually there are two kinds of errors: 

- Recoverable: Is an error where you can do something about it and you want to continue with the execution
- Unrecoverable: Is an error where you can’t do anything about it and the application just has to stop.

Rust has ways to deal with both. 

## `panic!` at the program

First lets talk about unrecoverable errors. Your application might be in a state where you want to stop everything, for that you can use the `panic!` macro. This will cause the application to stop and print the Backtrace (in Rust is called Backtrace, but you probably hear as stacktrace) showing the calls. 

We have the following program that will panic:

```rust
fn main() {
    panic!("Something wrong is not right");
}  
```

When we try `cargo run` that we get

```rust
Compiling panic v0.1.0 (rust-book/panic)
    Finished dev [unoptimized + debuginfo] target(s) in 1.27s
     Running `target/debug/panic`
thread 'main' panicked at 'Something wrong is not right', src/main.rs:2:5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

It shows the message that I passed to the `panic!` macro and the location where it happens. Of course that the entire code won’t be at the `main` function.

```rust
fn main() {
    will_call_someting_that_panics();
}

fn will_call_someting_that_panics() {
    will_panic();
}

fn will_panic() {
    panic!("Something wrong is not right");
}
```

But we still get the same message when we run `cargo run`:

```rust
Compiling panic v0.1.0 (rust-book/panic)
    Finished dev [unoptimized + debuginfo] target(s) in 0.84s
     Running `target/debug/panic`
thread 'main' panicked at 'Something wrong is not right', src/main.rs:10:5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

So we add the `RUST_BACKTRACE=1` that the note mentions and:

```rust
Finished dev [unoptimized + debuginfo] target(s) in 0.00s
     Running `target/debug/panic`
thread 'main' panicked at 'Something wrong is not right', src/main.rs:10:5
stack backtrace:
   0: rust_begin_unwind
             at /rustc/897e37553bba8b42751c67658967889d11ecd120/library/std/src/panicking.rs:584:5
   1: core::panicking::panic_fmt
             at /rustc/897e37553bba8b42751c67658967889d11ecd120/library/core/src/panicking.rs:142:14
   2: panic::will_panic
             at ./src/main.rs:10:5
   3: panic::will_call_someting_that_panics
             at ./src/main.rs:6:5
   4: panic::main
             at ./src/main.rs:2:5
   5: core::ops::function::FnOnce::call_once
             at /rustc/897e37553bba8b42751c67658967889d11ecd120/library/core/src/ops/function.rs:248:5
note: Some details are omitted, run with `RUST_BACKTRACE=full` for a verbose backtrace.
```

Now we know the path that was made to get in there, but the `RUST_BACKTRACE` gives a way smaller message in case you are using a release build like `RUST_BACKTRACE=1 cargo run --release`: 

```rust
Compiling panic v0.1.0 (rust-book/panic)
    Finished release [optimized] target(s) in 0.14s
     Running `target/release/panic`
thread 'main' panicked at 'Something wrong is not right', src/main.rs:10:5
stack backtrace:
   0: rust_begin_unwind
             at /rustc/897e37553bba8b42751c67658967889d11ecd120/library/std/src/panicking.rs:584:5
   1: core::panicking::panic_fmt
             at /rustc/897e37553bba8b42751c67658967889d11ecd120/library/core/src/panicking.rs:142:14
   2: panic::main
note: Some details are omitted, run with `RUST_BACKTRACE=full` for a verbose backtrace.
```

### Unwinding and cleaning after yourself

After `panic!` Rust will execute a unwind process, which will go back and free all the memory and resources taken. This is important to avoid memory leaks or cause issues with dealing with resources like files or sockets. 

In the [Rust Book](https://doc.rust-lang.org/book/ch09-01-unrecoverable-errors-with-panic.html#unwinding-the-stack-or-aborting-in-response-to-a-panic) they mention that you can remove the unwind process to make the application smaller by changing the `Cargo.toml`.

```rust
[profile.release]
panic = 'abort'
```

## Recoverable Errors

You don’t have to `panic!` about everything, some errors are recoverable. The file you read isn’t there? the api call failed? That’s all fine and you can move on with life using the `Result<T, E>` construct. Very much like the `Option<T>`, this is an enum where a possible failure is wrapped. The declaration of `Result<T, E>` is:

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

In this case there’s is the generic type `E` so we can also pass the error. So when you try to read a file you can do:

```rust
use std::fs::File;

fn main() {
    let greeting_file_result = File::open("hello.txt");

    match greeting_file_result {
        Ok(_) => println!("File was read"),
        Err(error) => println!("There was an error reading file: {:?}", error),
    }

    println!("But there's not reason to panic! about")
}
```

Since the file does not exists you will get

```rust
Finished dev [unoptimized + debuginfo] target(s) in 0.14s
     Running `target/debug/panic`
There was an error reading file: Os { code: 2, kind: NotFound, message: "No such file or directory" }
But there's not reason to panic! about
```

To narrow on the error type is also possible to check the `kind()` function to get the specific error that it was returned. 

```rust
use std::fs::File;

fn main() {
    let greeting_file_result = File::open("hello.txt");

    match greeting_file_result {
        Ok(_) => println!("File was read"),
        Err(error) => match error.kind() {
            std::io::ErrorKind::NotFound => println!("File not found"),
            anything_else => panic!("Something is wrong {:?}", anything_else),
        },
    }
    println!("But there's not reason to panic! about")
}
```

### Syntactic Sugar

Now, you don’t have to use `match` every time you deal with result. Instead there are a set of functions it can be used that will panic the application if that’s what you want. 

`unwrap_or_else`: it does sounds like a threat but this just adds a way to get the value or do something with the error

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let greeting_file = File::open("hello.txt").unwrap_or_else(|error| {
        if error.kind() == ErrorKind::NotFound {
            File::create("hello.txt").unwrap_or_else(|error| {
                panic!("Problem creating the file: {:?}", error);
            })
        } else {
            panic!("Problem opening the file: {:?}", error);
        }
    });
}
```

`unwrap`: It gives you the value or `panic!` the application, makes it shorter when you want to `panic!` on error.

```rust
use std::fs::File;

fn main() {
    let greeting_file = File::open("hello.txt").unwrap();
}
```

`expect`: It’s just like `unwrap` but you can pass a nice error message to it. Its usually preferred since it makes easier to understand what’s going on. 

```rust
use std::fs::File;

fn main() {
    let greeting_file = File::open("hello.txt")
        .expect("hello.txt should be included in this project");
}
```

### Simplifying calls with `?`

The `Result<T, E>` enum is very useful to handle recoverable errors, and we have a lot of recoverable errors in the day to day. Think of the following example: 

- Parse a string to json
- Validate the JSON shape
- Get a value from it
- make a database call
- add a value based on the json + db data into a queue.

Every single of those steps can have errors, so we would have to use result in them. The code for that is lengthy and repetitive, look on how `do_work` ends becoming the same thing over and over: 

```rust
enum PaymentType {
    CASH,
    CREDIT,
    DEBIT,
}

struct Payment {
    amount: isize,
    payment_type: PaymentType,
    user_id: usize,
}

struct PaymentError {
    reason: String,
}

fn main() {
    let valid_data = String::from("{}");
    match do_work(valid_data) {
        Ok(()) => println!("Success!"),
        Err(err) => println!("Error: {err}"),
    };

    let invalid_data = String::from("invalid");

    match do_work(invalid_data) {
        Ok(()) => println!("Success!"),
        Err(err) => println!("Error: {err}"),
    };
}

fn parse_json(json: String) -> Result<Payment, String> {
    if json.starts_with("{") {
        return Ok(Payment {
            amount: 150,
            payment_type: PaymentType::CASH,
            user_id: 42,
        });
    }
    return Err(String::from("Could not parse json"));
}

fn get_user_email(user_id: usize) -> Result<String, String> {
    if user_id == 42 {
        return Ok(String::from("email@example.org"));
    }
    return Err(String::from("Could not find user email"));
}

fn send_confirmation_email(email: String) -> Result<(), String> {
    println!("Will send email to {email}");
    return Ok(());
}

fn do_work(data: String) -> Result<(), String> {
    let payment = match parse_json(data) {
        Ok(payment) => payment,
        Err(err) => return Err(err),
    };

    let user_email = match get_user_email(payment.user_id) {
        Ok(email) => email,
        Err(error) => return Err(error),
    };

    match send_confirmation_email(user_email) {
        Ok(()) => println!("Confirmation email sent"),
        Err(err) => return Err(err),
    };

    return Ok(());
}
```

There is the `?` operator that allow us to chain those operations so we can work with the success values sequentially. Let’s refactor `do_work` to use that

```rust
fn do_work(data: String) -> Result<(), String> {
    let user_id = parse_json(data)?.user_id;
    let user_email = get_user_email(user_id)?;
    send_confirmation_email(user_email)?;
    return Ok(());
}
```

Both versions of `do_work` will have the same result but the second one is way easier to deal with it. The `?` operator propagates the `Err` to the caller, so we don’t have to deal with that, it’s almost like a `throw` but more behaved.