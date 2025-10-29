"""
Tests for multi-language parser support.

Tests parsing of: Python, JavaScript, TypeScript, Java, C, C++, Go, Rust

Run with: pytest tests/test_multilang_parser.py -v
"""
import pytest
from app.services.code_parser import CodeParser


class TestTypeScriptParser:
    """Tests for TypeScript parser"""
    
    def test_typescript_functions(self):
        code = '''
function greet(name: string): string {
    return `Hello, ${name}`;
}

const add = (a: number, b: number): number => {
    return a + b;
};
'''
        parser = CodeParser('typescript')
        result = parser.parse(code)
        
        assert len(result['functions']) >= 1
        function_names = [f['name'] for f in result['functions']]
        assert 'greet' in function_names
    
    def test_typescript_classes(self):
        code = '''
class Person {
    private name: string;
    
    constructor(name: string) {
        this.name = name;
    }
    
    greet(): string {
        return `Hello, I'm ${this.name}`;
    }
}
'''
        parser = CodeParser('typescript')
        result = parser.parse(code)
        
        assert len(result['classes']) == 1
        assert result['classes'][0]['name'] == 'Person'


class TestJavaParser:
    """Tests for Java parser"""
    
    def test_java_methods(self):
        code = '''
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
    
    public int multiply(int x, int y) {
        return x * y;
    }
}
'''
        parser = CodeParser('java')
        result = parser.parse(code)
        
        # Java methods are captured
        assert len(result['functions']) >= 2
        method_names = [f['name'] for f in result['functions']]
        assert 'add' in method_names
        assert 'multiply' in method_names
    
    def test_java_classes(self):
        code = '''
public class Animal {
    private String name;
    
    public Animal(String name) {
        this.name = name;
    }
}

class Dog extends Animal {
    public void bark() {
        System.out.println("Woof!");
    }
}
'''
        parser = CodeParser('java')
        result = parser.parse(code)
        
        assert len(result['classes']) == 2
        class_names = [c['name'] for c in result['classes']]
        assert 'Animal' in class_names
        assert 'Dog' in class_names
    
    def test_java_imports(self):
        code = '''
import java.util.List;
import java.util.ArrayList;
import java.io.File;
'''
        parser = CodeParser('java')
        result = parser.parse(code)
        
        assert len(result['imports']) == 3


class TestCParser:
    """Tests for C parser"""
    
    def test_c_functions(self):
        code = '''
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

void print_hello() {
    printf("Hello, World!\\n");
}
'''
        parser = CodeParser('c')
        result = parser.parse(code)
        
        assert len(result['functions']) >= 2
        function_names = [f['name'] for f in result['functions']]
        assert 'add' in function_names
        assert 'print_hello' in function_names
    
    def test_c_structs(self):
        code = '''
struct Point {
    int x;
    int y;
};

struct Rectangle {
    struct Point top_left;
    struct Point bottom_right;
};
'''
        parser = CodeParser('c')
        result = parser.parse(code)
        
        # Structs should be captured as classes
        assert len(result['classes']) >= 2
    
    def test_c_includes(self):
        code = '''
#include <stdio.h>
#include <stdlib.h>
#include "myheader.h"
'''
        parser = CodeParser('c')
        result = parser.parse(code)
        
        assert len(result['imports']) == 3


class TestCppParser:
    """Tests for C++ parser"""
    
    def test_cpp_functions(self):
        code = '''
#include <iostream>

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

template<typename T>
T maximum(T a, T b) {
    return (a > b) ? a : b;
}
'''
        parser = CodeParser('cpp')
        result = parser.parse(code)
        
        assert len(result['functions']) >= 1
        function_names = [f['name'] for f in result['functions']]
        assert 'factorial' in function_names
    
    def test_cpp_classes(self):
        code = '''
class Shape {
public:
    virtual double area() = 0;
    virtual ~Shape() {}
};

class Circle : public Shape {
private:
    double radius;
    
public:
    Circle(double r) : radius(r) {}
    
    double area() override {
        return 3.14159 * radius * radius;
    }
};
'''
        parser = CodeParser('cpp')
        result = parser.parse(code)
        
        assert len(result['classes']) >= 2
        class_names = [c['name'] for c in result['classes']]
        assert 'Shape' in class_names
        assert 'Circle' in class_names


