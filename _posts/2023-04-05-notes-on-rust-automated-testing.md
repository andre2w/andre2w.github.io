---
layout: post
asset-type: post
title: "Notes on Rust: Automated Testing"
date: 2023-04-05 00:00:00 +00:00
author: André Guelfi Torres
tags:
    - rust
    - notes on rust
---

Rust already comes with its own test runner and syntax for testing. Adding tests 

```rust
pub fn add(left: usize, right: usize) -> usize {
    left + right
}

#[cfg(test)] // Tell the compiler this is a test module
mod tests {
    use super::*; // Use all the public functions in the file

    #[test] // Tell the compiler the function is a test
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }

		#[test]
    fn it_fails() {
        let result = add(2, 2);
        assert_eq!(result, 5);
    }
}
```

The `#[test]` annotation makes the compiler understand that the function is a test. The verification is done by the `assert_eq!` macro. 

You run the tests with `cargo test` and the results for the test will be printed 

```rust
⟩ cargo test
   Compiling adder v0.1.0 (adder)
    Finished test [unoptimized + debuginfo] target(s) in 0.15s
     Running unittests src/lib.rs (target/debug/deps/adder-96bda0c2404f749c)

running 2 tests
test tests::it_works ... ok // Shows the test name and result
test tests::it_fails ... FAILED

failures:

// The failures with a readable way 
---- tests::it_fails stdout ----
thread 'tests::it_fails' panicked at 'assertion failed: `(left == right)`
  left: `4`,
 right: `5`', src/lib.rs:18:9
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

failures:
    tests::it_fails

// All test results 
test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

We have the following assertions for rust:

- `assert!`: Asserts that the result is true
- `assert_eq!`: Asserts that two values are the same
- `assert_ne!`: Asserts that two values are not equals

In case you want nice error messages for your own types, you will need to implement `PartialEq` and `Debug` traits to it. Which is usually straightforward using `#[derive(PartialEq, Debug)]` annotation. 

The assert methods also accepts custom error messages as a parameter

```rust
#[test]
fn smaller_cant_hold_larger() {
    let big_rec = Rectangle {
        width: 10,
        height: 10,
    };
    let small_rec = Rectangle {
        width: 5,
        height: 5,
    };
		assert!(&small_rec.can_hold(&big_rec), "{:?} can't fit {:?}", small_rec, big_rec);
}

#[test]
fn it_fails() {
    let result = add(2, 2);
    assert_eq!(result, 5, "The result is supposed to be 4");
}
```

This would have the following messages:

```rust
running 4 tests
test tests::larger_can_hold_smaller ... ok
test tests::it_works ... ok
test tests::smaller_cant_hold_larger ... FAILED
test tests::it_fails ... FAILED

failures:

---- tests::smaller_cant_hold_larger stdout ----
thread 'tests::smaller_cant_hold_larger' panicked at 'Rectangle { width: 5, height: 5 } can't fit Rectangle { width: 10, height: 10 }', src/lib.rs:50:9

---- tests::it_fails stdout ----
thread 'tests::it_fails' panicked at 'assertion failed: `(left == right)`
  left: `4`,
 right: `5`: The result is supposed to be 4', src/lib.rs:56:9
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

failures:
    tests::it_fails
    tests::smaller_cant_hold_larger

test result: FAILED. 2 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

Finally we can check if a test should panic with `should_panic`. This case is a bit different, it isn’t a macro but an annotation. So we create a method that will panic

```rust
fn is_squared(&self) -> bool {
    if (self.height != self.width) {
        panic!("This is a quare not a rectangle");
    }
    return true;
}
```

An then we can write the test

```rust
#[test]
#[should_panic(expected = "This is a square not a rectangle")]
fn is_rectangle_square() {
    let rec = Rectangle { 
        width: 10, 
        height: 10 
    };

    rec.is_squared();
}
```

When running the tests, it will show as `ok` and that the test should panic

```rust
running 5 tests
test tests::is_rectangle_square - should panic ... FAILED
test tests::it_works ... ok
test tests::larger_can_hold_smaller ... ok
test tests::smaller_cant_hold_larger ... FAILED
test tests::it_fails ... FAILED

failures:

---- tests::is_rectangle_square stdout ----
note: test did not panic as expected
---- tests::smaller_cant_hold_larger stdout ----
thread 'tests::smaller_cant_hold_larger' panicked at 'Rectangle { width: 5, height: 5 } can't fit Rectangle { width: 10, height: 10 }', src/lib.rs:57:9

---- tests::it_fails stdout ----
thread 'tests::it_fails' panicked at 'assertion failed: `(left == right)`
  left: `4`,
 right: `5`: The result is supposed to be 4', src/lib.rs:63:9
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

failures:
    tests::is_rectangle_square
    tests::it_fails
    tests::smaller_cant_hold_larger

test result: FAILED. 2 passed; 3 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

## Controlling the test runner

The tests are executed in parallel, so if you have multiple tests that works on the same issue you might have problems. To control that you can use `--test-threads` to pass then number of threads you want to use.

The test runner will also capture all the output to `stdout` and it will only print if the test fails. To get the entire output you need the `--show-output` flag. 

Running a test by name is easy by just passing the tests’ name. 

```rust
⟩ cargo test larger_can_hold_smaller
   Compiling adder v0.1.0 (adder)
    Finished test [unoptimized + debuginfo] target(s) in 0.20s
     Running unittests src/lib.rs (target/debug/deps/adder-96bda0c2404f749c)

running 1 test
test tests::larger_can_hold_smaller ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 4 filtered out; finished in 0.00s
```

This also works for partial names, finally it’s possible to ignore tests with the `#[ignore]` annotation, and if you want to run the ignored tests you can use `-- --ignored` flag (that’s right `cargo run -- --ignored`) and if you want to run everything `cargo test -- --include-ignored`. 
