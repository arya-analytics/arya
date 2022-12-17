import "./index.css";
import "@synnaxlabs/pluto/dist/style.css";
import { Theming } from "@synnaxlabs/pluto";

import { MainLayout } from "./components";

import { ConnectCluster } from "@/features/cluster";
import {
  LayoutRendererProvider,
  LayoutWindow,
  useThemeProvider,
} from "@/features/layout";
import { VisualizationLayoutRenderer } from "@/features/visualization";
import { DefineRange } from "@/features/workspace";

const layoutRenderers = {
  main: MainLayout,
  connectCluster: ConnectCluster,
  visualization: VisualizationLayoutRenderer,
  defineRange: DefineRange,
};

export const App = () => {
  const theme = useThemeProvider();
  return (
    <LayoutRendererProvider value={layoutRenderers}>
      <Theming.Provider {...theme}>
        <LayoutWindow />
      </Theming.Provider>
    </LayoutRendererProvider>
  );
};
