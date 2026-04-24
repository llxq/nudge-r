import React from "react";
import ReactDOM from "react-dom/client";
import { getPageComponent } from "./app/renderPage";
import { setupErrorHandlers } from "./utils/errorHandler";
import "./global.scss";

setupErrorHandlers();

const Page = getPageComponent();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);
