---
layout: post
asset-type: post
title: "Notes on Rust: Collections"
date: 2023-03-08 00:00:00 +00:00
author: André Guelfi Torres
tags:
    - rust
    - notes on rust
---

Rust has two types of collections: 

- Stored in the stack: Like array and tuples, you need to know the sizes of those collections so Rust can allocate the right amount of memory.
- The ones stored in the heap: The point of those are to be with dynamic length, so you don’t need to know their size beforehand. The main ones are `vector`, `string` and `hash map`.

## Vector

The first one is the `vector`, which is a dynamic length list, where you can add or remove values. To instantiate a new `vector` you do:

```rust
// When using Vec::new() we need to declare the type
// because it is a generic function and
// the type can't be inferred automatically
let v: Vec<i32> = Vec::new();

// In case you already have an initial value you can use vec!
// which will create a vector with the values passed and it will
// also infer the type for you
let v = vec![1, 2, 3];
```

Even those dynamic data structures are immutable, so if you want to add items to it you need to declare them as mutable. 

```rust
// This will throw an error
let immutable_vector: Vec<i32> = Vec::new();

immutable_vector.push(1); // error[E0596]: cannot borrow `immutable_vector` as mutable, as it is not declared as mutable

// This is allowed
let mut mutable_vector: Vec<i32> = Vec::new();

mutable_vector.push(1);
mutable_vector.push(2);
mutable_vector.push(3);
```

### Memory safety

Now, if you are storing something in a vector, you probably want to read it. There are two ways of doing data. 

The unsafe way using `&vector[index]` that gives you a reference of the value:

```rust
let v: Vec<i32> = vec![1, 2, 3, 4, 5];
let id = &v[0];
println!("Something {}", id); // Something 1

let invalid_index = &v[10];
println!("Somethin else {}", invalid_index); // thread 'main' panicked at 'index out of bounds: the len is 5 but the index is 10', src/main.rs:3:15
```

There’s also the safe way with `vector.get(index)` that will return an `Option<&T>`. 

```rust
let v: Vec<i32> = vec![1, 2, 3, 4, 5];
let id = v.get(1);
match id {
   Some(id) => println!("The selected element is {}", id), 
   None => println!("No valid element was selected"),
} // The selected element is 2

let invalid_element = v.get(20);
match invalid_element {
   Some(invalid_element) => println!("The selected element is {}", invalid_element),
   None => println!("No valid element was selected"),
} // No valid element was selected
```

Now on Vectors and Safety, when you get a value from the value from a vector, you get all the borrow checks and memory ownership safeguard that rust has. 

When you have the ownership of a value from the vector you can’t modify the same. 

```rust
fn main() {
	let mut v: Vec<i32> = vec![1, 2, 3, 4, 5];
  let value = &v[1]; // &v[1] or v.get(1) will enforce the rules
  v.push(6);
  println!("The element at 1 is {}", value);
}
```

When you try to compile, you will receive:

```rust
23 |     let value = &v[1];
   |                  - immutable borrow occurs here
24 |     v.push(6);
   |     ^^^^^^^^^ mutable borrow occurs here
25 |     println!("The element at 1 is {}", value);
   |                                        ----- immutable borrow later used here
```

Also when a vector is dropped from scope the values are also dropped. The borrow checker will make sure that no one is using a value.

Finally you can easily iterate over vectors too

```rust
let v = vec![100, 32, 57];
for i in &v {
	println!("{i}");
}
```

## String

Rust has two types of string types. The `&str` and the `String`, the first one is stored in the stack and have fixed size. The other one is a dynamic one, where you can manipulate it. Here I will only talk about the second one. 

We create those strings doing the following

```rust
let empty_string = String::new()
let test_string = String::from("Test");
let from_string = "from string".to_string();
```

You can update `String`s if they are mutable

```rust
let mut s1 = String::from("foo");
let s2 = "bar";
s.push_str("_");
s.push_str(s2);
s.push('!'); // String.push() accepts a character
println!("s1 is {s1}"); // s1 is foo_bar
```

### Syntax sugar with `+` and `format!`

You can combine strings using `+`, but you need to understand how the ownership will affect the variables. 

