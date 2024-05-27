import { type ReactElement } from "react";

import { type task } from "@synnaxlabs/client";
import { List, Synnax, Text } from "@synnaxlabs/pluto";
import { useQuery } from "@tanstack/react-query";

export interface RackOverviewProps {
  rackKey: string;
}

export const RackOverview = (): ReactElement => {};

export interface TaskListProps {
  rackKey: number;
}

export const TaskList = ({ rackKey }: TaskListProps): ReactElement => {
  const client = Synnax.use();

  const { data, isPending } = useQuery({
    queryKey: ["tasks", rackKey],
    queryFn: async () => await client?.hardware.tasks.retrieve(rackKey),
  });

  return (
    <List.List<string, task.Task> data={data}>
      <List.Core<string, task.Task>>{(p) => <TaskListItem {...p} />}</List.Core>
    </List.List>
  );
};

interface TaskListItemProps extends List.ItemProps<string, task.Task> {}

const TaskListItem = (props: TaskListItemProps): ReactElement => {
  const {
    entry: { name },
  } = props;
  return (
    <List.ItemFrame {...props}>
      <Text.Text level="p">{name}</Text.Text>
    </List.ItemFrame>
  );
};
