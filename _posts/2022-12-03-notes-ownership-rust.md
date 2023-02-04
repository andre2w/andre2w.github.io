---
layout: post
asset-type: post
title: "Notes on Rust: Memory Ownership and Borrowing"
date: 2022-12-03 00:00:00 +00:00
author: André Guelfi Torres
tags:
    - rust
    - notes on rust
---

Rust has two ways to store variables during runtime.

- Stack: It's a faster way when you know the size of the variable.
- Heap: When you don't know the size of the memory, this is slower because it will store a pointer in the stack and the memory in the heap. It also has to look for an empty space in the memory that will fit your variable.

### Rules for ownership in Rust:

- Each value has an owner
- A value can only have one owner
- When the owner goes out of scope, the value is dropped

If you want to use the value from the heap in two variables you need to clone the same.

```rust
// This is not allowed
let s1 = String::from("Something");
let s2 = s1;
// In this case only s2 is valid, s1 will be dropped

// Now to use s1 and s2
let s1 = String::from("Something");
let s2 = s1.clone(); // This will clone the information from the stack and the heap into new values
```

This does not apply to values that only stay on the stack so you could do without having to use copy:

```rust
let string1 = "Something";
let string2 = string1;

let integer1 = 10;
let integer2 = integer1;
```

### Ownership and Functions

When you pass a value that is in the heap to a function, that function will be the new owner of it. So you can't continue using after calling it.

```rust
fn main() {
  let text = String.from("Something");
  println_something(text); // This will give ownership of text to print_something
  println!("{}", text); // This would not be valid because the value was dropped
}

fn print_something(text: String) {
  println!("{}", text);
}
```

This does not apply to values that only stay in the stack:

```rust
fn main() {
  let meaning = 42;
  println_something(meaning); // This makes a copy of the value in the stack
  println!("{}", meaning); // This would work normally
}

fn print_something(value: i32) {
  println!("{}", value);
}
```

### Return Values

You can overcome the limitation of not being able to use a value anymore by returning the value, this will give the ownership to the caller of the function

```rust
fn main() {
  let text = String.from("Something");
  let other_text = println_something(text); // This will give ownership of text to print_something
  println!("{}", other_text); // This would not be valid because the value was dropped
}

fn print_something(text: String) -> String {
  println!("{}", text);
  text // without semicolon to return the value
}
```

## References & Borrowing

Sometimes you want to use some value from the heap in a function but you don't want to take ownership of it. Example:

```rust
fn main() {
    let s1 = String::from("hello");
    let (s2, len) = calculate_length(s1);
    println!("The length of '{}' is {}.", s2, len);
}

fn calculate_length(s: String) -> (String, usize) {
    let length = s.len(); // len() returns the length of a String
    (s, length)
}
```

For `calculate_length` you don't want to take ownership of the `string`. In this case you just want to read the value and return the length. To solve this problem you can use a reference.

> & is the symbol used for passing references
> 

So after using a reference our function would be:

```rust
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1);

    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}
```

In Rust passing a reference is called `Borrowing` and it allows you to keep the ownership because when you passing a reference, you don't transfer the ownership to the function. With Borrowing you can't mutate values. So if you write

```rust
fn main() {
    let mut to_be_mutated = String::from("Hello");
    append_dot(&to_be_mutated);
    println!("{}", to_be_mutated);
}

fn append_dot(text: &String) {
    text.push_str(".");
}
```

The compiler will throw the following exception:

```rust
warning: variable does not need to be mutable
  --> src/main.rs:10:9
   |
10 |     let mut to_be_mutated = String::from("Hello");
   |         ----^^^^^^^^^^^^^
   |         |
   |         help: remove this `mut`
   |
   = note: `#[warn(unused_mut)]` on by default

error[E0596]: cannot borrow `*text` as mutable, as it is behind a `&` reference
  --> src/main.rs:28:5
   |
