import { BsLightbulbFill } from "react-icons/bs";

import { PageNavLeaf } from "@/components/PageNav";

export const conceptsNav: PageNavLeaf = {
  key: "concepts",
  name: "Concepts",
  icon: <BsLightbulbFill />,
  children: [
    {
      key: "/concepts/overview",
      url: "/concepts/overview",
      name: "Overview",
    },
    {
      key: "/concepts/channels",
      url: "/concepts/channels",
      name: "Channels",
    },
    {
      key: "/concepts/domains",
      url: "/concepts/domains",
      name: "Domains",
    },
    {
      key: "/concepts/frames",
      url: "/concepts/frames",
      name: "Frames",
    },
    {
      key: "/concepts/ranges",
      url: "/concepts/ranges",
      name: "Ranges",
    },
    {
      key: "/concepts/clusters-and-nodes",
      url: "/concepts/clusters-and-nodes",
      name: "Clusters and Nodes",
    },
  ],
};
