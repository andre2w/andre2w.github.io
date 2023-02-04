---
layout: post
asset-type: post
title: "Notes on Rust: Tuples, Structs, Enums and Pattern Matching"
date: 2023-02-04 00:00:00 +00:00
author: André Guelfi Torres
tags:
    - rust
    - notes on rust
---

## Tuples

Tuples are the most basic data structure that we have in Rust. It’s based on positioning, like a fixed length array. 

```rust
let first_example = get_something(String::from("First Example"));
println!("Values are: {} and {}", first_example.0, first_example.1);

// This is a way to destruct the tuple into variables for easy access
let (string_value, integer_value) = get_something(String::from("Something"));
println!("Values are: {} and {}", string_value, integer_value);
```

That would end printing:

```rust
Values are: First Example and 0
Values are: Something and 0
```

It’s also possible to add names to tuples with the `struct` keyword. 

```rust
struct Point(i32, i32);

fn main() {
    let coordinates = Point(3, 14);
    print_coordinates(&coordinates);
}

fn print_coordinates(point: &Point) {
    println!("Coordinates x: {} and y: {}", point.0, point.1);
}
```

In case you name a tuple using `struct` you won’t be able to pass arbitrary tuples or tuples with the same shape but different names. 

```rust
struct Point(i32, i32);
struct LatLong(i32, i32);

fn main() {
    let coordinates = Point(3, 14);
    print_coordinates(&coordinates);

    let lat_long = LatLong(4, 5);
    print_coordinates(&lat_long);

    print_coordinates((12, 33));
}

fn print_coordinates(point: &Point) {
    println!("Coordinates x: {} and y: {}", point.0, point.1);
}
```

Throws errors 

```rust
error[E0308]: mismatched types
  --> src/main.rs:9:23
   |
9  |     print_coordinates(&lat_long);
   |     ----------------- ^^^^^^^^^ expected struct `Point`, found struct `LatLong`
   |     |
   |     arguments to this function are incorrect
   |
   = note: expected reference `&Point`
              found reference `&LatLong`
note: function defined here
  --> src/main.rs:14:4
   |
14 | fn print_coordinates(point: &Point) {
   |    ^^^^^^^^^^^^^^^^^ -------------

error[E0308]: mismatched types
  --> src/main.rs:11:23
   |
11 |     print_coordinates((12, 33));
   |     ----------------- ^^^^^^^^ expected `&Point`, found tuple
   |     |
   |     arguments to this function are incorrect
   |
   = note: expected reference `&Point`
                  found tuple `({integer}, {integer})`
note: function defined here
  --> src/main.rs:14:4
   |
14 | fn print_coordinates(point: &Point) {
   |    ^^^^^^^^^^^^^^^^^ -------------

For more information about this error, try `rustc --explain E0308`.
error: could not compile `structs` due to 2 previous errors
```

## Struct

Structs are a way to group fields together into a single declaration, like an object. Structs in Rust are declared as the following: 

```rust
struct User { // Name of the strcut
    username: String, // Fields
    email: String,
    active: bool,
    sign_in_count: u64, // You add the trailing comma
}
```

Now to instantiate a new struct you can do, no need to use `new` or parenthesis:

```rust
let user1 = User {
    email: String::from("someone@example.com"),
    username: String::from("someusername123"),
    active: true,
    sign_in_count: 1,
};

// To declare a mutable struct just add the `mut` keyword. The entire struct is mutable, there isn't a way to only have a single field mutable
let mut user1 = User {
    email: String::from("someone@example.com"),
    username: String::from("someusername123"),
    active: true,
    sign_in_count: 1,
};
```

To declare a mutable struct just add the `mut` keyword. The entire struct is mutable, there isn't a way to only have a single field mutable.

```rust
let mut user1 = User {
    email: String::from("someone@example.com"),
    username: String::from("someusername123"),
    active: true,
    sign_in_count: 1,
};
```

In Rust you have some syntactic sugar to instantiate structs:

- Shorthand field: If you have a variable with the name of the field, you don’t have to put the field twice (name and value), just put the variable.

```rust
let email = String::from("someone@example.com");
let username = String::from("someusername123");
let mut user1 = User {
    email,
    username,
    active: true,
    sign_in_count: 1,
};
```

- Spread Operator: You can use other structs to build a new struct. With the spread operator `..`.

