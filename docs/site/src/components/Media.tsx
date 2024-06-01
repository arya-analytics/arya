// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import {
  useEffect,
  useRef,
  useState,
  type DetailedHTMLProps,
  type ReactElement,
} from "react";

import { Video as Core } from "@synnaxlabs/pluto/video";

export interface VideoProps
  extends DetailedHTMLProps<
    React.VideoHTMLAttributes<HTMLVideoElement>,
    HTMLVideoElement
  > {
  id: string;
  themed?: boolean;
}

const CDN_ROOT = "https://synnax.nyc3.cdn.digitaloceanspaces.com/docs";

const useLiveTheme = (): string => {
  const [theme, setTheme] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  useEffect(() => {
    const listener = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };
    const bindListener = () => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", listener);
    };
    bindListener();
    document.addEventListener("astro:after-swap", bindListener);
    return () => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", listener);
    };
  }, []);
  return theme;
};

export const Video = ({ id, ...props }: VideoProps): ReactElement => {
  const theme = useLiveTheme();
  const href = `${CDN_ROOT}/${id}-${theme}.mp4`;
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.load();
  }, [href]);
  return <Core.Video ref={ref} href={href} loop autoPlay muted {...props} />;
};

export const Image = ({ id, themed = true, ...props }: VideoProps): ReactElement => {
  const theme = useLiveTheme();
  let url = `${CDN_ROOT}/${id}`;
  if (themed) url += `-${theme}`;
  url += ".png";
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.src = url;
  }, []);
  return <img src={url} className="image" {...props} />;
};
