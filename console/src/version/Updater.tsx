import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useEffect } from "react";
import { TimeSpan, TimeStamp } from "@synnaxlabs/x";
import { Align, Button, Dropdown, Status } from "@synnaxlabs/pluto";
import { NotificationAdapter } from "@/notifications/Notifications";

export const useCheckForUpdates = () => {
  const addStatus = Status.useAggregator();
  // useEffect(() => {
  //   const i = setInterval(async () => {
  //     const update = await check();
  //     addStatus({
  //       key: "update",
  //       variant: "info",
  //       message: `Update available: ${update != null}`,
  //     });
  //   }, TimeSpan.seconds(5).milliseconds);
  //   return () => clearInterval(i);
  // }, []);
};

export const notificationAdapter: NotificationAdapter = (status) => {
  if (!status.key.startsWith("update")) return null;
  return {
    ...status,
    actions: [
      {
        variant: "outlined",
        children: "Update & Restart",
        onClick: () => {
          void (async () => {
            const update = await check();
            if (update?.available !== true) return;
            await update.downloadAndInstall();
            await relaunch();
          })();
        },
      },
    ],
  };
};

const Modal = () => {
  const dropProps = Dropdown.use();
  return (
    <Dropdown.Dialog {...dropProps} variant="modal" keepMounted={false}>
      <Button.Button variant="outlined" size="small">
        Update & Restart
      </Button.Button>
      <Align.Space direction="x"></Align.Space>
    </Dropdown.Dialog>
  );
};

const ModalContent = () => {};
