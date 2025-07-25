import {init} from "./hooks/init.mjs";
import {ready} from "./hooks/ready.mjs";
import {renderChatLog} from "./hooks/render-chat-log.mjs";
import {hotReload} from "./hooks/hot-reload.mjs";

Hooks.once("init", init);
Hooks.once("ready", ready);
Hooks.on("devModeReady", ({registerPackageDebugFlag}) => registerPackageDebugFlag("kitchen-sink"));
Hooks.on("renderChatMessage", renderChatLog);
Hooks.on("hotReload", hotReload);
