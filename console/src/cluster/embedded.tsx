// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { Drift } from "@synnaxlabs/drift";
import { useAsyncWindowLifecycle, useSelectWindowKey } from "@synnaxlabs/drift/react";
import { Icon } from "@synnaxlabs/media";
import {
  Align,
  Button,
  Header,
  Input,
  Status,
  Text,
  useAsyncEffect,
  useSyncedRef,
} from "@synnaxlabs/pluto";
import { caseconv, type Destructor, observe, TimeStamp } from "@synnaxlabs/x";
import {
  Child,
  Command,
  type CommandEvents,
  type EventEmitter,
} from "@tauri-apps/plugin-shell";
import {
  createContext,
  type PropsWithChildren,
  type ReactElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import { useSelectLocalState } from "@/cluster/selectors";
import {
  LOCAL,
  LOCAL_PROPS,
  type LocalState,
  set,
  setActive,
  setLocalState,
} from "@/cluster/slice";
import { testConnection } from "@/cluster/testConnection";
import { type Layout } from "@/layout";

interface LogMessage {
  level: string;
  msg: string;
  ts: number;
  error: string;
}

const parseLogMessage = (v: string): LogMessage | null => {
  try {
    const log = JSON.parse(v);
    return log;
  } catch {
    console.warn("Failed to parse log", v);
    return null;
  }
};

// The name of the sidecar binary.
const BINARY_NAME = "bin/sy";
export const LOCAL_KEY = "local";

export const useLocalServer = (): void => {
  const win = useSelectWindowKey();

  const d = useDispatch();
  const { pid, command } = useSelectLocalState();
  const status = Status.useAggregator();
  const pidRef = useSyncedRef(pid);
  const addLog = useContext(EmbeddedLogsContext).addLog;
  const commandRef = useRef<EventEmitter<CommandEvents> | null>(null);

  const startLocalServer = async (): Promise<void> => {
    if (win !== Drift.MAIN_WINDOW) return;
    if (commandRef.current != null) {
      commandRef.current.removeAllListeners();
      commandRef.current = null;
    }
    // The only case where we'll run into a stranded PID is if the user closes the
    // application or hard reloads the page. This means that we only need to kill
    // stranded PIDs on application load, so we don't pass the PID in as a dependency.
    if (pid !== 0) {
      console.log("Killing stranded local server", pid);
      const child = new Child(pid);
      child.kill();
    }

    const command = Command.sidecar(BINARY_NAME, ["start", "-vmi"]);
    commandRef.current = command;

    const handleLog = (v: string): void => {
      const log = parseLogMessage(v);
      if (log == null) return;
      addLog(log);
      const { level, msg, error } = log;

      const isInfo = level === "info";
      // This means the server has booted up.
      if (isInfo && msg === "starting server")
        // Set the PID in local state so we can kill it later fi we need to.

        // Test the connection to the local server.
        testConnection(LOCAL_PROPS)
          .then(() => {
            d(set(LOCAL));
            d(setLocalState({ pid: serverProcess.pid, status: "running" }));
            d(setActive(LOCAL_KEY));
          })
          .catch(console.error);
      else if (isInfo && msg === "shutdown successful")
        // If the server has shut down, we'll set the PID to 0.
        d(setLocalState({ pid: 0, status: "stopped" }));

      // If the server fails to boot up, we'll get a fatal error.
      if (level === "fatal")
        status({
          time: TimeStamp.now(),
          variant: "error",
          message: error,
          key: "local-server",
        });
    };

    const handleClose = (): void => {
      d(setLocalState({ pid: 0, status: "stopped" }));
    };

    command.stderr.on("data", handleLog);
    command.on("close", handleClose);
    const serverProcess = await command.spawn();

    d(setLocalState({ pid: serverProcess.pid, status: "starting" }));
  };

  const stopLocalServer = useCallback(async (): Promise<void> => {
    if (pidRef.current === 0) return;
    d(setLocalState({ pid, status: "stopping" }));
    const serverProcess = new Child(pidRef.current);
    await serverProcess.write("stop\n");
    d(setActive(null));
  }, []);

  useAsyncEffect(async () => {
    if (win !== Drift.MAIN_WINDOW) return;
    if (command === "start") return await startLocalServer();
    if (command === "stop") return await stopLocalServer();
  }, [win, command]);

  useAsyncWindowLifecycle(async () => async () => await stopLocalServer());

  useEffect(() => {
    d(setLocalState({ command: "start" }));
  }, []);
};

export interface LogsContextValue {
  subscribeToLogs: (v: (v: LogMessage) => void) => [LogMessage[], Destructor];
  getLogs: () => LogMessage[];
  addLog: (v: LogMessage) => void;
}

export const EmbeddedLogsContext = createContext<LogsContextValue>({
  subscribeToLogs: () => [[], () => {}],
  getLogs: () => [],
  addLog: () => {},
});

interface EmbeddedLogsProviderProps extends PropsWithChildren<{}> {}

export const EmbeddedLogsProvider = ({ children }: EmbeddedLogsProviderProps) => {
  const logsRef = useRef<LogMessage[]>([]);
  const obsRev = useRef<observe.Observer<LogMessage>>(new observe.Observer());

  const addLog = (v: LogMessage): void => {
    logsRef.current.push(v);
    obsRev.current.notify(v);
  };

  const subscribeToLogs = (v: (v: LogMessage) => void): [LogMessage[], Destructor] => {
    const logs = logsRef.current;
    const d = obsRev.current.onChange(v);
    return [logs, d];
  };

  const getLogs = (): LogMessage[] => logsRef.current;

  return (
    <EmbeddedLogsContext.Provider value={{ addLog, subscribeToLogs, getLogs }}>
      {children}
    </EmbeddedLogsContext.Provider>
  );
};

export const EMBEDDED_CONTROLS_LAYOUT_TYPE = "embeddedControls";

export const embeddedControlsLayout: Layout.State = {
  key: "embedded-controls",
  type: "embeddedControls",
  name: "Embedded Controls",
  icon: "Cluster",
  windowKey: "embedded",
  location: "modal",
  window: {
    navTop: true,
    size: {
      width: 800,
      height: 500,
    },
  },
};

const STATUS_MAP: Record<LocalState["status"], Status.Variant> = {
  running: "success",
  stopped: "error",
  stopping: "warning",
  starting: "warning",
};

const ICON_MAP: Record<LocalState["status"], ReactElement> = {
  running: <Icon.Pause />,
  stopped: <Icon.Play />,
  stopping: <Icon.Loading />,
  starting: <Icon.Loading />,
};

const LEVEL_COLORS: Record<string, string> = {
  info: "var(--pluto-gray-l8)",
  error: "var(--pluto-error-z)",
  fatal: "var(--pluto-error-z)",
  warn: "var(--pluto-warning-m1)",
};

const logElement = (v: LogMessage): ReactElement => {
  const { level, msg, ts, error } = v;
  return (
    <Align.Space direction="x" size="small">
      <Text.Text level="p" noWrap shade={7} style={{ width: 90, flexShrink: 0 }}>
        {TimeStamp.seconds(ts).fString("preciseTime")}{" "}
      </Text.Text>
      <Text.Text
        level="p"
        color={LEVEL_COLORS[level]}
        style={{ width: 50, flexShrink: 0 }}
      >
        {level.toUpperCase()}
      </Text.Text>{" "}
      <Text.Text level="p" style={{ flexGrow: 0 }}>
        {caseconv.capitalize(msg)} {error}
      </Text.Text>
    </Align.Space>
  );
};

export const EmbeddedControls: Layout.Renderer = () => {
  const [logs, setLogs] = useState<ReactElement[]>([]);
  const d = useDispatch();
  const { status, pid } = useSelectLocalState();
  const { subscribeToLogs, getLogs } = useContext(EmbeddedLogsContext);
  const addStatus = Status.useAggregator();
  useEffect(() => {
    const [logs, d] = subscribeToLogs((v) => {
      const log = logElement(v);
      if (log != null)
        setLogs((logs) => {
          const newLogs = [log, ...logs];
          return newLogs.slice(0, 100);
        });
    });
    setLogs(
      logs
        .map(logElement)
        .filter((v) => v != null)
        .reverse(),
    );
    return d;
  }, []);
  const handleCommand = () => {
    d(setLocalState({ command: status == "running" ? "stop" : "start" }));
  };

  return (
    <Align.Space direction="y" style={{ padding: "3rem" }} size="large">
      <Text.Text level="h3" weight={450}>
        Embedded Cluster
      </Text.Text>
      <Align.Space
        direction="x"
        grow
        justify="spaceBetween"
        style={{ padding: "0 1rem" }}
      >
        <Align.Space direction="x" size="large">
          <Input.Item label="Status">
            <Status.Text variant={STATUS_MAP[status]} level="p" style={{ width: 80 }}>
              {caseconv.capitalize(status)}
            </Status.Text>
          </Input.Item>
          <Input.Item label="PID">
            <Text.Text level="p">{pid}</Text.Text>
          </Input.Item>
        </Align.Space>
        <Button.Button
          variant="outlined"
          disabled={status == "starting" || status == "stopping"}
          startIcon={ICON_MAP[status]}
          onClick={handleCommand}
          iconSpacing="medium"
        >
          {status == "running" ? "Stop" : "Start"}
        </Button.Button>
      </Align.Space>
      <Align.Space
        direction="y"
        rounded
        bordered
        background={1}
        empty
        style={{ overflow: "hidden" }}
      >
        <Header.Header level="h5">
          <Header.Title>Logs</Header.Title>
          <Header.Actions>
            {[
              {
                children: <Icon.Copy />,
                onClick: () => {
                  navigator.clipboard.writeText(
                    getLogs()
                      .map((v) => JSON.stringify(v))
                      .join("\n"),
                  );
                  addStatus({
                    variant: "info",
                    message: "Logs copied to clipboard",
                  });
                },
              },
            ]}
          </Header.Actions>
        </Header.Header>
        <Align.Space
          direction="y"
          style={{
            overflowY: "auto",
            overflowX: "hidden",
            padding: "2rem",
            height: "100%",
          }}
          empty
        >
          {logs}
        </Align.Space>
      </Align.Space>
    </Align.Space>
  );
};
