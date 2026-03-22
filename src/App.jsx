import React, { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { GameWorld, WORLD_WIDTH, WORLD_HEIGHT } from './engine/GameWorld';
import { setupViewportScaling } from './engine/Viewport';
import { interactablesData } from './data/interactables';
import { QuestManager } from './engine/QuestManager';

// Quests Data imports
import quest1 from './data/quests/quest1.json';
import quest2 from './data/quests/quest2.json';
import quest3 from './data/quests/quest3.json';


import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { ShopModal } from './components/modals/ShopModal';
import { DialogueModal } from './components/modals/DialogueModal';
import { InventoryModal } from './components/modals/InventoryModal';
import { InfoModal } from './components/modals/InfoModal';
import { ChoiceModal } from './components/modals/ChoiceModal';
import { KarmaFeedback } from './components/KarmaFeedback';

export default function App() {
    const containerRef = useRef(null);
    const gameWorldRef = useRef(null);
    const questManagerRef = useRef(null);

    // Core stats
    const [money, setMoney] = useState(0);
    const [inventory, setInventory] = useState([]);
    const [karma, setKarma] = useState(50);
    const [flags, setFlags] = useState({});

    // UI state
    const [showShop, setShowShop] = useState(false);
    const [showNpcDialogue, setShowNpcDialogue] = useState(false);
    const [showInventory, setShowInventory] = useState(false);
    const [infoMessage, setInfoMessage] = useState(null);
    const [choiceModal, setChoiceModal] = useState(null);
    const [npcDialogueData, setNpcDialogueData] = useState({ text: "", options: [] });
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);

    const [karmaFeedback, setKarmaFeedback] = useState(null);
    const [interactHint, setInteractHint] = useState("");
    const [objectiveText, setObjectiveText] = useState("🔍 Talk to Gino to start");
    
    const isAnyModalOpen = useRef(false);

    useEffect(() => {
        isAnyModalOpen.current = showShop || showNpcDialogue || showInventory || infoMessage || choiceModal;
    }, [showShop, showNpcDialogue, showInventory, infoMessage, choiceModal]);

    // 1. Initialize Quest Manager
    useEffect(() => {
        const allQuests = [quest1, quest2, quest3 ];
        
        questManagerRef.current = new QuestManager(allQuests, (event) => {
            if (event.type === 'UPDATE_MONEY') setMoney(prev => prev + event.amount);
            if (event.type === 'UPDATE_KARMA') modifyKarma(event.amount);
            if (event.type === 'ADD_ITEM') addToInventory(event.item);
            if (event.type === 'REMOVE_ITEM') removeFromInventory(event.itemId);
            if (event.type === 'QUEST_UPDATE') updateObjectives();
        });
    }, []);

    // Sync State with Manager
    useEffect(() => {
        if (questManagerRef.current) {
            questManagerRef.current.updatePlayerState({ inventory, money, flags });
        }
    }, [inventory, money, flags]);

    const modifyKarma = (delta) => {
        setKarma(prev => Math.min(100, Math.max(0, prev + delta)));
        setKarmaFeedback({ delta, positive: delta > 0 });
        setTimeout(() => setKarmaFeedback(null), 2400);
    };

    const addToInventory = (item) => setInventory(prev => [...prev, item]);
    const removeFromInventory = (id) => setInventory(prev => prev.filter(i => i.id !== id));
    const hasItem = (id) => inventory.some(i => i.id === id);
    const showInfoMessage = (text) => setInfoMessage({ text });

    const updateObjectives = () => {
        const mgr = questManagerRef.current;
        if (!mgr) return;
        if (!mgr.completedQuests.has('q1')) setObjectiveText("🔍 Find Gino and help him with the pizza quest");
        else if (!mgr.activeQuests.has('q2') && !mgr.completedQuests.has('q2')) setObjectiveText("📬 Find Mrs. Gino");
        else if (mgr.activeQuests.has('q2') && !flags.letterPosted) setObjectiveText("📮 Post the letter at the Post Office");
        else if (mgr.activeQuests.has('q2') && flags.letterPosted) setObjectiveText("💬 Return to Mrs. Gino");
        else if (!mgr.activeQuests.has('q3') && !mgr.completedQuests.has('q3')) setObjectiveText("🔒 Find Tommy near the Factory");
        else if (mgr.activeQuests.has('q3') && !flags.lockUsed) setObjectiveText("🏭 Use the lock at the Factory");
        else if (mgr.activeQuests.has('q3') && flags.lockUsed) setObjectiveText("💬 Return to Tommy");
        else setObjectiveText("🏆 All quests completed! Thank you for playing!");
    };

    // 3. Central Interact Handler
    const handleInteract = (targetId) => {
        if (targetId === 'shop') {
            if (money >= 10 && !hasItem("pizza")) setShowShop(true);
            else if (hasItem("pizza")) {
                setNpcDialogueData({ text: "You already have a pizza!", options: [{ text: "Okay", action: { type: "CLOSE" } }] });
                setShowNpcDialogue(true);
            } else {
                setNpcDialogueData({ text: "Shopkeeper: 'Come back with money!'", options: [{ text: "Leave", action: { type: "CLOSE" } }] });
                setShowNpcDialogue(true);
            }
            return;
        }

        if (targetId === 'postoffice') {
            if (questManagerRef.current?.activeQuests.has('q2') && !flags.letterPosted && hasItem("letter")) {
                setChoiceModal({
                    text: "Postbox — what do you do?",
                    choices: [
                        { text: "📖 Read letter (wrong)", action: "read_letter" },
                        { text: "📮 Post it", action: "post_letter" }
                    ]
                });
            } else showInfoMessage("Nothing to do here right now.");
            return;
        }

        if (targetId === 'factory') {
            if (questManagerRef.current?.activeQuests.has('q3') && !flags.lockUsed && hasItem("lock")) {
                removeFromInventory("lock");
                setFlags(prev => ({ ...prev, lockUsed: true }));
                showInfoMessage("🔒 Factory door secured.");
            } else showInfoMessage("Factory is already locked.");
            return;
        }

        // NPCs - Let QuestManager handle it!
        const dialogue = questManagerRef.current?.getDialogueForTarget(targetId);
        if (dialogue) {
            setNpcDialogueData(dialogue);
            setShowNpcDialogue(true);
        } else {
            showInfoMessage("Nothing interesting happens here.");
        }
    };

    const handleNpcChoice = (opt) => {
        if (opt.action) questManagerRef.current?.handleAction(opt.action);
        setShowNpcDialogue(false);
    };

    const handleChoiceModalSelect = (c) => {
        if (c.action === "read_letter") {
            modifyKarma(-5);
            removeFromInventory("letter");
            setFlags(prev => ({ ...prev, letterPosted: true }));
            showInfoMessage("📜 You read it... felt guilty.");
        } else if (c.action === "post_letter") {
            removeFromInventory("letter");
            setFlags(prev => ({ ...prev, letterPosted: true }));
            showInfoMessage("📮 Letter posted.");
        }
        setChoiceModal(null);
    };

    const buyPizza = (pizza) => {
        if (money >= pizza.price && !hasItem("pizza")) {
            setMoney(prev => prev - pizza.price);
            addToInventory({ id: "pizza", name: pizza.name, price: pizza.price });
            setShowShop(false);
            showInfoMessage(`🍕 ${pizza.name} added!`);
        }
    };

    // Pixi Setup
    useEffect(() => {
        if (!containerRef.current) return;
        const app = new PIXI.Application({
            width: WORLD_WIDTH, height: WORLD_HEIGHT,
            backgroundColor: 0x0f2a1f, antialias: true,
            resolution: Math.min(window.devicePixelRatio || 1, 2)
        });
        containerRef.current.appendChild(app.view);
        const world = new GameWorld(app, interactablesData, handleInteract, setInteractHint, isAnyModalOpen);
        gameWorldRef.current = world;
        const cleanupScaling = setupViewportScaling(app.view, containerRef, WORLD_WIDTH, WORLD_HEIGHT);
        return () => {
            cleanupScaling();
            if (gameWorldRef.current) gameWorldRef.current.destroy();
            if (app.view && containerRef.current?.contains(app.view)) containerRef.current.removeChild(app.view);
        };
    }, []);

    const handleInteractRef = useRef(handleInteract);
    useEffect(() => { handleInteractRef.current = handleInteract; }, [handleInteract]);
    useEffect(() => {
        if (gameWorldRef.current) gameWorldRef.current.onInteract = (id) => handleInteractRef.current(id);
    });

    // Keyboard controls
    useEffect(() => {
        if (!showNpcDialogue || !npcDialogueData.options?.length) return;
        setSelectedOptionIndex(0);
        const kd = (e) => {
            if (e.code === 'ArrowUp') { e.preventDefault(); setSelectedOptionIndex(p => (p - 1 + npcDialogueData.options.length) % npcDialogueData.options.length); } 
            else if (e.code === 'ArrowDown') { e.preventDefault(); setSelectedOptionIndex(p => (p + 1) % npcDialogueData.options.length); } 
            else if (e.code === 'Enter') { e.preventDefault(); const sel = npcDialogueData.options[selectedOptionIndex]; if (sel) handleNpcChoice(sel); }
        };
        window.addEventListener('keydown', kd);
        return () => window.removeEventListener('keydown', kd);
    }, [showNpcDialogue, npcDialogueData.options, selectedOptionIndex]);

    return React.createElement('div', { className: "app-layout" },
        React.createElement(LeftPanel, { money, karma, inventory, onOpenInventory: () => setShowInventory(true) }),
        React.createElement('div', { className: "game-container", ref: containerRef }),
        React.createElement(RightPanel, { objectiveText, interactHint }),

        showShop && React.createElement(ShopModal, { money, onBuy: buyPizza, onClose: () => setShowShop(false) }),
        showNpcDialogue && React.createElement(DialogueModal, {
            text: npcDialogueData.text,
            options: npcDialogueData.options,
            selectedIndex: selectedOptionIndex,
            onSelect: handleNpcChoice,
            onClose: () => setShowNpcDialogue(false)
        }),
        showInventory && React.createElement(InventoryModal, { inventory, onClose: () => setShowInventory(false) }),
        infoMessage && React.createElement(InfoModal, { text: infoMessage.text, onClose: () => setInfoMessage(null) }),
        choiceModal && React.createElement(ChoiceModal, {
            text: choiceModal.text,
            choices: choiceModal.choices,
            onChoice: handleChoiceModalSelect,
            onClose: () => setChoiceModal(null)
        }),
        karmaFeedback && React.createElement(KarmaFeedback, { delta: karmaFeedback.delta, positive: karmaFeedback.positive })
    );
}