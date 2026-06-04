// src/Canvas/CanvasLeftSideBar/CanvasDataTypes.js

import AppDataPanel from "./panels/AppDataPanel";
import DataTypesPanel from "./panels/DataTypesPanel";
import PrivacyPanel from "./panels/PrivacyPanel";

export default function CanvasDataTypes(props) {
  const { type } = props;

  if (type === "appdata") return <AppDataPanel {...props} />;
  if (type === "privacy") return <PrivacyPanel {...props} />;

  return <DataTypesPanel {...props} />;
}
