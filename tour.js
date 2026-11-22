import { api, headers } from "./api.js";
const modelUrl =
  api +
  "/storage/v1/object/authenticated/property-scans/a4062f5b-1dd8-441c-beaa-f6e89fa77adb/26503d99-24d5-4cd1-bc76-a6a8cd4b50b3/b6b5dadb-7410-4122-b861-1fea831d0469/ddb8919b-54b5-4e71-af94-94a0d0d28c11/walkthrough.glb";
const status = document.querySelector("#tourStatus");
const retry = document.querySelector("#retry");
const back = document.querySelector("#closeTour");

async function openTour() {
  retry.hidden = true;
  status.textContent = "טוענים את הדירה…";
  try {
    const { start } = await import("./viewer.js?v=tour2");
    await start(modelUrl, headers);
    status.textContent = "";
  } catch {
    status.textContent = "לא הצלחנו לטעון את הסיור.";
    retry.hidden = false;
  }
}

back.addEventListener("click", (event) => {
  if (
    document.referrer &&
    history.length > 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.altKey
  ) {
    event.preventDefault();
    history.back();
  }
});
retry.addEventListener("click", openTour);
await openTour();
