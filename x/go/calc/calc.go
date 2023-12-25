// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package calc

import (
	"go/ast"
	"go/token"
	"math"
	"regexp"
	"strconv"

	"github.com/cockroachdb/errors"
	"github.com/synnaxlabs/x/stack"
)

// A dictionary mapping operators to their token
var operatorTokens map[string]token.Token = map[string]token.Token{
	"+": token.ADD,
	"-": token.SUB,
	"*": token.MUL,
	"/": token.QUO,
	"^": token.XOR,
}

var precedence map[string]int = map[string]int{
	"+": 1,
	"-": 1,
	"*": 2,
	"/": 2,
	"(": 0,
	"^": 3,
}

var InvalidExpressionError = errors.New("Invalid expression")

// Expression is a datatype for representing and evaluating mathematical expressions
type Expression struct {
	exp ast.Expr
}

// Resolver is an interface for resolving identifiers in an expression
type Resolver interface {
	Resolve(string) (float64, error)
}

func findTokens(s string) (tokens []string, err error) {
	re, err := regexp.Compile("[0-9]+(\\.[0-9]*)?|[\\w]+|[+\\-*\\/^()]|[><!=]=|[<>]")
	return re.FindAllString(s, -1), err
}

func makeBinaryExpr(output *stack.Stack[interface{}], operators *stack.Stack[string]) error {
	op, _ := operators.Pop()
	Y, err1 := output.Pop()
	X, err2 := output.Pop()
	if err1 != nil || err2 != nil {
		return errors.Wrap(InvalidExpressionError, "Invalid expression: binary operator used with only one operand")
	}
	output.Push(&ast.BinaryExpr{X: X.(ast.Expr), Op: operatorTokens[op], Y: Y.(ast.Expr)})
	return nil
}

// Build builds an AST from a string
func (e *Expression) Build(s string) error {
	tokens, tokenError := findTokens(s)
	if tokenError != nil {
		return errors.Wrap(InvalidExpressionError, "Invalid expression: invalid token")
	}
	output := stack.Stack[interface{}]{}
	operators := stack.Stack[string]{}
	//	Use shunting-yard algorithm
	for i := 0; i < len(tokens); i++ {
		t := tokens[i]
		switch t {
		case "-":
			var tokenInDict bool
			if i > 0 {
				_, tokenInDict = precedence[tokens[i-1]]
			}
			if i == 0 || (tokenInDict) {
				output.Push(&ast.BasicLit{Kind: token.FLOAT, Value: "-1"})
				operators.Push("*")
			} else {
				for operators.Len() > 0 && precedence[*operators.Peek()] >= precedence[t] {
					if err := makeBinaryExpr(&output, &operators); err != nil {
						return err
					}
				}
				operators.Push(t)
			}
		case "+", "*", "/":
			for operators.Len() > 0 && precedence[*operators.Peek()] >= precedence[t] {
				err := makeBinaryExpr(&output, &operators)
				if err != nil {
					return err
				}
			}
			operators.Push(t)
		case "^":
			for operators.Len() > 0 && precedence[*operators.Peek()] > precedence[t] {
				err := makeBinaryExpr(&output, &operators)
				if err != nil {
					return err
				}
			}
			operators.Push(t)
		case "(":
			operators.Push(t)
		case ")":
			for operators.Len() > 0 && *operators.Peek() != "(" {
				err := makeBinaryExpr(&output, &operators)
				if err != nil {
					return err
				}
			}
			_, err := operators.Pop()
			if err != nil {
				return errors.Wrap(InvalidExpressionError, "Invalid expression: mismatched parentheses")
			}
		default:
			_, err := strconv.ParseFloat(t, 64)
			if err != nil {
				output.Push(&ast.Ident{Name: t})
			} else {
				output.Push(&ast.BasicLit{Kind: token.FLOAT, Value: t})
			}

		}
	}
	for operators.Len() > 0 {
		err := makeBinaryExpr(&output, &operators)
		if err != nil {
			return err
		}
	}
	exp, err := output.Pop()
	if err != nil {
		return err
	}
	e.exp = exp.(ast.Expr)
	return nil
}

// Tree returns the AST of the expression
func (e Expression) Tree() ast.Expr {
	return e.exp
}

// Evaluate evaluates the expression
func (e Expression) Evaluate(r Resolver) float64 {
	return eval(e.exp, r)
}

func eval(exp ast.Expr, r Resolver) float64 {
	switch exp := exp.(type) {
	case *ast.BinaryExpr:
		return evalBinaryExpr(exp, r)
	case *ast.BasicLit:
		switch exp.Kind {
		case token.FLOAT:
			i, _ := strconv.ParseFloat(exp.Value, 64)
			return i
		}
	case *ast.Ident:
		i, _ := r.Resolve(exp.Name)
		return i
	}

	return 0
}

func evalBinaryExpr(exp *ast.BinaryExpr, r Resolver) float64 {
	left := eval(exp.X, r)
	right := eval(exp.Y, r)

	switch exp.Op {
	case token.ADD:
		return left + right
	case token.SUB:
		return left - right
	case token.MUL:
		return left * right
	case token.QUO:
		return left / right
	case token.XOR:
		return math.Pow(left, right)
	}

	return 0
}
