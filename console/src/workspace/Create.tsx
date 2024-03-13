// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { type ReactElement } from "react";

import { Align, Button, Form, Nav, Synnax } from "@synnaxlabs/pluto";
import { Input } from "@synnaxlabs/pluto/input";
import { type UnknownRecord } from "@synnaxlabs/x";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { z } from "zod";

import { Layout } from "@/layout";
import { type SliceState } from "@/layout/slice";
import { useSelectActiveKey } from "@/workspace/selectors";
import { add } from "@/workspace/slice";

export const createWindowLayout = (
  name: string = "Create Workspace",
): Layout.LayoutState => ({
  key: "createWorkspace",
  type: "createWorkspace",
  windowKey: "createWorkspace",
  name,
  location: "window",
  window: {
    resizable: false,
    size: { height: 225, width: 625 },
    navTop: true,
    transparent: true,
  },
});

const formSchema = z.object({
  name: z.string().min(1, { message: "Workspace must hav a name" }),
});

export const Create = ({ onClose }: Layout.RendererProps): ReactElement => {
  const methods = Form.use({
    values: {
      name: "",
    },
    schema: formSchema,
  });

  const client = Synnax.use();
  const dispatch = useDispatch();
  const active = useSelectActiveKey();

  const { mutate, isPending } = useMutation({
    mutationKey: [],
    mutationFn: async () => {
      if (methods.validate() || client == null) return;
      const { name } = methods.value();
      const ws = await client.workspaces.create({
        name,
        layout: Layout.ZERO_SLICE_STATE as unknown as UnknownRecord,
      });
      dispatch(add({ workspaces: [ws] }));
      if (active != null)
        dispatch(Layout.setWorkspace({ slice: ws.layout as unknown as SliceState }));
      onClose();
    },
  });

  return (
    <Align.Space style={{ height: "100%" }}>
      <Align.Space justify="center" grow>
        <Form.Form {...methods}>
          <Form.Field<string> path="name">
            {(p) => (
              <Input.Text
                placeholder="Workspace Name"
                variant="natural"
                autoFocus
                level="h3"
                {...p}
              />
            )}
          </Form.Field>
        </Form.Form>
      </Align.Space>
      <Nav.Bar location="bottom" size={48}>
        <Nav.Bar.End style={{ padding: "1rem" }}>
          <Button.Button
            type="submit"
            form="create-workspace"
            loading={isPending}
            disabled={isPending}
            onClick={() => mutate()}
          >
            Save
          </Button.Button>
        </Nav.Bar.End>
      </Nav.Bar>
    </Align.Space>
  );
};
