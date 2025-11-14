import { Route, Routes } from "react-router-dom";
import App from "../App";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
    </Routes>
  );
}
