import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SmartFileProvider } from "./contexts/SmartFileContext";
import Home from "./pages/Home";
import AppDemo from "./pages/AppDemo";
import SettingsPage from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/app"} component={AppDemo} />
      <Route path={"/settings"} component={SettingsPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <SmartFileProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SmartFileProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
