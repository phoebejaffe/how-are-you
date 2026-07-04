import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "./components/ui/Toast";
import { HomePage } from "./pages/HomePage";
import { PersonPage } from "./pages/PersonPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useAppStore } from "./store/appStore";

const MapPage = lazy(() => import("./pages/MapPage").then((module) => ({ default: module.MapPage })));
export default function App() {
  const hydrate = useAppStore((s) => s.hydrate);
  const ready = useAppStore((s) => s.ready);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/person/:nameKey" element={<PersonPage />} />
        <Route
          path="/map"
          element={
            <Suspense
              fallback={
                <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">
                  Loading map…
                </div>
              }
            >
              <MapPage />
            </Suspense>
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
