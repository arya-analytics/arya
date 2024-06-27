package main

import (
	"context"
	"fmt"
)

type SetUpParam struct {
	IndexChannels int    `json:"index_channels"`
	DataChannels  int    `json:"data_channels"`
	Client        string `json:"client"`
}

func (p SetUpParam) serialize() []string {
	return []string{}
}

func (p SetUpParam) ToPythonCommand(_ string) string {
	if p == (SetUpParam{}) {
		return ""
	}

	return fmt.Sprintf(
		"poetry run python setup.py %d %d",
		p.IndexChannels,
		p.DataChannels,
	)
}

func (p SetUpParam) ToTSCommand(_ string) string {
	if p == (SetUpParam{}) {
		return ""
	}

	return fmt.Sprintf(
		"npx tsx setup.ts %d %d",
		p.IndexChannels,
		p.DataChannels,
	)
}

var _ NodeParams = &SetUpParam{}

func runSetUp(param SetUpParam) error {
	if param == (SetUpParam{}) {
		fmt.Printf("--cannot find setup configuration, skipping\n")
	}

	fmt.Printf("--setting up\n")
	switch param.Client {
	case "py":
		return testPython(context.Background(), param, "setup")
	case "ts":
		return testTS(context.Background(), param, "setup")
	default:
		panic("unrecognized client in setup")
	}
}
