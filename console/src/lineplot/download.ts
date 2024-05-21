import { Synnax, channel, framer } from "@synnaxlabs/client";
import { type Channel } from "@synnaxlabs/pluto";
import { TimeRange, unique } from "@synnaxlabs/x";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

export interface DownloadProps {
  timeRange: TimeRange;
  client: Synnax;
  lines: Channel.LineProps[];
  name?: string;
}

const frameToCSV = (columns: Map<channel.Key, string>, frame: framer.Frame): string => {
  if (frame.series.length === 0) return "";
  const count = frame.series[0].length;
  let rows: string[] = [];
  let header: string[] = [];
  for (let i = 1; i < count; i++) {
    let row: string[] = [];
    columns.forEach((name, key) => {
      const d = frame.get(key).at(i, true);
      if (i === 1) header.push(name);
      row.push(d.toString());
    });
    if (i === 1) rows.push(header.join(","));
    rows.push(row.join(","));
  }
  return rows.join("\n");
};

export const download = ({
  lines,
  client,
  timeRange,
  name = "synnax-data",
}: DownloadProps): void => {
  (async () => {
    let keys = unique(
      lines
        .flatMap((l) => [l.channels.y, l.channels.x])
        .filter((v) => v != null && v != 0),
    ) as channel.Keys;
    const channels = await client.channels.retrieve(keys);
    const indexes = unique(channels.map((c) => c.index));
    keys = unique([...keys, ...indexes]);
    const indexChannels = await client.channels.retrieve(indexes);
    const columns = new Map<channel.Key, string>();
    channels.forEach((c) => {
      columns.set(c.key, lines.find((l) => l.channels.y === c.key)?.label ?? c.name);
    });
    indexChannels.forEach((c) => {
      columns.set(c.key, lines.find((l) => l.channels.x === c.key)?.label ?? c.name);
    });
    const frame = await client.read(timeRange, keys);
    const csv = frameToCSV(columns, frame);
    const savePath = await save({
      defaultPath: `${name}.csv`,
    });
    if (savePath == null) return;
    const data = new TextEncoder().encode(csv);
    await writeFile(savePath, data);
  })().catch(console.error);
};