```rust
let email = String::from("someone@example.com");
let username = String::from("someusername123");
let user1 = User {
    email,
    username,
    active: true,
    sign_in_count: 1,
};

let user2 = User {
    email: String::from("otheruser@example.com"),
    ..user1
};
println!("Testing Log {}", user2.email); // Will print "Testing Log otheruser@example.com"
```

Is worth to remind that the spread operator in Rust is different than in Javascript. In Javascript will spread all the fields from the object into the new one. In Rust what is done is that ONLY the missing fields are copied to the new object.

And with the spread operator, the ownership of the data is passed to the new object. So you won’t have access to the field in the original object.

```rust
let email = String::from("someone@example.com");
let username = String::from("someusername123");
let user1 = User {
    email,
    username,
    active: true,
    sign_in_count: 1,
};

let user2 = User {
    email: String::from("otheruser@example.com"),
    ..user1
};
println!("Testing Log {}", user2.email); // Will print "Testing Log otheruser@example.com"
println!("Testing Log {}", user1.email); // Will print "Testing Log someone@example.com"
println!("Testing Log {}", user1.username); // Will not compile
```

If you try to compile the example above the compiler will throw the following error:

```rust
warning: unused variable: `user2`
  --> src\main.rs:18:9
   |
18 |     let user2 = User {
   |         ^^^^^ help: if this is intentional, prefix it with an underscore: `_user2`
   |
   = note: `#[warn(unused_variables)]` on by default

error[E0382]: borrow of moved value: `user1.username`
  --> src\main.rs:22:32
   |
18 |       let user2 = User {
   |  _________________-
19 | |         email: String::from("otheruser@example.com"),
20 | |         ..user1
21 | |     };
   | |_____- value moved here
22 |       println!("Testing Log {}", user1.username);
   |                                  ^^^^^^^^^^^^^^ value borrowed here after move
   |
   = note: move occurs because `user1.username` has type `String`, which does not implement the `Copy` trait
   = note: this error originates in the macro `$crate::format_args_nl` which comes from the expansion of the macro `println` (in Nightly builds, run with -Z macro-backtrace for more info)

For more information about this error, try `rustc --explain E0382`.
warning: `structs` (bin "structs") generated 1 warning
error: could not compile `structs` due to previous error; 1 warning emitted
```

A struct also can have NO fields, to be just an empty declaration. This is called a Unit Type. 

```rust
struct AlwaysEqual;

fn main() {
  let subject = AlwaysEqual;
}
```

## Ownership of the Data

The struct should own the all the data inside, so in a struct like:

```rust
struct User {
    username: String,
    email: String,
    active: bool,
    sign_in_count: u64,
}
```

When the main struct is not being used anymore all the data is freed from memory, specially the `username` and `email` fields that are using a `String` which are variable size types that are stored in the heap. 

In case we try to create a struct with references you start to bump into certain issues. So if we replace the `String` with `&str`:

```rust
struct User {
    username: &str,
    email: &str,
    active: bool,
    sign_in_count: u64,
}
```

The compiler will start throwing errors:

```rust
error[E0106]: missing lifetime specifier
 --> src/main.rs:5:15
  |
5 |     username: &str,
  |               ^ expected named lifetime parameter
  |
help: consider introducing a named lifetime parameter
  |
4 ~ struct User<'a> {
5 ~     username: &'a str,
  |

error[E0106]: missing lifetime specifier
 --> src/main.rs:6:12
  |
6 |     email: &str,
  |            ^ expected named lifetime parameter
  |
help: consider introducing a named lifetime parameter
  |
4 ~ struct User<'a> {
5 |     username: &str,
6 ~     email: &'a str,
  |
```

Right now I haven’t reached the Lifetimes part, so will stop by here.

## Printing Structs

Since structs have user defined shapes, isn’t that easy to simply print a struct, 

```rust
struct User {
    username: String,
    email: String,
    active: bool,
    sign_in_count: u64,
}

fn main() {
    let user = User {
        username: String::from("Username"),
        email: String::from("email@something.com"),
        active: true,
        sign_in_count: 2,
    };

    println!("Logged User: {}", user);
}
```

Has the compiler throwing: 

```rust
error[E0277]: `User` doesn't implement `std::fmt::Display`
  --> src/main.rs:19:33
   |
