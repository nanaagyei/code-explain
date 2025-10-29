"""
Tests for the CodeParser service.

Run with: pytest tests/test_parser.py -v
"""
import pytest
from app.services.code_parser import CodeParser


def test_python_function_extraction():
    """Test extracting functions from Python code"""
    code = '''
def calculate_sum(a, b):
    """Calculate sum of two numbers"""
    return a + b

def multiply(x, y):
    return x * y
'''
    
    parser = CodeParser('python')
    result = parser.parse(code)
    
    assert len(result['functions']) == 2
    assert result['functions'][0]['name'] == 'calculate_sum'
    assert result['functions'][0]['params'] == ['a', 'b']
    assert 'Calculate sum' in result['functions'][0]['docstring']
    assert result['functions'][1]['name'] == 'multiply'


def test_python_class_extraction():
    """Test extracting classes from Python code"""
    code = '''
class Calculator:
    def add(self, x, y):
        return x + y
    
    def subtract(self, x, y):
        return x - y

class Advanced(Calculator):
    def power(self, x, y):
        return x ** y
'''
    
    parser = CodeParser('python')
    result = parser.parse(code)
    
    assert len(result['classes']) == 2
    assert result['classes'][0]['name'] == 'Calculator'
    assert result['classes'][1]['name'] == 'Advanced'
    assert 'add' in result['classes'][0]['methods']
    assert 'subtract' in result['classes'][0]['methods']


def test_python_imports():
    """Test extracting imports from Python code"""
    code = '''
import os
import sys
from pathlib import Path
from typing import List, Dict
'''
    
    parser = CodeParser('python')
    result = parser.parse(code)
    
    assert len(result['imports']) == 4
    assert 'import os' in result['imports']
    assert 'from pathlib import Path' in result['imports']


def test_python_complexity():
    """Test cyclomatic complexity calculation"""
    simple_code = '''
def simple():
    return 1
'''
    
    complex_code = '''
def complex_function(x):
    if x > 0:
        for i in range(x):
            if i % 2 == 0:
                print(i)
    else:
        while x < 0:
            x += 1
    return x
'''
    
    simple_parser = CodeParser('python')
    simple_result = simple_parser.parse(simple_code)
    
    complex_parser = CodeParser('python')
    complex_result = complex_parser.parse(complex_code)
    
    # Complex code should have higher complexity
    assert complex_result['complexity'] > simple_result['complexity']
    assert simple_result['complexity'] >= 1
    assert complex_result['complexity'] > 3


def test_javascript_function_extraction():
    """Test extracting functions from JavaScript code"""
    code = '''
function greet(name) {
    return `Hello, ${name}!`;
}

const add = (a, b) => {
    return a + b;
};

function multiply(x, y) {
    return x * y;
}
'''
    
    parser = CodeParser('javascript')
    result = parser.parse(code)
    
    assert len(result['functions']) >= 2  # At least regular functions
    
    # Check that we found the named functions
    function_names = [f['name'] for f in result['functions']]
    assert 'greet' in function_names
    assert 'multiply' in function_names


def test_javascript_class_extraction():
    """Test extracting classes from JavaScript code"""
    code = '''
class Person {
    constructor(name) {
        this.name = name;
    }
    
    greet() {
        return `Hello, I'm ${this.name}`;
    }
}

class Student extends Person {
    constructor(name, grade) {
        super(name);
        this.grade = grade;
    }
}
'''
    
    parser = CodeParser('javascript')
    result = parser.parse(code)
    
    assert len(result['classes']) == 2
    assert result['classes'][0]['name'] == 'Person'
    assert result['classes'][1]['name'] == 'Student'


def test_javascript_imports():
    """Test extracting imports from JavaScript code"""
    code = '''
import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
'''
    
    parser = CodeParser('javascript')
    result = parser.parse(code)
    
    assert len(result['imports']) == 3


def test_code_hash():
    """Test content hashing for caching"""
    code1 = "def test(): pass"
    code2 = "def test(): pass"
    code3 = "def test2(): pass"
    
    hash1 = CodeParser.get_content_hash(code1)
    hash2 = CodeParser.get_content_hash(code2)
    hash3 = CodeParser.get_content_hash(code3)
    
    # Same code should produce same hash
    assert hash1 == hash2
    # Different code should produce different hash
    assert hash1 != hash3
    # Hash should be hex string
    assert len(hash1) == 64  # SHA256 produces 64 hex characters


def test_language_detection():
    """Test detecting language from filename"""
    assert CodeParser.detect_language('script.py') == 'python'
    assert CodeParser.detect_language('app.js') == 'javascript'
    assert CodeParser.detect_language('component.jsx') == 'javascript'
    assert CodeParser.detect_language('unknown.txt') is None


def test_summary_statistics():
    """Test code summary statistics"""
    code = '''
def example():
    x = 1
    y = 2
    return x + y
'''
    
    parser = CodeParser('python')
    result = parser.parse(code)
    
    summary = result['summary']
    assert 'total_lines' in summary
    assert 'non_empty_lines' in summary
    assert 'node_count' in summary
    assert 'max_depth' in summary
    assert summary['total_lines'] > 0
    assert summary['node_count'] > 0


def test_unsupported_language():
    """Test that unsupported languages raise error"""
    with pytest.raises(ValueError) as exc_info:
        CodeParser('ruby')
    
    assert 'Unsupported language' in str(exc_info.value)


def test_empty_code():
    """Test parsing empty or minimal code"""
    code = ""
    
    parser = CodeParser('python')
    result = parser.parse(code)
    
    # Should not crash, should return empty structures
    assert isinstance(result['functions'], list)
    assert isinstance(result['classes'], list)
    assert isinstance(result['imports'], list)
    assert result['complexity'] >= 1
