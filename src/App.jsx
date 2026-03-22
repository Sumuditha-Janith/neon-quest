import React, { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { GameWorld, WORLD_WIDTH, WORLD_HEIGHT } from './engine/GameWorld';
import { setupViewportScaling } from './engine/Viewport';
import { interactablesData } from './data/interactables';
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

    // Core stats
    const [money, setMoney] = useState(0);
    const [inventory, setInventory] = useState([]);
    const [karma, setKarma] = useState(50);

    // Quest progression flags
    const [quest01Completed, setQuest01Completed] = useState(false);
    const [quest02Started, setQuest02Started] = useState(false);
    const [quest02Completed, setQuest02Completed] = useState(false);
    const [letterPosted, setLetterPosted] = useState(false);
    const [quest03Started, setQuest03Started] = useState(false);
    const [quest03Completed, setQuest03Completed] = useState(false);
    const [lockUsed, setLockUsed] = useState(false);

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

    // Update objective text
    useEffect(() => {
        if (!quest01Completed) setObjectiveText("🔍 Find Gino and help him with the pizza quest");
        else if (!quest02Started && !quest02Completed) setObjectiveText("📬 Find Mrs. Gino");
        else if (quest02Started && !quest02Completed && !letterPosted) setObjectiveText("📮 Post the letter at the Post Office");
        else if (quest02Started && !quest02Completed && letterPosted) setObjectiveText("💬 Return to Mrs. Gino");
        else if (!quest03Started && !quest03Completed) setObjectiveText("🔒 Find Tommy near the Factory");
        else if (quest03Started && !quest03Completed && !lockUsed) setObjectiveText("🏭 Use the lock at the Factory");
        else if (quest03Started && !quest03Completed && lockUsed) setObjectiveText("💬 Return to Tommy");
        else setObjectiveText("🏆 All quests completed! Thank you for playing!");
    }, [quest01Completed, quest02Started, quest02Completed, letterPosted, quest03Started, quest03Completed, lockUsed]);

    // Helper functions
    const modifyKarma = (delta) => {
        const newK = Math.min(100, Math.max(0, karma + delta));
        setKarma(newK);
        setKarmaFeedback({ delta, positive: delta > 0 });
        setTimeout(() => setKarmaFeedback(null), 2400);
    };

    const addToInventory = (item) => setInventory(prev => [...prev, item]);
    const removeFromInventory = (id) => setInventory(prev => prev.filter(i => i.id !== id));
    const hasItem = (id) => inventory.some(i => i.id === id);
    const showInfoMessage = (text) => setInfoMessage({ text });

    // ---- Quest 1: Pizza (Gino) ----
    const handleNPCInteraction = () => {
        if (!quest01Completed) {
            if (hasItem("pizza")) {
                const pizza = inventory.find(i => i.id === "pizza");
                const changeLeft = 15 - pizza.price;
                if (pizza.price === 15) {
                    setNpcDialogueData({
                        text: `Gino: 'Wow! ${pizza.name}? Premium! Thanks!'`,
                        options: [{ text: "Enjoy!", action: "complete_quest01" }]
                    });
                } else {
                    setNpcDialogueData({
                        text: `Gino: 'Ah, ${pizza.name}. Any change from $15?'`,
                        options: [
                            { text: `✅ Return $${changeLeft}`, action: "return_change", changeAmount: changeLeft },
                            { text: `❌ Lie: 'No change!'`, action: "keep_money", changeAmount: changeLeft }
                        ]
                    });
                }
                setShowNpcDialogue(true);
            } else if (money === 0) {
                setMoney(15);
                setNpcDialogueData({
                    text: "Gino: 'Here's $15. Buy me a pizza from Mario!'",
                    options: [{ text: "Got it!", action: "close" }]
                });
                setShowNpcDialogue(true);
            } else {
                setNpcDialogueData({
                    text: "Gino: 'Go buy a pizza already!'",
                    options: [{ text: "Okay", action: "close" }]
                });
                setShowNpcDialogue(true);
            }
            return;
        }
        if (quest01Completed && !quest02Started && !quest02Completed) {
            setNpcDialogueData({
                text: "Gino: 'My wife Mrs. Gino needs help. She's nearby.'",
                options: [{ text: "I'll go see her", action: "close" }]
            });
            setShowNpcDialogue(true);
            return;
        }
        setNpcDialogueData({ text: "Gino: 'Life is good!'", options: [{ text: "Bye", action: "close" }] });
        setShowNpcDialogue(true);
    };

    const handleNpcChoice = (opt) => {
        if (opt.action === "close") setShowNpcDialogue(false);
        else if (opt.action === "return_change") {
            setMoney(money - opt.changeAmount);
            modifyKarma(10);
            removeFromInventory("pizza");
            setQuest01Completed(true);
            setShowNpcDialogue(false);
        } else if (opt.action === "keep_money") {
            modifyKarma(-20);
            removeFromInventory("pizza");
            setQuest01Completed(true);
            setShowNpcDialogue(false);
        } else if (opt.action === "complete_quest01") {
            removeFromInventory("pizza");
            setQuest01Completed(true);
            setShowNpcDialogue(false);
        }
    };

    // ---- Quest 2: Mrs. Gino (Letter) ----
    const handleMrsGinoInteraction = () => {
        if (!quest01Completed) {
            setNpcDialogueData({ text: "Mrs. Gino: 'Come back later!'", options: [{ text: "Okay", action: "close" }] });
            setShowNpcDialogue(true);
            return;
        }
        if (quest02Completed) {
            setNpcDialogueData({ text: "Mrs. Gino: 'Thank you so much!'", options: [{ text: "My pleasure", action: "close" }] });
            setShowNpcDialogue(true);
            return;
        }
        if (quest02Started && letterPosted) {
            setMoney(money + 2);
            setQuest02Completed(true);
            setQuest02Started(false);
            setNpcDialogueData({ text: "Mrs. Gino: 'Here's $2 for your help!'", options: [{ text: "You're welcome", action: "close" }] });
            setShowNpcDialogue(true);
            return;
        }
        if (quest02Started && !letterPosted) {
            setNpcDialogueData({ text: "Mrs. Gino: 'Go post the letter!'", options: [{ text: "On my way", action: "close" }] });
            setShowNpcDialogue(true);
            return;
        }
        if (!quest02Started) {
            addToInventory({ id: "letter", name: "Letter" });
            setQuest02Started(true);
            setNpcDialogueData({ text: "Mrs. Gino: 'Please post this letter! (added to inventory)'", options: [{ text: "I'll do it", action: "close" }] });
            setShowNpcDialogue(true);
        }
    };

    // ---- Quest 3: Tommy (Lock) ----
    const handleTommyInteraction = () => {
        if (!quest02Completed) {
            setNpcDialogueData({ text: "Tommy: 'Mom says stay away from strangers!'", options: [{ text: "Okay", action: "close" }] });
            setShowNpcDialogue(true);
            return;
        }
        if (quest03Completed) {
            setNpcDialogueData({ text: "Tommy: 'Thanks again!'", options: [{ text: "Anytime", action: "close" }] });
            setShowNpcDialogue(true);
            return;
        }
        if (quest03Started && lockUsed) {
            setChoiceModal({
                text: "Tommy: 'Thanks! Want this premium cigarette?'",
                choices: [
                    { text: "Accept", action: "accept_cigarette" },
                    { text: "Reject", action: "reject_cigarette" }
                ]
            });
            return;
        }
        if (quest03Started && !lockUsed) {
            setNpcDialogueData({ text: "Tommy: 'Did you lock the factory yet?'", options: [{ text: "I'll go now", action: "close" }] });
            setShowNpcDialogue(true);
            return;
        }
        if (!quest03Started) {
            addToInventory({ id: "lock", name: "Lock" });
            setQuest03Started(true);
            setNpcDialogueData({ text: "Tommy: 'Lock the factory door for me! (lock added)'", options: [{ text: "I'll handle it", action: "close" }] });
            setShowNpcDialogue(true);
        }
    };

    const handleCigaretteChoice = (action) => {
        if (action === "accept_cigarette") addToInventory({ id: "cigarette", name: "Premium Cigarette" });
        showInfoMessage(action === "accept_cigarette" ? "Cigarette added!" : "You refused politely.");
        setChoiceModal(null);
        setQuest03Completed(true);
    };

    // ---- Shop ----
    const handleShopInteraction = () => {
        if (!quest01Completed && !hasItem("pizza") && money >= 10) {
            setShowShop(true);
        } else if (hasItem("pizza")) {
            setNpcDialogueData({ text: "You already have a pizza!", options: [{ text: "Okay", action: "close" }] });
            setShowNpcDialogue(true);
        } else {
            setNpcDialogueData({ text: "Shopkeeper: 'Come back with money!'", options: [{ text: "Leave", action: "close" }] });
            setShowNpcDialogue(true);
        }
    };

    const buyPizza = (pizza) => {
        if (money >= pizza.price && !hasItem("pizza")) {
            setMoney(money - pizza.price);
            addToInventory({ id: "pizza", name: pizza.name, price: pizza.price });
            setShowShop(false);
            showInfoMessage(`🍕 ${pizza.name} added!`);
        }
    };

    // ---- Post Office (Quest 2) ----
    const handlePostOffice = () => {
        if (quest02Started && !letterPosted && hasItem("letter")) {
            setChoiceModal({
                text: "Postbox — what do you do?",
                choices: [
                    { text: "📖 Read letter (wrong)", action: "read_letter" },
                    { text: "📮 Post it", action: "post_letter" }
                ]
            });
        } else {
            showInfoMessage("Nothing to do here right now.");
        }
    };

    const handleLetterChoice = (action) => {
        if (action === "read_letter") modifyKarma(-5);
        removeFromInventory("letter");
        setLetterPosted(true);
        showInfoMessage(action === "read_letter" ? "📜 You read it... felt guilty." : "📮 Letter posted.");
        setChoiceModal(null);
    };

    // ---- Factory (Quest 3) ----
    const handleFactory = () => {
        if (quest03Started && !lockUsed && hasItem("lock")) {
            removeFromInventory("lock");
            setLockUsed(true);
            showInfoMessage("🔒 Factory door secured.");
        } else {
            showInfoMessage("Factory is already locked.");
        }
    };

    // ---- Central interaction dispatcher ----
    const handleInteract = (id) => {
        if (id === 'npc') handleNPCInteraction();
        else if (id === 'shop') handleShopInteraction();
        else if (id === 'postoffice') handlePostOffice();
        else if (id === 'factory') handleFactory();
        else if (id === 'mrsGino') handleMrsGinoInteraction();
        else if (id === 'tommy') handleTommyInteraction();
        else showInfoMessage("You interact, but nothing happens.");
    };

    // ---- Pixi initialization ----
    useEffect(() => {
        if (!containerRef.current) return;

        const app = new PIXI.Application({
            width: WORLD_WIDTH,
            height: WORLD_HEIGHT,
            backgroundColor: 0x0f2a1f,
            antialias: true,
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

    // Keep callbacks fresh
    const handleInteractRef = useRef(handleInteract);
    useEffect(() => { handleInteractRef.current = handleInteract; }, [handleInteract]);
    useEffect(() => {
        if (gameWorldRef.current) gameWorldRef.current.onInteract = (id) => handleInteractRef.current(id);
    });

    // Dialogue keyboard navigation
    useEffect(() => {
        if (!showNpcDialogue || !npcDialogueData.options?.length) return;
        setSelectedOptionIndex(0);
        const kd = (e) => {
            if (e.code === 'ArrowUp') {
                e.preventDefault();
                setSelectedOptionIndex(p => (p - 1 + npcDialogueData.options.length) % npcDialogueData.options.length);
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                setSelectedOptionIndex(p => (p + 1) % npcDialogueData.options.length);
            } else if (e.code === 'Enter') {
                e.preventDefault();
                const sel = npcDialogueData.options[selectedOptionIndex];
                if (sel) handleNpcChoice(sel);
            }
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
            onChoice: (c) => {
                if (c.action === "read_letter") handleLetterChoice("read_letter");
                else if (c.action === "post_letter") handleLetterChoice("post_letter");
                else if (c.action === "accept_cigarette") handleCigaretteChoice("accept_cigarette");
                else if (c.action === "reject_cigarette") handleCigaretteChoice("reject_cigarette");
            },
            onClose: () => setChoiceModal(null)
        }),
        karmaFeedback && React.createElement(KarmaFeedback, { delta: karmaFeedback.delta, positive: karmaFeedback.positive })
    );
}