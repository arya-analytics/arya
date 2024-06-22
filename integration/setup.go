package main

import (
	"bytes"
	"fmt"
	"os/exec"
	"strconv"

	"github.com/synnaxlabs/x/errors"
)

type SetUpParam struct {
	IndexChannels int    `json:"index_channels"`
	DataChannels  int    `json:"data_channels"`
	Client        string `json:"client"`
}

func runSetUp(param SetUpParam) error {
	if param == (SetUpParam{}) {
		fmt.Printf("--cannot find setup configuration, skipping\n")
	}

	fmt.Printf("--setting up\n")
	switch param.Client {
	case "py":
		return setUpPython(param)
	default:
		panic("unrecognized client in setup")
	}
	return nil
}

func setUpPython(param SetUpParam) error {
	if err := exec.Command("cd", "py", "&&", "poetry", "install").Run(); err != nil {
		return err
	}
	cmd := exec.Command("poetry", "run", "python", "setup.py",
		strconv.Itoa(param.IndexChannels),
		strconv.Itoa(param.DataChannels),
	)

	cmd.Dir = "./py"
	var stderr, stdout bytes.Buffer
	cmd.Stderr = &stderr
	cmd.Stdout = &stdout

	if err := cmd.Run(); err != nil {
		return errors.Newf("err: %s\nstderr: %s\nstdout: %s", err.Error(), stderr.String(), stdout.String())
	}
	return nil
}
