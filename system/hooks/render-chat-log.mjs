import KitchenSinkChatCard from "../documents/chat-card.mjs";

export function renderChatLog(app, html, data) {
    KitchenSinkChatCard.activateListeners(html);
}
