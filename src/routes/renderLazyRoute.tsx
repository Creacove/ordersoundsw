import { Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { FullScreenRouteLoading } from "./RouteLoading";

export function renderLazyRoute(
  Component: LazyExoticComponent<ComponentType>,
) {
  return (
    <Suspense fallback={null}>
      <Component />
    </Suspense>
  );
}
