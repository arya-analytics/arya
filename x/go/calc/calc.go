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
	"errors"
	"go/ast"
	"go/token"

	"github.com/synnaxlabs/x/queue"
	"github.com/synnaxlabs/x/stack"
)

type Expression struct {
	exp ast.Expr
}

func findTokens(s string) ([]string, error) {
	tokens := []string{}
	currToken := ""
	for i, c := range s {
		if c == ' ' {
			if currToken != "" {
				return tokens, errors.New("Invalid expression")
			}
			continue
		}
		//	Check if token is a negative number
		if c == '-' && (i == 0 || tokens[i-1] == "(" || tokens[i-1] == "+" || tokens[i-1] == "-" || tokens[i-1] == "*" || tokens[i-1] == "/" || tokens[i-1] == "^") {
			currToken += string(c)
		} else if c == '+' || c == '-' || c == '*' || c == '/' || c == '(' || c == ')' {
			if currToken != "" {
				tokens = append(tokens, currToken)
				currToken = ""
			}
			tokens = append(tokens, string(c))
		} else {
			currToken += string(c)
		}
	}
	if currToken != "" {
		tokens = append(tokens, currToken)
	}
	return tokens, nil
}

// Given a string representing a valid mathematical expression, sets exp to the
// parsed expression
func (e *Expression) Build(s string) error {
	tokens, err := findTokens(s)
	if err != nil {
		return err
	}
	//	Uses the shunting yard algorithm to create an ast
	precedence := map[string]int{
		"+": 1,
		"-": 1,
		"*": 2,
		"/": 2,
		"(": 0,
		"^": 3,
	}
	tokensDict := map[string]token.Token{
		"+": token.ADD,
		"-": token.SUB,
		"*": token.MUL,
		"/": token.QUO,
		"^": token.XOR,
	}
	output := stack.Stack[interface{}]{}
	operators := queue.Queue[string]{}

	for _, t := range tokens {
		switch t {
		case "+", "-", "*", "/":
			for operators.Len() > 0 && precedence[*operators.Peek()] >= precedence[t] {
				op, err := operators.Pop()
				if err != nil {
					return err
				}
				X, err1 := output.Pop()
				Y, err2 := output.Pop()
				if err1 != nil || err2 != nil {
					return errors.New("Invalid expression")
				}
				output.Push(&ast.BinaryExpr{X: X.(ast.Expr), Op: tokensDict[op], Y: Y.(ast.Expr)})
			}
		case "^":
			for operators.Len() > 0 && precedence[*operators.Peek()] > precedence[t] {
				op, err := operators.Pop()
				if err != nil {
					return err
				}
				X, err1 := output.Pop()
				Y, err2 := output.Pop()
				if err1 != nil || err2 != nil {
					return errors.New("Invalid expression")
				}
				output.Push(&ast.BinaryExpr{X: X.(ast.Expr), Op: tokensDict[op], Y: Y.(ast.Expr)})
			}
		case "(":
			operators.Push(t)
		case ")":
			for operators.Len() > 0 && *operators.Peek() != "(" {
				op, err := operators.Pop()
				if err != nil {
					return err
				}
				X, err1 := output.Pop()
				Y, err2 := output.Pop()
				if err1 != nil || err2 != nil {
					return errors.New("Invalid expression")
				}
				output.Push(&ast.BinaryExpr{X: X.(ast.Expr), Op: tokensDict[op], Y: Y.(ast.Expr)})
			}
		default:
			output.Push(&ast.BasicLit{Kind: token.STRING, Value: t})
		}
	}
	return errors.New("Invalid expression")
}