27 | fn append_dot(text: &String) {
   |                     ------- help: consider changing this to be a mutable reference: `&mut String`
28 |     text.push_str(".");
   |     ^^^^^^^^^^^^^^^^^^ `text` is a `&` reference, so the data it refers to cannot be borrowed as mutable

For more information about this error, try `rustc --explain E0596`.
```

You can't mutate what you don't own.

### Mutable References

Rust does allow to have mutable references but it has a specific syntax for it.

> `&mut` is used when you need a mutable reference
> 

So we fix the previous example to allow mutable references.

```rust
fn main() {
    let mut to_be_mutated = String::from("Hello");
    append_dot(&mut to_be_mutated);
    println!("{}", to_be_mutated);
}

fn append_dot(text: &mut String) {
    text.push_str(".");
}
```

Now the code above would be working.

Mutable References has some limitations, you can't borrow a mutable reference twice at the same time. So if you try the following piece of code:

```rust
fn main {
    append_text(&mut to_be_mutated, &mut to_be_mutated);
}

fn append_text(original: &mut String, appended: &mut String) {
    original.push_str(appended);
}
```

This piece of code will give the error when ran:

```rust
error[E0499]: cannot borrow `to_be_mutated` as mutable more than once at a time
  --> src/main.rs:14:37
   |
14 |     append_text(&mut to_be_mutated, &mut to_be_mutated);
   |     ----------- ------------------  ^^^^^^^^^^^^^^^^^^ second mutable borrow occurs here
   |     |           |
   |     |           first mutable borrow occurs here
   |     first borrow later used by call

For more information about this error, try `rustc --explain E0499`.
```

This limitation is how rust keep the language safe. This is to avoid data races at compile, since only one mutable reference can exist at any time. Rust also has check when you are using mutable and immutable references together. If you try to use them together the compiler will throw an error.

```rust
fn main {
    let mut mixed_type_values = String::from("Mixed Type Values");
    let s1 = &mixed_type_values;
    let s2 = &mixed_type_values;
    let s3 = &mut mixed_type_values;
    println!("Print vals: {}, {} and {}", s1, s2, s3);
}
```

```rust
error[E0502]: cannot borrow `mixed_type_values` as mutable because it is also borrowed as immutable
  --> src/main.rs:17:14
   |
15 |     let s1 = &mixed_type_values;
   |              ------------------ immutable borrow occurs here
16 |     let s2 = &mixed_type_values;
17 |     let s3 = &mut mixed_type_values;
   |              ^^^^^^^^^^^^^^^^^^^^^^ mutable borrow occurs here
18 |     println!("Print vals: {}, {} and {}", s1, s2, s3);
   |                                           -- immutable borrow later used here

For more information about this error, try `rustc --explain E0502`.
```

Now if you use the immutable values before, it will work, because those references don't have any risk of being mutated before the usage.

```rust
fn main() {
    let mut mixed_type_values = String::from("Mixed Type Values");
    let s1 = &mixed_type_values;
    let s2 = &mixed_type_values;
    println!("Print vals: {} and {}", s1, s2);

    let s3 = &mut mixed_type_values;
    println!("Print val: {}", s3);
}
```

> Check Non Lexical Lifetimes
> 

## Dangling References

A Dangling Reference is when you have a pointer referencing a memory address that was freed from memory. So, that pointer points to nothing. The following code creates a dangling reference:

```rust
fn main() {
    let reference_to_nothing = dangle(); // 3. Now we have a dangling reference
}

fn dangle() -> &String {
    let s = String::from("hello"); // 1. Create the value in memory

    &s // 2. returns the reference and free the value of s
}
```

The compiler will throw:

```rust
error[E0106]: missing lifetime specifier
  --> src/main.rs:45:16
   |
45 | fn dangle() -> &String {
   |                ^ expected named lifetime parameter
   |
   = help: this function's return type contains a borrowed value, but there is no value for it to be borrowed from
help: consider using the `'static` lifetime
   |
45 | fn dangle() -> &'static String {
   |                 +++++++

For more information about this error, try `rustc --explain E0106`.
```

The solution is quite easy, you just return the real value.

```rust
fn main() {
    let reference_to_s = dangle();
}

fn dangle() -> &String {
    let s = String::from("hello");
    s
}
```

In this case the ownership of `s` will be given to `reference_to_s`.

> Rust will only allow one single mutable reference per time or multiple immutable references. This is how race conditions are avoided at compile time. The compiler also will not allow you to have invalid references.
> 

# Slice

Slices are a way to pass a reference of a subset of a collection. This new slice will behave like a new collection having the `.len()` and it’s `0` and last indexes to be in the beginning of the slice. 

The syntax is quite simple:

```rust
let items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];   
let slice = &items[0..3]; // This will be [0, 1, 2] the end index is exclusive
```

And you can do the same with strings: 

```rust
fn main() {
    let items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let first_half = &items[0..5];
    let second_half = &items[6..10];

    println!(
        "First Half - First Item: {}, Length: {}",
        first_half[0],
        first_half.len()
    );
    println!(
        "Second Half - First Item: {}, Length: {}",
        second_half[0],
        second_half.len()
    );

    let hello_world = "Hello, World!";
    let hello = &hello_world[0..5];
    let world = &hello_world[7..12];
    println!("This is {}, and this is {}", hello, world);
}
```

The code above would print: 

```rust
First Half - First Item: 0, Length: 5
Second Half - First Item: 6, Length: 4
This is Hello, and this is World
```

Now imagine that you have to check if an element exists in a sorted array, you can use Binary Search for that. You start with an array, then you call the same method recursively on the left and right side. Usually you would have to pass the start and end indexes to it. 

The implementation would end like this:

```rust
fn main() {
    let items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];   
    let found = binary_search(&items, 3, 0, 11);
    println!("Is item 3 in the array? {}", found);
}

fn binary_search(items: &[i32], target: i32, start_index: usize, end_index: usize) -> bool {
  // Implementation hidden for obvious reasons
}
```

Now if we start using slices we can change the implementation to be 

```rust
fn main() {
    let items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];   
    let found = binary_search_with_slices(&items, 3);
    println!("Is item 3 in the array? {}", found);
}

fn binary_search_with_slices(items: &[i32], target: i32) -> bool {
  // Implementation hidden for obvious reasons
}
```