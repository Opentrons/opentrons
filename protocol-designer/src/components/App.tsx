import * as React from "react";
import { ProtocolEditor } from "./ProtocolEditor";
import "../css/reset.css";
export function App(): React.ReactNode {
  return <div className="container">
      <ProtocolEditor />
    </div>;
}