```rust
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2;
println!("s1 is {s1}, s2 is {s2}, Value of s3: {s3}");
```

This will throw the following error during compilation

```rust
error[E0382]: borrow of moved value: `s1`
 --> src\main.rs:5:22
  |
2 |     let s1 = String::from("Hello, ");
  |         -- move occurs because `s1` has type `String`, which does not implement the `Copy` trait
3 |     let s2 = String::from("world!");
4 |     let s3 = s1 + &s2;
  |              -- value moved here
5 |     println!("s1 is {s1}, s2 is {s2}, Value of s3: {s3}");
  |                      ^^ value borrowed here after move
  |
```

You can’t have `&str + &str` because both are immutable. So in case you try to concatenate them 

```rust
--> src\main.rs:4:18
  |
4 |     let s3 = &s1 + &s2;
  |              --- ^ --- &String
  |              |   |
  |              |   `+` cannot be used to concatenate two `&str` strings
  |              &String
  |
  = note: string concatenation requires an owned `String` on the left
help: remove the borrow to obtain an owned `String`
  |
4 -     let s3 = &s1 + &s2;
4 +     let s3 = s1 + &s2;
  |
```

So if you use the `+` the ownership will be passed to the new variable. You can also use `format!` to concatenate strings, with the advantage of not having to pass the ownership to the new value

```rust
fn main() {
    let s1 = String::from("tic");
    let s2 = String::from("tac");
    let s3 = String::from("toe");

    let s = format!("{s1}-{s2}-{s3}");
    println!("Value of s is {s}"); // Value of s is tic-tac-toe
	  println!("s1 is {s1}, s2 is {s2}, s3 is {s3}"); // s1 is tic, s2 is tac, s3 is toe
}
```

### Slicing and Iterating

You can’t use `[]` to get a single character from a String but you can use to get a slice of a String with `&var[0..10]`. 

```rust
let text = "a string with some text";
let slice = &text[0..8];
println!("Sliced string is: {slice}"); // Sliced string is a string
```

You can also iterate other the over the string with `.chars()` or `.bytes()`

```rust
let text = "a string with some text";
for c in text.chars() {
    print!("{c}");
}
println!("");
for b in text.bytes() {
    println!("{b}");
}
```

This will output to

```rust
a string with some text
9732115116114105110103321191051161043211511110910132116101120116
```

### UTF-8 and why strings are not so simple.

Rust decided to favour safety over abstracting the complexity. Which makes quite different to work with strings in Rust, so I recommend reading 

[Storing UTF-8 Encoded Text with Strings - The Rust Programming Language](https://doc.rust-lang.org/book/ch08-02-strings.html#indexing-into-strings)

## Hashmaps

HashMaps are to store data based on keys. This is how we can use the HashMap:

```rust
// You need to import from the collections
use std::collections::HashMap;

fn main() {
    // You need to create a mutable HashMap if you 
    // want to add anything to it
    let mut scores = HashMap::new();

    // Inserting the values to the HashMap
    // The key and value must be the same for all values
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

    // Iterating over the HashMap
    for (key, value) in &scores {
        println!("{key}: {value}");
    }
}
```

You can easily retrieve the value from the HashMap:

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

		// get - Retrieve the value from the HashMap, this will give you an Option<&V>
    let blue_score = scores.get("Blue");
    match blue_score {
        Some(blue_score) => println!("Blue score is {blue_score}"),
        None => println!("None"),
    }
    println!("Blue score is {blue_score}"); // Blue score is 10
}
```

There is also some convenient method for common operations 

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);

		// Combine entry and or_insert to insert a value if isn't in the HashMap
    scores.entry(String::from("Red")).or_insert(30);
		let red_score = scores.get("Red");
    match red_score {
        Some(red_score) => println!("Red score is {red_score}"),
        None => println!("None"),
    }

		// You can also update the value in the same way
    let green_score = scores.entry(String::from("Green")).or_insert(20);		
    *green_score += 5;
		let green_score = scores.get("Green");		
    match green_score {
        Some(green_score) => println!("Green score is {green_score}"),
        None => println!("None"),
    }
}
```