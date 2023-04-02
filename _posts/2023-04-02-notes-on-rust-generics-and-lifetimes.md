---
layout: post
asset-type: post
title: "Notes on Rust: Generics and Lifetimes"
date: 2023-04-02 00:00:00 +00:00
author: André Guelfi Torres
tags:
    - rust
    - notes on rust
---

Rust like most languages, has generics. They work almost the same, with the `<T>` notation and you can add to functions, structus, enums and `impl` and traits.

```rust
// Generic in a function declaration
fn largest<T>(list: &[T]) -> &T {
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }
}

// Generic in a struct
struct Point<T> {
    x: T,
    y: T,
}

// You can have a generic in a impl block, but you need the <T> twice
impl<T> Point<T> {
    fn flip_values(self) -> Point<T> {
		     Point { x: self.y, y: self.x }
    }
}

// Generic in a enum
enum Result<T, E> {
    Ok(T),
    Err(E),
}

fn main() {
    // Rust can infer the type of the genric
    let point_int = Point { x: 15, y: 15 };
    let point_float = Point { x: 15.0, y: 5.0 };
    // But the same generic type can't hold two different values.
    let point_mixed = Point { x: 15.0, y: 33 };
    println!("Hello, world!");
}

```

You can have methods that are only available only when you use a certain type in the generic

```rust
impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

## Trait: Defining Shared Behaviour

In case you need multiple implementations of the same interface, you can use `traits`. Which declare an interface that can be implemented by other structs.

```rust
pub trait Summary {
		fn summarize(&self) -> String;
}
```

Now this trait can be implemented by multiple structs

```rust
pub struct NewsArticle {
    pub headline: String,
		pub location: String,
		pub author: String,
		pub content: String,
}

impl Summary for NewsArticle {
		fn summarize(&self) -> String {
				format!("{}, by {} ({})", self.headline, self.author, self.location)
		}
}

pub struct Tweet {
		pub username: String,
		pub content: String,
		pub reply: bool,
		pub retweet: bool,
}

impl Summary for NewsArticle {
		fn summarize(&self) -> String {
				format!("{}: {})", self.username, self.content)
		}
}

fn main() {
		let tweet = Tweet {
				username: String::from("horse_ebooks"),
				content: String::from("of course, as you probably already know, people"),
				reply: false,
				retweet: false,
		}

		println!("1 new tweet: {}", tweet.summarize());
}
```

You can also have a default implementation for a trait so the methods don’t have to implement the same code over and over.

```rust
impl Summary for Tweet {
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
}
```

You  can use traits as parameters and also combine traits in the parameter or generic type. 

```rust
// Trait in the parameter
pub fn notify(item: &impl Summary) {
    println!("Breaking news! {}", item.summarize());
}

// Having a trait in the generic
pub fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}

// Combine traits in the paramter
pub fn notify(item: &(impl Summary + Display)) {};

// Combine traits in the generic
pub fn notify<T: Summary + Display>(item: &T) {}

// Traits can also be used as return value
fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("horse_ebooks"),
        content: String::from(
            "of course, as you probably already know, people",
        ),
        reply: false,
        retweet: false,
    }
}
```

In case you have some complex types you don’t have to put everything in `<T>` part of the function. There’s a `where` keyword allowing to add traits

```rust
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{}
```

# Lifetimes

Lifetimes is a Rust concept that tracks how long a variable lives, this is to avoid dangling references. In case you try to use a value that doesn’t live long enough, the compilation will fail. 

In cases where you are trying to return a reference like: 

```rust
fn main() {
    let string1 = String::from("abcd");
    let string2 = "xyz";

    let result = longest(string1.as_str(), string2);
    println!("The longest string is {}", result);
}

fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

You will get a lifetime error

```rust
error[E0106]: missing lifetime specifier
 --> src/main.rs:9:33
  |
9 | fn longest(x: &str, y: &str) -> &str {
  |               ----     ----     ^ expected named lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `x` or `y`
help: consider introducing a named lifetime parameter
  |
9 | fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
  |           ++++     ++          ++          ++

For more information about this error, try `rustc --explain E0106`.
error: could not compile `lifetimes` due to previous error
```

The error shows how to use lifetimes in the help part. It’s the weird `'a` syntax and the lifetime is generic based on the input. Then the function is updated and:

```
The longest string is abcd
```

Lifetime annotations are meant to tell Rust how generic lifetime parameters of multiple references relate to each other. What exactly the `'a` in the function means? It means that the result will only live while `x` and `y` are valid, the moment they go out of scope, the result will also go out of scope. You can not specify a lifetime to a variable that you created inside the function. 

It is also possible to have Lifetime annotations in structs. 

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}
```

In this case `ImportantExcerpt` can’t live more than the reference that was used to create it. In the case where:

```rust
fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
		let first_sentence = novel.split(".").next().expect("Could not find a '.'");
		let i = ImportantExcerpt {
			part: first_sentence
		}
}
```

The `ImportantExcerpt` declared in `i` can’t outlive the `novel` string. 

Now if you want to implement methods for `ImportantExcerpt` you will need to declare the lifetime

```rust
impl<'a> ImportantExcerpt<'a> {
		fn level(&self) -> i32 {
				3
		}
}
```

and you can mix lifetimes, generic types and trait bounds all together

```rust
use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display,
{
    println!("Announcement! {}", ann);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

### Lifetime Elision

When Rust was starting, many of the devs using Rust would end up typing the same lifetime rules over and over. The Rust team saw that and decided to apply some of the rules to the compiler, so in some cases is possible to have a reference as a parameter and result without having to explicitly mention the lifetime. 

For example: 

```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

The compiler is able to understand that the return is a reference based on the parameter lifetime by applying a set of rules. 

### Static Lifetime

There’s a special lifetime called `static`. Declaring a value with this lifetime means that it will live for the application’s entire lifetime. Even there are some recommendations of when to use `'static`. think if your reference actually lives the entire lifetime of your program.