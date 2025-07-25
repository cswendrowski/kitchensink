import { ContextMenu2 } from '../contextMenu2.js';

export default class KitchenSinkChatCard {
    
    static activateListeners(html) {
        html.on("click", ".collapsible", KitchenSinkChatCard._onChatCardToggleCollapsible.bind(this));
        html.on("click", ".action", KitchenSinkChatCard._handleActionClick.bind(this));
    
        // Customize the drag data of effects
        html.find(".effect").each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", async ev => {
                let dragData = {
                    type: "ActiveEffect",
                    uuid: li.dataset.uuid
                };
                ev.dataTransfer.setData("text/plain", JSON.stringify(dragData));
            }, false);
        });

        // If this is not the latest message, default to collapsed
        const thisMessageId = html.data("messageId");
        const messages = Array.from(game.messages);
        const latestMessageId = messages[game.messages.size - 1]._id;
        if (thisMessageId !== latestMessageId) {
            html.find(".collapsible").addClass("collapsed");
        }

        // Collapse the previous message automatically if it is not already collapsed
        const previousMessageId = messages[game.messages.size - 2]?._id;
        const previousMessage = window.document.querySelector(`#chat .chat-message[data-message-id="${previousMessageId}"]`);
        if (previousMessage) {
            for (const collapsible of previousMessage.querySelectorAll(".collapsible") ?? []) {
                if (!collapsible.classList.contains("collapsed")) {
                    collapsible.classList.add("collapsed");
                }
            }
        }

        function uuidv4() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        function applyMenus(roll) {
            var uuid = uuidv4();

            // Add a way to uniquely identify this roll
            $(this)[0].dataset.uuid = uuid;
            $(this).off("contextmenu");

            // Determine if applying damage to targets is allowed.
            const allowTargeting = game.settings.get('kitchen-sink', 'allowTargetDamageApplication');
            let targetType = game.settings.get('kitchen-sink', 'userTargetDamageApplicationType');
            if (!allowTargeting && targetType !== 'selected') {
                game.settings.set('kitchen-sink', 'userTargetDamageApplicationType', 'selected');
                targetType = 'selected';
            }

            let menuItems = [];

            function getRollFromElement(rollElement) {
                const element = rollElement.hasClass('inline-roll')
                ? rollElement
                : rollElement.find('.result');

                if (element.length === 0) return null;
                return getRollValue(element);
            }

            function getRollValue(roll) {
                if (Number.isInteger(roll)) {
                    return roll;
                }
                if (roll instanceof Roll) {
                    return roll.total;
                }
                // Try the regex for expanded rolls.
                const REGEX_EXPANDED_INLINE_ROLL = /.*=s(d+)/gm;
                let match = REGEX_EXPANDED_INLINE_ROLL.exec(roll[0].innerText);
                if (match) return Number.parseInt(match[1]);

                // Regex failed to match, try grabbing the inner text.
                match = Number.parseInt(roll[0].innerText.trim());
                return match || 0;  // Fallback if we failed to parse
            }

            function getTargets(targetType) {
                const targets = targetType === 'targeted'
                ? [...game.user.targets]
                : (canvas?.tokens?.controlled ?? []);

                if (!targets || targets?.length < 1) {
                    ui.notifications.warn(game.i18n.localize(`NOTIFICATIONS.${targetType === 'targeted' ? 'NoTokenTargeted' : 'NoTokenSelected'}`));
                    return [];
                }

                return targets;
            }

            async function apply(element, event, type) {
                const menu = element.find('#context-menu2')?.[0];
                const applyTargetType = menu?.dataset?.target ?? 'selected';
                const applyMod = menu?.dataset?.mod ? Number(menu.dataset.mod) : 1;

                let baseRoll = getRollFromElement(element);
                if ( !baseRoll ) return;

                if ( type === 'healing' ) {
                    baseRoll = -baseRoll;
                }

                baseRoll *= applyMod;

                const targets = getTargets(applyTargetType);

                for ( const target of targets ) {
                    console.log(type, baseRoll, target);
                    const update = {};

                    let roll = foundry.utils.duplicate(baseRoll);
                    const context = { amount: roll };
                    await Hooks.callAllAsync('preApply' + type.titleCase(), target.actor, context);
                    roll = context.amount;

                    switch ( target.actor.type ) {
                        case 'hero':

                            // If the type is temp, add to the temp health.
                            if ( type === 'temp' ) {
                                update['system.hp.temp'] = target.actor.system.hp.temp + roll;
                                break;
                            }

                            // If the type is damage and we have temp health, apply to temp health first.
                            if ( type === 'damage' && target.actor.system.hp.temp > 0 ) {
                                update['system.hp.temp'] = target.actor.system.hp.temp - roll;

                                if ( update['system.hp.temp'] < 0 ) {
                                    update['system.hp.value'] = target.actor.system.hp.value + update['system.hp.temp'];
                                    update['system.hp.temp'] = 0;
                                }
                            }
                            else {
                                // Otherwise, apply to the main health.
                                update['system.hp.value'] = target.actor.system.hp.value - roll;
                            }
                            break;
                        case 'npc':
                            // No health resource found.
                            break;
                        case 'skill':
                            // No health resource found.
                            break;
                        case 'equipment':
                            // No health resource found.
                            break;
                        case 'spell':
                            // No health resource found.
                            break;
                        case 'potion':
                            // No health resource found.
                            break;
                    }

                    target.actor.update(update);
                    Hooks.callAll('applied' + type.titleCase(), target.actor, roll);
                }
            }

            if ( allowTargeting ) {
                menuItems.push({
                    name: `
                        <div class="damage-target flex flexrow">
                            <button type="button" data-target="targeted"><i class="fa-solid fa-bullseye"></i> ${game.i18n.localize('Targeted')}</button>
                            <button type="button" data-target="selected"><i class="fa-solid fa-expand"></i> ${game.i18n.localize('Selected')}</button>
                        </div>`,
                    id: 'targets',
                    icon: '',
                    preventClose: true,
                    callback: (inlineRoll, event) => {
                        const button = event?.target ?? event?.currentTarget;
                        if (button?.dataset?.target) {
                            // Deactivate the other target type.
                            const activeButtons = inlineRoll.find('button[data-target].active');
                            activeButtons.removeClass('active');
                            // Set the target type on the menu for later reference.
                            const menu = inlineRoll.find('#context-menu2')[0];
                            if (menu) {
                                menu.dataset.target = button.dataset.target;
                            }
                            // Toggle the active button and update the user setting.
                            button.classList.add('active');
                            game.settings.set('kitchen-sink', 'userTargetDamageApplicationType', button.dataset.target);
                        }
                    }
                });
            }

            // Add damage multipliers.
            menuItems.push({
                name: `
                    <div class="damage-modifiers flex flexrow">
                        <button type="button" data-mod="0.25">&frac14;x</button>
                        <button type="button" data-mod="0.5">&frac12;x</button>
                        <button type="button" data-mod="1" class="active">1x</button>
                        <button type="button" data-mod="1.5">1.5x</button>
                        <button type="button" data-mod="2">2x</button>
                        <button type="button" data-mod="3">3x</button>
                        <button type="button" data-mod="4">4x</button>
                    </div>`,
                id: 'modifiers',
                icon: '',
                preventClose: true,
                callback: (inlineRoll, event) => {
                    const button = event?.target ?? event?.currentTarget;
                    if (button?.dataset?.mod) {
                        // Deactivate the other target type.
                        const activeButtons = inlineRoll.find('button[data-mod].active');
                        activeButtons.removeClass('active');

                        // Set the target type on the menu for later reference.
                        const menu = inlineRoll.find('#context-menu2')[0];
                        if (menu) {
                            menu.dataset.mod = button.dataset.mod;
                        }
                        
                        // Toggle the active button and update the user setting.
                        button.classList.add('active');
                    }
                }
            });

            menuItems.push(
                {
                    name: game.i18n.localize("CONTEXT.ApplyDamage"),
                    id: 'damage',
                    icon: '<i class="fas fa-tint"></i>',
                    callback: (inlineRoll, event) => apply(inlineRoll, event, 'damage')
                },
                {
                    name: game.i18n.localize("CONTEXT.ApplyHealing"),
                    id: 'healing',
                    icon: '<i class="fas fa-medkit"></i>',
                    callback: (inlineRoll, event) => apply(inlineRoll, event, 'healing')
                },
                {
                    name: game.i18n.localize("CONTEXT.ApplyTemp"),
                    id: 'temp-healing',
                    icon: '<i class="fas fa-heart"></i>',
                    callback: (inlineRoll, event) => apply(inlineRoll, event, 'temp')
                }
            );
            new ContextMenu2($(this).parent(), `[data-uuid=${uuid}]`, menuItems);
        }
        html.find('.inline-roll').each(applyMenus);
        html.find('.dice-total').each(applyMenus);
    }

    /* -------------------------------------------- */

    static _onChatCardToggleCollapsible(event) {
        const target = event.currentTarget;

        // If the target is a content-link, ignore the click event
        if (event.target.classList.contains("content-link")) return;

        event.preventDefault();
        target.classList.toggle("collapsed");

        // Clear the height from the chat popout container so that it appropriately resizes.
        const popout = target.closest(".chat-popout");
        if ( popout ) popout.style.height = "";
    }
    
    /* -------------------------------------------- */
    
    static _handleActionClick(event) {
        event.preventDefault();
        const action = event.currentTarget.dataset.action;
        
        switch (action) {
            case "place":
                const template = event.currentTarget.closest(".measured-template");
                if (!template) return;

                const context = {
                    type: template.dataset.type,
                    distance: template.dataset.distance,
                    direction: template.dataset.direction,
                    angle: template.dataset.angle,
                    width: template.dataset.width
                };

                // Trigger the place action on the template
                game.system.measuredTemplatePreviewClass.place(context, game.user.character?.sheet);                 
                break;
        }   
    }
}
