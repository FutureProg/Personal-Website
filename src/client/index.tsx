import { createRoot } from "react-dom/client";
import { GithubActivityView } from "./views/GithubActivityView";

const root = createRoot(document.getElementById("app")!);
root.render(
    <GithubActivityView />
);