class TestGoParser:
    """Tests for Go parser"""
    
    def test_go_functions(self):
        code = '''
package main

import "fmt"

func add(a int, b int) int {
    return a + b
}

func greet(name string) {
    fmt.Printf("Hello, %s!\\n", name)
}
'''
        parser = CodeParser('go')
        result = parser.parse(code)
        
        assert len(result['functions']) >= 2
        function_names = [f['name'] for f in result['functions']]
        assert 'add' in function_names
        assert 'greet' in function_names
    
    def test_go_structs(self):
        code = '''
type Person struct {
    Name string
    Age  int
}

type Employee struct {
    Person
    ID     int
    Salary float64
}
'''
        parser = CodeParser('go')
        result = parser.parse(code)
        
        # Go type declarations should be captured
        assert len(result['classes']) >= 2
    
    def test_go_imports(self):
        code = '''
import "fmt"
import "os"
import (
    "io"
    "strings"
)
'''
        parser = CodeParser('go')
        result = parser.parse(code)
        
        assert len(result['imports']) >= 2


class TestRustParser:
    """Tests for Rust parser"""
    
    def test_rust_functions(self):
        code = '''
fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
'''
        parser = CodeParser('rust')
        result = parser.parse(code)
        
        assert len(result['functions']) >= 2
        function_names = [f['name'] for f in result['functions']]
        assert 'fibonacci' in function_names
        assert 'add' in function_names
    
    def test_rust_structs(self):
        code = '''
struct Point {
    x: f64,
    y: f64,
}

enum Color {
    Red,
    Green,
    Blue,
}

impl Point {
    fn new(x: f64, y: f64) -> Point {
        Point { x, y }
    }
}
'''
        parser = CodeParser('rust')
        result = parser.parse(code)
        
        # Structs, enums, and impls should be captured
        assert len(result['classes']) >= 3
    
    def test_rust_uses(self):
        code = '''
use std::collections::HashMap;
use std::io;
use std::fs::File;
'''
        parser = CodeParser('rust')
        result = parser.parse(code)
        
        assert len(result['imports']) == 3


class TestLanguageDetection:
    """Test automatic language detection from filenames"""
    
    def test_all_extensions(self):
        test_cases = [
            ('script.py', 'python'),
            ('app.js', 'javascript'),
            ('component.jsx', 'javascript'),
            ('module.ts', 'typescript'),
            ('component.tsx', 'typescript'),
            ('Main.java', 'java'),
            ('program.c', 'c'),
            ('header.h', 'c'),
            ('class.cpp', 'cpp'),
            ('template.hpp', 'cpp'),
            ('main.go', 'go'),
            ('lib.rs', 'rust'),
        ]
        
        for filename, expected_lang in test_cases:
            detected = CodeParser.detect_language(filename)
            assert detected == expected_lang, f"Failed for {filename}: expected {expected_lang}, got {detected}"


class TestComplexityAcrossLanguages:
    """Test complexity calculation works across all languages"""
    
    def test_python_complexity(self):
        code = '''
def complex_func(x):
    if x > 0:
        for i in range(x):
            if i % 2 == 0:
                print(i)
        return x
    return 0
'''
        parser = CodeParser('python')
        result = parser.parse(code)
        assert result['complexity'] > 2
    
    def test_java_complexity(self):
        code = '''
public class Test {
    public int process(int n) {
        if (n > 10) {
            for (int i = 0; i < n; i++) {
                if (i % 2 == 0) {
                    return i;
                }
            }
        }
        return 0;
    }
}
'''
        parser = CodeParser('java')
        result = parser.parse(code)
        assert result['complexity'] > 2
    
    def test_rust_complexity(self):
        code = '''
fn process(n: i32) -> i32 {
    if n > 10 {
        for i in 0..n {
            if i % 2 == 0 {
                return i;
            }
        }
    }
    0
}
'''
        parser = CodeParser('rust')
        result = parser.parse(code)
        assert result['complexity'] > 2