19 |     println!("Logged User: {}", user);
   |                                 ^^^^ `User` cannot be formatted with the default formatter
   |
   = help: the trait `std::fmt::Display` is not implemented for `User`
   = note: in format strings you may be able to use `{:?}` (or {:#?} for pretty-print) instead
   = note: this error originates in the macro `$crate::format_args_nl` which comes from the expansion of the macro `println` (in Nightly builds, run with -Z macro-backtrace for more info)
```

So what happens if we use `{:?}` or `{:#?}`?

```rust
error[E0277]: `User` doesn't implement `Debug`
  --> src/main.rs:19:35
   |
19 |     println!("Logged User: {:?}", user);
   |                                   ^^^^ `User` cannot be formatted using `{:?}`
   |
   = help: the trait `Debug` is not implemented for `User`
   = note: add `#[derive(Debug)]` to `User` or manually `impl Debug for User`
   = note: this error originates in the macro `$crate::format_args_nl` which comes from the expansion of the macro `println` (in Nightly builds, run with -Z macro-backtrace for more info)
help: consider annotating `User` with `#[derive(Debug)]`
   |
4  | #[derive(Debug)]
   |

error[E0277]: `User` doesn't implement `Debug`
  --> src/main.rs:20:36
   |
20 |     println!("Logged User: {:#?}", user);
   |                                    ^^^^ `User` cannot be formatted using `{:?}`
   |
   = help: the trait `Debug` is not implemented for `User`
   = note: add `#[derive(Debug)]` to `User` or manually `impl Debug for User`
   = note: this error originates in the macro `$crate::format_args_nl` which comes from the expansion of the macro `println` (in Nightly builds, run with -Z macro-backtrace for more info)
help: consider annotating `User` with `#[derive(Debug)]`
   |
4  | #[derive(Debug)]
   |
```

Well, rust still can’t print. Due it’s low level nature rust don’t have things like reflection to inspect objects at runtime. So we need to add Debug symbols at the structs we want to print. After adding the `#derive(Debug)` to the struct we can print:

```rust
#[derive(Debug)]
struct User {
    username: String,
    email: String,
    active: bool,
    sign_in_count: u64,
}
```

And here’s the `cargo run` result:

```rust
Logged User: User { username: "Username", email: "email@something.com", active: true, sign_in_count: 2 }
Logged User: User {
    username: "Username",
    email: "email@something.com",
    active: true,
    sign_in_count: 2,
}
```

Rust also has the `dbg!` macro that that prints the data with extra information. So we add that to our code:

```rust
let user = User {
    username: String::from("Username"),
    email: String::from("email@something.com"),
    active: true,
    sign_in_count: dbg!(2 + 1),
};

dbg!(&user)
```

And we get information about the method that was called and the value that returned. with the file and line. 

```rust
[src/main.rs:16] 2 + 1 = 3
[src/main.rs:19] &user = User {
    username: "Username",
    email: "email@something.com",
    active: true,
    sign_in_count: 3,
}
```

## Methods

It’s also possible to have methods in a struct, this way you can call `struct.method()`. The syntax to declare that is: 

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
	let rectangle = Rectangle {
	  width: 13,
    height: 44,
	};
  println!("Rectangle area: {}", rectangle.area());
}
```

So the functions inside the `impl` part will become methods in the `Rectangle` struct. One thing that functions inside the `impl` block differs from regular functions is that they always have `&self` as the first parameter so we can have access to the struct fields. 

> `&self` is the shorthand for `self: &Self` which is the type of the struct that you are implementing the methods for. In this case `self: &Rectangle`.
> 

You can also write functions without the `&self` as first parameter, they are called Associated Functions. For example `String::from` is a associated function, and as you can see they diverge on how they are called. 

Creating a associated function:

```rust
impl Rectangle {
    fn square(size: u32) -> Self {
        return Self {
            width: size,
            height: size,
        };
    }
}
```

You are also allowed to have multiple implementation blocks if you want: 

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.height * self.width
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        return self.height >= other.height && self.width >= other.width;
    }
}

impl Rectangle {
    fn square(size: u32) -> Self {
        return Self {
            width: size,
            height: size,
        };
    }
}
```

Having multiple `impl` blocks will cause the functions to be merged into a single one. 

## Enums and Pattern Matching

In rust enums are declared with the following syntax

```rust
enum IpAddrKind {
    V4,
    V6,
}
```

then you can instantiate them with 

```rust
let ipv4 = IpAddrKind::V4;
let ipv6 = IpAddrKind::V6;
```

Enums can also carry a value that you pass when you instantiate them like a struct, and different enum values can have different types of values:

```rust
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

let host = IpAddr::V4(String::from(127, 0, 0, 1));
let hostV6 = IpAddr::V6(String::from("::1"));
```

You can also use structs and other enums as the enum value. An example of enum with multiple types of values.

```rust
struct Position {
    x: i32,
    y: i32
}

enum Message {
    Quit,
    Move(Position),
    Write(String),
    ChangeColor(i32, i32, i32),
    Image { url: String, alt_text: String },     
}
```

The `Image` has named fields like a struct would have. 

Just like in structs you can implement methods to an enum with the `impl` block. 

```rust
impl Message {
    fn call(&self) {
         // Method Implementation
    }
}

let message = Message::Write(String::from("Something"));
message.call();
```

### Option enum

Instead of dealing with null values rust uses the Option enum, like the [Null Object Pattern](https://sourcemaking.com/design_patterns/null_object), you get a concrete implementation instead of a null reference and you can chose to do what you want when you have a null value. 

This advantage of using the Option enum is that you can have the compiler to check exhaustively that you handled the null case avoid problems with it. 

The Option enum comes with the standard library and it’s definition is: 

```rust
enum Option<T> {
    None,
    Some(T),
}
```

You can use the `None` and `Some` values without having to put the `Option::` 

```rust
let a_proper_value: Option<i32> = Some(15);
let an_empty_value: Option<i32> = None;
```

### match - pattern matching with enums

Now is clear on how to declare enums, but they are not complete with a good way to use them. That’s where the `match` keyword comes. With `match` you can have an exhaustive check at compile time to be sure you took care of all the cases in your enum. 

Imagine that you want to route a request to a different endpoint based on an enum value

```rust
enum Stage {
    Gamma,
    Production,
}

fn get_stage_url(stage: Stage) -> String {
    match stage {
        Stage::Gamma => String::from("https://example.org/gamma"),
        Stage::Production => String::from("https://production.org"),
    }
}

fn main() {
    println!("Using url {}", get_stage_url(Stage::Production));
}
```

The code above would print:

```
Using url https://production.org
```

Now this is a very simple enum, and we saw that we can have more data than just its name. `match` also allows to access the values inside the enum and you can even make more complex computations inside the `match`. 

```rust
fn main() {
   let email = get_email_by_username(String::from("username"));
    match email {
        Some(email) => {
            send_email_to_user(email);
            println!("Email sent successfully");
        }
        None => println!("User don't have an email"),
    }
}

fn get_email_by_username(username: String) -> Option<String> {
    Some(format!("{}@example.org", username))
}

fn send_email_to_user(email: String) {
    println!("Email sent to {}", email);
}
```

Sometimes you just need to work with a small subset of values of an enum and just ignore the rest, for that you can use the `_` as a default case and `{}` as a void function. Imagine if you were coding an Automated Vending Machine that only accepts 1 euro and 50 cents coins, you could implement the following code.

```rust
enum Coin {
    OneEuro,
    Fifty,
    TwentyFive,
    Ten,
    Five,
    Two,
}

fn main() {
    let mut total: u32 = 0;
    let inserted_coins = [Coin::OneEuro, Coin::Ten, Coin::Ten, Coin::Fifty];

    for coin in inserted_coins {
        match coin {
            Coin::OneEuro => total = total + 100,
            Coin::Fifty => total = total + 50,
            _ => {}
        }
    }

    println!("Total: {}", total);
}
```

Finally if you need just a single value of an enum then you can use the `if let` construct. If you were building an RPG and you want to add a feature that when the user rolls 19 they get a a buff. We get the input wrapped in a `Option<i32>` and then we have to check. 

```rust
fn apply_buff() {
    println!("Buff applyed!!!");
}

fn main() {
    let first_roll = Some(5);
    let second_roll = Some(19);

    if let Some(19) = first_roll {
        apply_buff();
    }
    if let Some(19) = second_roll {
        apply_buff();
    }
}
```

The code above would print

```
Buff applyed!!!
```

It is also possible to access the enum fields by replacing the hard-coded value with a variable: