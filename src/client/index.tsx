import { createRoot } from "react-dom/client";
import { GithubActivityView } from "./views/GithubActivityView";

// document.body.innerHTML = "<div id='app'></div>";

const root = createRoot(document.getElementById("app")!);
root.render(
    <GithubActivityView />
);