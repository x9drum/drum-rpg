    // 監控 battle.lightningActive 的變化
if (window.battle) {
    let _val = 0;
    Object.defineProperty(battle, 'lightningActive', {
        get: function() { return _val; },
        set: function(newVal) {
            console.warn(`🛑 偵測到修改！數值從 ${_val} 變成了 ${newVal}`);
            console.trace("修改來源路徑：");
            _val = newVal;
        }
    });
}

const SAVE_KEY = "drumRPG_save_v1"; // 統一管理存檔名稱

const BOSS_DATA = {
    "forest": {
        name: "🐶 終極皮卡犬 (BOSS)",
        hp: 50,
        img: "https://lh3.googleusercontent.com/u/0/d/13gmPacRGrhknq4wzOPNQMpGoYqefd5p7",
        // 機制設定
        onMissDmg: 1,       // 每次失誤立刻扣血
        onTripleMissDmg: 5, // 滿三次失誤大扣血
        xp: 50, 
        gold: 5
    }
    // 未來新 BOSS 直接在此新增區塊即可
};

    const MONSTERS = {
        1: { name: "皮卡犬", img: "https://lh3.googleusercontent.com/d/147ksznr4MKc34VYJ_TTdvhOVRkoLMXAS" },
        2: { name: "小火犬", img: "https://lh3.googleusercontent.com/d/1rYcw8PQymTXQ28rC7Rw8jUSz3RSvLpaT" },
        3: { name: "龜犬", img: "https://lh3.googleusercontent.com/d/1jzlRU3lFAivY2mtNWJEbPDkXbmV2p33S" },
        4: { name: "鬥牛犬", img: "https://lh3.googleusercontent.com/d/1ZgA1F59nmZm7zzPyjZeIeqAbzIsjSuGZ" },
        5: { name: "武士鬥牛犬", img: "https://lh3.googleusercontent.com/d/10Y2NjYhs6L7ghqQQ6tyFQ7fUDfwBmvth" },
        6: { name: "拿槍的武士鬥牛犬", img: "https://lh3.googleusercontent.com/d/1n0MuZFCieUiN7wERm9LsZPXc9FTY3MSD" }
    };

const ITEM_DATABASE = {
    // --- 原有道具 (增加數值屬性) ---
    "木劍": {
        price: 50,
        type: "equipment",
        stackable: false,
        img: "https://drive.google.com/thumbnail?id=1cAFQkEzFLq6jU6ZibbqoYHFsYS3wIPhC&sz=w200",
        desc: "練習用的鼓棍木劍"
    },
    "閃電骨頭": {
        price: 30,
        type: "material",
        stackable: true,
        img: "https://drive.google.com/thumbnail?id=1TEYi0Cd0A0IBNi2oRdugq9l7dysa2M2g&sz=w200",
        desc: "帶有微弱電流的奇特骨頭"
    },
    "村長的眼鏡": {
        price: 100,
        type: "quest",
        stackable: false,
        img: "https://drive.google.com/thumbnail?id=1dRBqdIhqoEMc4l767mBSKcwpg2BFnYdU&sz=w200",
        desc: "村長遺失的寶貴眼鏡"
    },

    // --- 商店新道具 ---
    "藥水": {
        price: 5,
        type: "consumable",
        stackable: true,
        img: "https://drive.google.com/thumbnail?id=1nGk5TVPviiY7FYjettUoPXIkAijMLH4C&sz=w200",
        desc: "回復 5 點血量"
    },
    "木頭": {
        price: 10,
        type: "material",
        stackable: true,
        img: "https://drive.google.com/thumbnail?id=1pb9roZwocGB6GVnOvHgipTMyHXaMWkHx&sz=w200",
        desc: "用於製作物品"
    },
    "皮革": {
        price: 10,
        type: "material",
        stackable: true,
        img: "https://drive.google.com/thumbnail?id=1yPU0YAiUlCb2UJrPsnUByVgL12NamXxS&sz=w200",
        desc: "用於製作物品"
    }
};



const GOLD_ICON = "https://drive.google.com/thumbnail?id=1Edgslb0U84_uavyj-t6wdWSvPOMtfRgu&sz=w200";




    
    // 讀取所有角色列表
let playerList = JSON.parse(localStorage.getItem('drumRPG_players')) || [];
let player = null; 
let playerIndex = -1; 
let canAtk = true; // 控制玩家是否能點擊攻擊

// 戰鬥狀態暫存 (增加 isBoss 判定)
let battle = { 
    mHp: 0, 
    mMaxHp: 0, 
    mName: "",
    mLv: 0, 
    cd: [0, 0, 0], 
    perfectNext: false, 
    missCount: 0, 
    isBoss: false,      // 判定是否為 BOSS 戰
    lightningActive: 0  // 閃電骨頭技能剩餘回合
};
    
    window.onload = () => {
        updateLoadScreen();
    };

// --- 商店全域變數 ---
const SHOP_ITEMS = ["藥水", "木頭", "皮革"];
let selectedShopItems = []; // 存放格式: { name: "藥水", price: 5 }
let selectedPlayerItems = []; // 存放格式: { index: 0, name: "藥水" }

// 1. 開啟商店
function openShop() {
    selectedShopItems = [];
    selectedPlayerItems = [];
    document.getElementById('shop-modal').classList.remove('hidden');
    renderShopGrids();
}

// 2. 渲染商店與背包格子
function renderShopGrids() {
    const shopGrid = document.getElementById('shop-grid');
    const playerGrid = document.getElementById('shop-player-grid');
    
    // 渲染商店商品 (無限供應)
    shopGrid.innerHTML = Array.from({length: 25}).map((_, i) => {
        const itemName = SHOP_ITEMS[i] || "";
        const item = ITEM_DATABASE[itemName];
        let content = item ? `<img src="${item.img}" style="width:80%">` : "";
        return `<div class="backpack-slot" onclick="selectShopItem(this, '${itemName}')">${content}</div>`;
    }).join('');

// 渲染玩家背包 (支援防錯與堆疊顯示)
playerGrid.innerHTML = Array.from({length: 25}).map((_, i) => {
    const invObj = player.inv[i];
    let content = "";
    
    // 關鍵修正：增加判斷該物品是否存在於資料庫中
    if (invObj && invObj.name && ITEM_DATABASE[invObj.name]) {
        const db = ITEM_DATABASE[invObj.name];
        content = `<img src="${db.img}" style="width:80%">
                   <span class="item-count">${invObj.count > 1 ? invObj.count : ''}</span>`;
    } else if (invObj && typeof invObj === 'string' && ITEM_DATABASE[invObj]) {
        // 額外相容處理：如果存檔還是舊的字串格式
        const db = ITEM_DATABASE[invObj];
        content = `<img src="${db.img}" style="width:80%">`;
    }
    
    return `<div class="backpack-slot" onclick="selectPlayerItem(this, ${i})">${content}</div>`;
}).join('');
    
    updateShopTotals();
}

// 3. 選取邏輯 (發光特效)
function selectShopItem(el, name) {
    if (!name) return;
    el.classList.toggle('slot-selected');
    const itemData = ITEM_DATABASE[name];
    
    // 如果已經在清單內就移除，不在就加入 (切換選取)
    const index = selectedShopItems.findIndex(s => s.name === name);
    if (index > -1) selectedShopItems.splice(index, 1);
    else selectedShopItems.push({ name: name, price: itemData.price });
    
    updateShopTotals();
}

function selectPlayerItem(el, invIndex) {
    if (player.inv[invIndex] === undefined) return;

    // 檢查商店是否開啟 (透過檢查 CSS class)
    const isShopOpen = !document.getElementById('shop-modal').classList.contains('hidden');

    if (isShopOpen) {
        // --- 商店模式：選取賣出 ---
        el.classList.toggle('slot-selected');
        const index = selectedPlayerItems.indexOf(invIndex);
        if (index > -1) {
            selectedPlayerItems.splice(index, 1);
        } else {
            selectedPlayerItems.push(invIndex);
        }
        updateShopTotals();
    } else {
        // --- 平時模式：直接使用 ---
        useItem(invIndex);
    }
}

// 4. 計算總價
// 4. 計算總價 (✅ 已將 Emoji 替換為 GOLD_ICON)
// 4. 計算總價 (修正獲利歸零問題)
function updateShopTotals() {
    // 1. 計算買入總價
    const buyTotal = selectedShopItems.reduce((sum, item) => sum + item.price, 0);
    
    // 2. 計算賣出預計獲利 (關鍵修正區)
    const sellTotal = selectedPlayerItems.reduce((sum, invIndex) => {
        const item = player.inv[invIndex];
        if (!item) return sum;

        // 判斷物品名稱 (相容舊格式字串與新格式物件)
        let name = (typeof item === 'string') ? item : item.name;
        let count = (typeof item === 'object') ? (item.count || 1) : 1;

        const itemData = ITEM_DATABASE[name];
        if (itemData) {
            const profit = Math.round(itemData.price * 0.5 * count);
            return sum + profit;
        }
        return sum;
    }, 0);

    // 3. 更新介面顯示
    const buyTotalEl = document.getElementById('buy-total');
    const sellTotalEl = document.getElementById('sell-total');

    // 使用您指定的 GOLD_ICON 圖片
    const goldImg = `<img src="${GOLD_ICON}" style="width:18px; vertical-align:middle; margin:0 4px;">`;

    if (buyTotalEl) {
        buyTotalEl.innerHTML = `總計: ${goldImg} ${buyTotal}`;
    }
    if (sellTotalEl) {
        sellTotalEl.innerHTML = `預計獲利: ${goldImg} ${sellTotal}`;
    }
}

// 5. 執行購買
function executePurchase() {
    const totalCost = selectedShopItems.reduce((sum, item) => sum + item.price, 0);
    
    // 1. 檢查金錢是否充足
    if (player.gold < totalCost) return alert("金幣不足！");

    // 2. 執行購買 (逐一加入背包)
    let allAdded = true;
    selectedShopItems.forEach(item => {
        // 我們修改 addToInv 讓它在成功時回傳 true
        if (!addToInv(item.name)) {
            allAdded = false;
        } else {
            player.gold -= item.price; // 成功加入一個，扣一個的錢
        }
    });

    if (!allAdded) {
        alert("部分物品因背包空間不足未能購買。");
    }

    // 3. 清空選取清單並重新渲染
    selectedShopItems = []; 
    openShop(); 
    saveAllData();
    renderPlayerStats(); // 確保主畫面血條與等級區域（如果有金幣顯示）同步
}

function executeSell() {
    if (selectedPlayerItems.length === 0) return;

    let totalProfit = 0;
    
    // 從後往前處理
    selectedPlayerItems.sort((a, b) => b - a).forEach(invIndex => {
        const item = player.inv[invIndex];
        if (!item) return;

        // --- 關鍵相容性判斷 ---
        let name, count;
        if (typeof item === 'string') {
            name = item;  // 處理舊格式字串
            count = 1;
        } else {
            name = item.name; // 處理新格式物件
            count = item.count || 1;
        }

        const itemData = ITEM_DATABASE[name];
        if (itemData) {
            const unitPrice = itemData.price || 0;
            const profit = Math.round(unitPrice * 0.5 * count);
            totalProfit += profit;
            
            // 執行刪除
            player.inv.splice(invIndex, 1);
        }
    });

    player.gold += totalProfit;
    selectedPlayerItems = []; 
    
    alert(`賣出成功！獲得了 ${totalProfit} 枚金幣`);
    
    renderShopGrids(); 
    saveAllData();     
    renderPlayerStats(); // 確保主畫面金幣同步更新
}


// 關閉視窗
function closeShop() {
    document.getElementById('shop-modal').classList.add('hidden');
    renderPlayerStats(); // 回到主畫面刷新狀態
}

function addToInv(itemName) {
    if (!player.inv) player.inv = [];

    // 1. 科學檢查：物品是否可堆疊 (從資料庫判斷)
    const itemData = ITEM_DATABASE[itemName];
    const isStackable = itemData && itemData.stackable !== false; // 預設皆可堆疊

    // 2. 尋找背包中是否已有相同物品
    const existingItem = player.inv.find(it => 
        (typeof it === 'object' && it.name === itemName) || (it === itemName)
    );

    if (existingItem && isStackable) {
        // --- 執行堆疊 ---
        if (typeof existingItem === 'object') {
            existingItem.count = (existingItem.count || 1) + 1;
        } else {
            // 如果舊資料是字串，將其轉化為物件格式以支援堆疊
            const idx = player.inv.indexOf(itemName);
            player.inv[idx] = { name: itemName, count: 2 };
        }
    } else {
        // --- 佔用新格子 ---
        // 檢查背包是否已滿 (25格)
        if (player.inv.length >= 25) {
            alert("背包已滿！");
            return;
        }
        player.inv.push({ name: itemName, count: 1 });
    }

    // 3. 立即刷新所有相關介面
    saveAllData();
    renderBackpack(); 
    if (!document.getElementById('shop-modal').classList.contains('hidden')) {
        renderShopGrids(); // 如果商店開著，也要刷新
    }
}

// 使用物品邏輯 (例如：喝藥水)
function useItem(invIndex) {
    const item = player.inv[invIndex];
    if (!item) return;

    const itemName = (typeof item === 'string') ? item : item.name;
    const itemData = ITEM_DATABASE[itemName];

    // 1. 判斷是否為消耗品 (藥水)
    if (itemData && itemData.type === "consumable") {
        if (player.hp >= player.maxHp) {
            alert("體力已滿，不需使用！");
            return;
        }

        // 2. 執行補血 (例如藥水補 20% 或固定數值，這裡示範補 10 點)
        const healAmount = 5;
        player.hp = Math.min(player.maxHp, player.hp + healAmount);
        
        // 3. 扣除數量 (堆疊邏輯)
        if (typeof item === 'object' && item.count > 1) {
            item.count--;
        } else {
            player.inv.splice(invIndex, 1);
        }

        alert(`使用了 ${itemName}，回復了 ${healAmount} 點生命值！`);
        
        // 4. 刷新畫面
        renderBackpack();
        renderPlayerStats();
        saveAllData();
    } else {
        alert("此物品無法直接使用。");
    }
}


// 當玩家選取圖片時觸發
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;

        img.onload = function() {
            // 1. 建立畫布
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 2. 設定壓縮尺寸 (200x200 像素，體積極小但足夠清晰)
            const SIZE = 200;
            canvas.width = SIZE;
            canvas.height = SIZE;

            // 3. 畫上畫布並壓縮
            ctx.drawImage(img, 0, 0, SIZE, SIZE);

            // 4. 轉成 jpeg 格式，品質設為 0.7
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

            // 5. 存入您的玩家物件 (假設您的物件叫 player)
            player.avatar = compressedBase64;

            // 6. 更新預覽圖 (如果有預覽框的話)
            const preview = document.getElementById('avatar-preview');
            if (preview) preview.src = compressedBase64;

            console.log("✅ 圖片已成功壓縮，存檔空間警報解除！");
        };
    };
    reader.readAsDataURL(file);
}

    // 新建角色：不覆蓋舊角色，而是 push 進陣列
    function saveNewChar(nameEl, avatarEl) {
    // 1. 科學防呆：如果 HTML 沒抓到，立刻停止並給予提示
    if (!nameEl || !avatarEl) {
        alert("系統錯誤：找不到輸入框！請確認 HTML 中的 id 是否正確。");
        console.error("目前抓到的名稱輸入框:", nameEl);
        console.error("目前抓到的頭像輸入框:", avatarEl);
        return;
    }

    const name = nameEl.value || "城九學生";
    const file = avatarEl.files[0];

    const finalizeEntry = (imageData) => {
        const newChar = {
            id: Date.now(), 
            name: name,
            avatar: imageData, 
            lv: 1, hp: 10, maxHp: 10, xp: 0, nextXp: 10, gold: 0, 
            inv: [],
            killCount: 0 
        };

        if (typeof playerList !== 'undefined') {
            playerList.push(newChar);
            saveAllData(); 
            
            // 清除內容
            nameEl.value = "";
            avatarEl.value = "";
            
            alert(`角色「${name}」建立成功！`);
            if (typeof updateLoadScreen === "function") updateLoadScreen();
        }
    };

    // 2. 圖片壓縮邏輯 (解決平板空間爆掉的核心)
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const SIZE = 200; 
                canvas.width = SIZE;
                canvas.height = SIZE;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, SIZE, SIZE);
                finalizeEntry(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        finalizeEntry('https://via.placeholder.com/60');
    }
}

    // 更新右側選單：顯示所有角色列表
    function updateLoadScreen() {
        const loadInfo = document.getElementById('load-info');
        if (playerList.length > 0) {
            loadInfo.innerHTML = playerList.map((char, index) => `
                <div onclick="selectPlayer(${index})" style="
                    display: flex; align-items: center; gap: 12px; 
                    background: white; padding: 12px; margin-bottom: 10px; 
                    border-radius: 12px; border: 2px solid #eee; cursor: pointer; transition: 0.2s; text-align: left;">
                    <img src="${char.avatar}" style="width:45px; height:45px; border-radius:50%; object-fit:cover; border:2px solid var(--forest-green);">
                    <div style="flex-grow: 1;">
                        <strong style="font-size:15px;">${char.name}</strong><br>
                        <span style="font-size:12px; color:#666;">Lv.${char.lv} 鼓手</span>
                    </div>
                    <button onclick="deleteChar(event, ${index})" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:18px;">🗑️</button>
                </div>
            `).join('');
        } else {
            loadInfo.innerHTML = `
                <div style="color:#888; border: 2px dashed #ccc; padding: 20px; border-radius: 15px;">
                    <p>目前沒有發現存檔</p>
                    <p style="font-size:12px;">請從左側建立角色</p>
                </div>`;
        }
    }

    // 選取角色並進入遊戲
    function selectPlayer(index) {
        player = playerList[index];
        playerIndex = index;
        showMenu();
    }

    // 刪除角色功能
    function deleteChar(event, index) {
        event.stopPropagation(); // 防止點擊垃圾桶時觸發 selectPlayer
        if(confirm(`確定要刪除角色「${playerList[index].name}」嗎？`)) {
            playerList.splice(index, 1);
            saveAllData();
            updateLoadScreen();
        }
    }

function saveAllData() {
    // 1. 檢查索引是否存在，若不存在則嘗試重新抓取或略過
    if (playerIndex === -1) {
        console.error("錯誤：找不到玩家索引，存檔終止。");
        return; 
    }

    try {
        // 2. 更新當前玩家資料到清單
        playerList[playerIndex] = player;
        
        // 3. 準備序列化資料
        const listData = JSON.stringify(playerList);
        const singleData = JSON.stringify(player);

        // 4. 存入 localStorage (主要清單)
        localStorage.setItem('drumRPG_players', listData);
        
        // 5. 存入備份鍵名 (單一角色備份)
        localStorage.setItem('RPG_SaveData', singleData);

        console.log("【存檔成功】玩家索引:", playerIndex);
    } catch (e) {
        // 針對平板最常發生的 QuotaExceededError (儲存空間爆滿)
        console.error("存檔失敗！", e);
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            alert("❌ 儲存空間已滿！\n原因：角色頭像檔案太大了。\n請更換較小的圖片，否則進度無法儲存。");
        } else {
            alert("❌ 存檔發生未知錯誤，請檢查主控台。");
        }
    }
}


// 統一儲存函式
async function exportSaveToClipboard() {
    // 🔍 科學對接：讀取您在 saveAllData 裡設定的單一角色 Key
    const saveData = localStorage.getItem('RPG_SaveData');

    if (!saveData) {
        // 如果單一角色不存在，嘗試從清單抓取當前角色
        if (player) {
            saveAllData(); // 強制執行一次存檔來產生 Key
            return exportSaveToClipboard(); // 重新嘗試
        }
        alert("尚未有練習紀錄！");
        return;
    }

    try {
        // 編碼處理：確保在不同裝置傳輸時不會因為特殊字元出錯
        const encoded = btoa(encodeURIComponent(saveData));
        
        // 嘗試自動複製
        await navigator.clipboard.writeText(encoded);
        alert("✨ 存檔代碼已成功複製到剪貼簿！\n您可以將它傳給老師或存在備忘錄。");
    } catch (err) {
        // 平板保底方案
        prompt("請長按複製下方代碼進行備份：", btoa(encodeURIComponent(saveData)));
    }
}

function importSaveFromInput() {
    const code = prompt("請貼入備份的存檔代碼：");
    if (!code) return;

    try {
        const decoded = decodeURIComponent(atob(code));
        // 驗證 JSON 格式是否正確
        JSON.parse(decoded); 
        
        // 寫入您定義的備份 Key
        localStorage.setItem('RPG_SaveData', decoded);
        
        alert("✅ 導入成功！即將重新載入...");
        location.reload();
    } catch(e) {
        alert("❌ 無效的代碼，請確認是否完整複製。");
    }
}

    function showMenu() {
    // 1. 切換畫面顯示
    document.getElementById('start-page').classList.add('hidden');
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('menu-screen').classList.remove('hidden');
    
    // 2. 渲染玩家資訊
    renderPlayerStats();
    
    // 3. 【整合點】更新關卡解鎖狀態
    updateLocationUI(); 
}

   function renderPlayerStats() {
    // 檢查數據是否存在
    if (!player) return;

    const hpPercent = (player.hp / player.maxHp * 100);
    const xpPercent = (player.xp / player.nextXp * 100);
    
    document.getElementById('player-profile').innerHTML = `
        <img src="${player.avatar}" class="char-avatar">
        <div class="stats-container">
            <strong>${player.name} (Lv.${player.lv})</strong>
            <div class="bar-container">
                <div class="hp-fill" style="width:${hpPercent}%"></div>
                <div class="bar-text">${player.hp}/${player.maxHp}</div>
            </div>
            <div class="bar-container">
                <div class="xp-fill" style="width:${xpPercent}%"></div>
                <div class="bar-text">${player.xp}/${player.nextXp}</div>
            </div>
            <div style="display: flex; gap: 15px; align-items: center; margin-top: 5px;">
                <span><img src="${GOLD_ICON}" class="gold-icon"> ${player.gold}</span>
                <span style="font-size: 12px; color: #eee;">⚔️ 森林討伐: ${player.killCount || 0}</span>
            </div>
        </div>`;
}

// 專門處理 BOSS 按鈕 UI 的解鎖邏輯
function updateLocationUI() {
    const currentKills = player.killCount || 0;
    const killGoal = 5;
    
    const killDisplay = document.getElementById('forest-kill-display');
    const bossBtn = document.getElementById('boss-btn-forest');

    // 更新數字顯示
    if (killDisplay) {
        killDisplay.innerText = currentKills;
    }

    // 判斷按鈕狀態
    if (bossBtn) {
        if (currentKills >= killGoal) {
            // 滿足條件：解除鎖定
            bossBtn.classList.remove('boss-btn-locked');
            bossBtn.classList.add('boss-btn-unlocked');
            bossBtn.innerHTML = "🔥 挑戰 終極皮卡犬";
            bossBtn.disabled = false;
        } else {
            // 未滿足條件：持續鎖定
            bossBtn.classList.add('boss-btn-locked');
            bossBtn.classList.remove('boss-btn-unlocked');
            bossBtn.innerHTML = `🔒 擊敗小怪 (${currentKills}/${killGoal})`;
            bossBtn.disabled = true;
        }
    }
}
// 玩家點擊 BOSS 按鈕的執行函式
function tryStartBoss() {
    if ((player.killCount || 0) >= 5) {
        startBossBattle('forest');
    } else {
        // 雖然按鈕 disabled 應該點不到，但作為保險邏輯
        alert("還需要再擊敗更多森林怪物才能挑戰 BOSS！");
    }
}


    function startBattle(baseLv, bgUrl) {
        document.getElementById('menu-screen').classList.add('hidden');
        const bScreen = document.getElementById('battle-screen');
        bScreen.classList.remove('hidden');
       // 關鍵：不再設定 bScreen 的背景，而是設定裡面那個 img
    const bgObj = document.getElementById('battle-bg-object');
    bgObj.src = bgUrl;
        
        battle.mLv = Math.min(6, baseLv + Math.floor(Math.random() * 3)); 
        let mData = MONSTERS[battle.mLv];
        battle.mMaxHp = 5 + (battle.mLv * 5);
        battle.mHp = battle.mMaxHp;
        battle.cd = [0,0,0];
        document.getElementById('m-name').innerText = mData.name;
        document.getElementById('monster-img').src = mData.img;
        updateBattleUI();
battle.missCount = 0; // 重置失誤計數
    updateMissUI(); // 更新介面
    updateBattleUI();
    }

function startBossBattle(zoneKey) {
    const boss = BOSS_DATA[zoneKey];
    if (!boss) {
        console.error("找不到該區域的 BOSS 數據:", zoneKey);
        return;
    }

    // 1. 設定戰鬥狀態為 BOSS 模式
    battle.isBoss = true;
    battle.currentZone = zoneKey; // 標記區域，讓 Miss 函式知道去哪讀數據 (例如 forest)
    
    // 2. 載入 BOSS 數值
    battle.mHp = boss.hp;
    battle.mMaxHp = boss.hp;
    battle.mName = boss.name;
    battle.mLv = 99; // 給 BOSS 一個高於小怪的等級代號
    battle.cd = [0, 0, 0];
    battle.missCount = 0;

    // 3. 更新 UI 文字與圖片
    document.getElementById('m-name').innerText = boss.name;
    document.getElementById('monster-img').src = boss.img;
    
    // 4. 重置失誤計數介面
    updateMissUI();

    // 5. 切換畫面至戰鬥營幕
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const bScreen = document.getElementById('battle-screen');
    bScreen.classList.remove('hidden');
    
    // 設置 BOSS 戰背景（您可以換成更震撼的背景圖）
    bScreen.style.backgroundImage = "url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000')"; 

    updateBattleUI();
    
    // 6. 增加一個進入 BOSS 戰的震撼效果
    const mImg = document.getElementById('monster-img');
    if (mImg) {
        mImg.style.filter = "brightness(0) saturate(100%) invert(18%) sepia(90%) border-radius(50%)"; // 剪影化
        setTimeout(() => {
            mImg.style.filter = "none"; // 0.5秒後顯現真身
        }, 500);
    }
}


    function updateBattleUI() {
    // 1. 血條與經驗條更新
    const mHpPerc = (battle.mHp / battle.mMaxHp * 100) + '%';
    const pHpPerc = (player.hp / player.maxHp * 100) + '%';
    const pXpPerc = (player.xp / player.nextXp * 100) + '%';

    document.getElementById('m-hp-fill').style.width = mHpPerc;
    document.getElementById('m-hp-txt').textContent = `${Math.ceil(battle.mHp)}/${battle.mMaxHp}`;
    document.getElementById('p-hp-fill').style.width = pHpPerc;
    document.getElementById('p-hp-txt').textContent = `${player.hp}/${player.maxHp}`;
    document.getElementById('p-xp-fill').style.width = pXpPerc;
    document.getElementById('p-xp-txt').textContent = `${player.xp}/${player.nextXp}`;

    // 2. 打擊按鈕文字
    const atkBtn = document.getElementById('atk-display');
    if (atkBtn) {
        const hasSword = player.inv.some(i => i && i.trim() === '木劍');
        atkBtn.textContent = hasSword ? `🗡️ 使用木劍打擊` : `👊 普通打擊`;
    }

    // 3. 技能按鈕與 CD 顯示 (1-3 迴圈)
    for (let i = 1; i <= 3; i++) {
        const btnElem = document.getElementById(`skill-${i}`);
        const cdElem = document.getElementById(`cd-${i}`);
        if (!btnElem) continue;

        const currentCD = battle.cd[i - 1];
        if (cdElem) cdElem.textContent = currentCD;

        // 鎖定邏輯
        const isLocked = (i === 1 && player.lv < 2) || (i === 2 && player.lv < 3) || (i === 3 && player.lv < 5);
        btnElem.disabled = (isLocked || currentCD > 0);
        
        // 切換灰階濾鏡
        btnElem.style.filter = btnElem.disabled ? "grayscale(1) opacity(0.6)" : "none";

        // --- 核心修正：技能 3 圖片切換 ---
        if (i === 3) {
            let skillImg = btnElem.querySelector('img');
            
            // 如果房間是空的，現場造一個標籤
            if (!skillImg) {
                skillImg = document.createElement('img');
                skillImg.style.width = "80%";
                skillImg.style.height = "80%";
                skillImg.style.objectFit = "cover";
                btnElem.prepend(skillImg); 
            }

            // 科學容錯：檢查背包是否有閃電骨頭 (排除空格干擾)
            const hasLightningBone = player.inv.some(item => item && item.trim() === '閃電骨頭');

            if (hasLightningBone) {
                skillImg.src = "https://img.icons8.com/color/96/flash-on.png";
                console.log("[系統] 檢測到閃電骨頭，已更換圖示");
            } else {
                skillImg.src = "https://lh3.googleusercontent.com/d/1T4KmHUNFhaVPtl_9_0GYdUF2mdGL9kRi";
            }
            skillImg.style.display = "block";
        }
    } // 迴圈結束

    // 4. 雷電模式 UI 狀態
    const bScreen = document.getElementById('battle-screen');
    if (bScreen) {
        if (battle.lightningActive > 0) {
            bScreen.classList.add('lightning-mode');
        } else {
            bScreen.classList.remove('lightning-mode');
        }
    }
}

/// 玩家攻擊怪物
/// 玩家攻擊怪物
function playerAtk() {
console.log("=== 攻擊開始 ===");
    console.log("1. 初始值:", battle.lightningActive);

    if (!canAtk || battle.mHp <= 0) return;

    let dmg = (player.inv && player.inv.includes('木劍')) ? 2 : 1;
    
    if(battle.perfectNext){ 
        dmg *= 2; 
        battle.perfectNext = false; 
    }

    // ⚡ 閃電傷害判定
    if (battle.lightningActive > 0) {
        dmg += 3;
        createEffect("⚡+3", 'monster-area');
        console.log(`[攻擊中] 閃電剩餘次數: ${battle.lightningActive}`);
    }
    
    // 特效與扣血
    const mImg = document.getElementById('monster-img');
    if (mImg) {
        mImg.classList.remove('shake-monster');
        void mImg.offsetWidth;
        mImg.classList.add('shake-monster');
    }
    createHitEffect();

    battle.mHp = Math.max(0, battle.mHp - dmg); 
    createEffect(`-${dmg}`, 'monster-area');
    
    // 回合結算
    if (battle.mHp <= 0) {
        canAtk = false; 
        setTimeout(() => winBattle(), 300);
    } else {
        nextTurn(); // 只有這裡會觸發扣除
    }

    updateBattleUI(); 
}

function nextTurn() {
    console.log("--- 進入回合結算 ---");

    // 1. 處理技能 CD (只減一次)
    for (let i = 0; i < battle.cd.length; i++) {
        if (battle.cd[i] > 0) battle.cd[i]--;
    }

    // 2. 處理雷電模式計數 (只減一次)
    if (battle.lightningActive > 0) {
        battle.lightningActive--;
        console.log(`[系統] 閃電次數扣除成功，剩餘: ${battle.lightningActive}`);
        
        if (battle.lightningActive === 0) {
            document.getElementById('battle-screen').classList.remove('lightning-mode');
            createEffect("⚡ 模式結束", 'monster-area');
        }
    }
}

// 更新失誤標記 UI 的函式 (確保這個函式存在)
function updateMissUI() {
    const marks = document.querySelectorAll('#miss-counter .miss-mark');
    if (marks.length === 0) return; // 防呆：如果找不到 UI 元素就不執行

    marks.forEach((mark, index) => {
        if (index < battle.missCount) {
            mark.classList.add('active');
        } else {
            mark.classList.remove('active');
        }
    });
}
// 修正後的處理失誤邏輯 (已包含小怪/BOSS 區分)
function playerMiss() {
    if (battle.mHp <= 0 || player.hp <= 0) return;

    battle.missCount++;
    updateMissUI();
    createEffect("MISS!", 'player-controls-area');

    // BOSS 戰即時扣血 (-1)
    if (battle.isBoss && battle.missCount < 3) {
        const bossConfig = BOSS_DATA[battle.currentZone];
        if (bossConfig && bossConfig.onMissDmg > 0) {
            player.hp = Math.max(0, player.hp - bossConfig.onMissDmg);
            createEffect(`⚡ 閃電反擊 -${bossConfig.onMissDmg}`, 'player-controls-area');
            updateBattleUI();
            if (player.hp <= 0) return gameOver();
        }
    }

    // 滿三次大傷判定 (-5 或 等級傷害)
    if (battle.missCount >= 3) {
        setTimeout(() => monsterAtk(), 300);
    } else {
        nextTurn();
    }
}

function gameOver() {
    // 1. 顯示戰敗訊息
    alert("💀 你被打倒了... 先回村莊休息吧。");

    // 2. 懲罰機制 (例如扣除 10% 金幣，可自行調整)
    const penalty = Math.floor(player.gold * 0.1);
    player.gold -= penalty;

    // 3. 復活狀態 (體力恢復到 50%，避免一出來又死掉)
    player.hp = Math.max(1, Math.floor(player.maxHp * 0.5));
    
    // 4. 重置戰鬥暫存狀態
    battle.missCount = 0;
    battle.isBoss = false;
    battle.lightningActive = 0;

    // 5. 儲存數據並回到選單
    saveAllData();
    showMenu(); // 呼叫原本的 showMenu 回到主畫面
}

// 怪物攻擊邏輯
function monsterAtk() {
    let dmg = 0;
    if (battle.isBoss) {
        const bossConfig = BOSS_DATA[battle.currentZone];
        dmg = bossConfig ? bossConfig.onTripleMissDmg : 5;
    } else {
        dmg = battle.mLv || 1; 
    }

    player.hp = Math.max(0, player.hp - dmg);
    const bScreen = document.getElementById('battle-screen');
    if (bScreen) bScreen.classList.add('shake-screen');

    createEffect(`💥 重擊 -${dmg}`, 'player-controls-area');
    updateBattleUI();

    setTimeout(() => {
        if (bScreen) bScreen.classList.remove('shake-screen');
        battle.missCount = 0; 
        updateMissUI();
        if (player.hp <= 0) gameOver();
        else nextTurn();
    }, 500);
}

// 3. 檢查 updateBattleUI 是否有包含血條更新
// (請確保您的代碼中有這段，否則被打血條也不會動)
function updateBattleUI() {
    if (!player || !battle) return;

    // --- 0. 裝備狀態標籤 (控制 CSS 變數換圖) ---
    // 科學容錯：確保 player.inv 存在且正確比對
    const hasBone = Array.isArray(player.inv) && player.inv.some(item => item && item.trim() === '閃電骨頭');
    if (hasBone) {
        document.body.classList.add('has-lightning-bone');
    } else {
        document.body.classList.remove('has-lightning-bone');
    }

    // --- 1. 更新怪物 UI ---
    const mHpFill = document.getElementById('m-hp-fill');
    const mHpTxt = document.getElementById('m-hp-txt');
    if (mHpFill) {
        const mPercent = (battle.mHp / battle.mMaxHp * 100);
        mHpFill.style.width = Math.max(0, mPercent) + '%';
    }
    if (mHpTxt) {
        mHpTxt.innerText = `${Math.max(0, Math.ceil(battle.mHp))}/${battle.mMaxHp}`;
    }

    // --- 2. 更新玩家血條 ---
    const pHpFill = document.getElementById('p-hp-fill');
    const pHpTxt = document.getElementById('p-hp-txt');
    if (pHpFill) {
        const pPercent = (player.hp / player.maxHp * 100);
        pHpFill.style.width = Math.max(0, pPercent) + '%';
    }
    if (pHpTxt) pHpTxt.innerText = `${player.hp}/${player.maxHp}`;

    // --- 3. 更新經驗值條 ---
    const pXpFill = document.getElementById('p-xp-fill');
    if (pXpFill) {
        const xpPercent = (player.xp / player.nextXp * 100);
        pXpFill.style.width = xpPercent + '%';
    }

    // --- 4. 更新技能與 CD ---
    for (let i = 1; i <= 3; i++) {
        const cdSpan = document.getElementById(`cd-${i}`);
        const btn = document.getElementById(`skill-${i}`);
        const currentCD = battle.cd[i - 1];

        // 更新 CD 數字 (使用 innerText 僅針對 span，不破壞按鈕結構)
        if (cdSpan) cdSpan.innerText = currentCD;

        // 更新按鈕鎖定狀態
        if (btn) {
            const lvReq = [0, 2, 3, 5][i]; // 技能1:Lv2, 2:Lv3, 3:Lv5
            btn.disabled = (player.lv < lvReq || currentCD > 0);
        }
    }

    // 更新打擊文字
    const atkBtn = document.getElementById('atk-display');
    if (atkBtn) {
        const hasSword = player.inv.some(i => i && i.trim() === '木劍');
        atkBtn.innerText = hasSword ? "🗡️ 使用木劍打擊" : "👊 普通打擊";
    }
}
// 產生打擊閃光元素
// --- 1. 擊中特效 (放在最外層，確保 playerAtk 抓得到) ---
function createHitEffect() {
    const area = document.getElementById('monster-area');
    if (!area) return;
    const flash = document.createElement('div');
    flash.className = 'hit-flash hit-active';
    area.appendChild(flash);
    setTimeout(() => {
        if (flash.parentNode) flash.remove();
    }, 300);
}

// --- 2. 回合結束處理 (整合 CD 與 閃電扣除) ---
function nextTurn() { 
    console.log("--- [系統] 回合結算中 ---");
    
    // 保持您的原本邏輯：處理技能 CD
    if (battle.cd) {
        battle.cd = battle.cd.map(c => Math.max(0, c - 1)); 
    }

    // 關鍵補強：處理閃電計數扣除
    if (battle.lightningActive > 0) {
        battle.lightningActive--;
        console.log(`[系統] ⚡ 閃電模式剩餘: ${battle.lightningActive}`);
        if (battle.lightningActive === 0) {
            createEffect("⚡ 模式結束", 'monster-area');
        }
    }

    updateBattleUI(); 
}

// --- 3. 技能使用邏輯 (保留您提供的所有分支與監控) ---
function useSkill(sid) {
    // 監視器：印出呼叫者
    console.warn("useSkill 被呼叫了！呼叫者是：", useSkill.caller ? useSkill.caller.name : "直接點擊");

    const pArea = 'player-controls-area';
    
    // 判定是否還在 CD 中，若在 CD 則不執行 (保護邏輯)
    if (battle.cd[sid - 1] > 0) return;

    if (sid === 1) { 
        battle.perfectNext = true; 
        battle.cd[0] = 3; 
        createEffect("READY!", pArea); 
    }
    else if (sid === 2) { 
        let r = Math.floor(Math.random() * 6) + 1; 
        battle.mHp -= r; 
        battle.cd[1] = 4; 
        createEffect(`🎲${r}`, 'monster-area'); 
        if (battle.mHp <= 0) return winBattle();
    }
    else if (sid === 3) { 
        // 🔒 科學防護：如果閃電次數 > 0，直接攔截，防止重複設為 3
        if (battle.lightningActive > 0) {
            console.log("[系統] 閃電模式進行中，剩餘：" + battle.lightningActive);
            return;
        }

        if (player.inv.includes('閃電骨頭')) {
            if (battle.lightningActive === 0) { 
                battle.lightningActive = 3; 
                battle.cd[2] = 5;
                createEffect("⚡ 雷擊模式", pArea);
                updateBattleUI(); // 手動更新 UI
                return; // 【關鍵】直接結束函式，不執行下方的 nextTurn()
                console.log("[系統] 閃電模式啟動：3 回合加成");
            }
        } else {
            // 基本治療：沒骨頭時執行
            player.hp = Math.min(player.maxHp, player.hp + 5); 
            battle.cd[2] = 5; 
            createEffect("HEAL!", pArea); 
        }
    }
    
    // 技能執行完畢，進入下一回合
    nextTurn();
}

    // 頂部常數區塊，新增怪物掉落表
// 掉落物數據表
const MONSTER_LOOT = {
    1: { gold: 1, xp: 5, items: [] },
    2: { gold: 2, xp: 8, items: [] },
    3: { 
        gold: 3, xp: 12, 
        items: [
            { name: "木劍", prob: 0.5, img: "https://drive.google.com/file/d/1cAFQkEzFLq6jU6ZibbqoYHFsYS3wIPhC/view?usp=sharing" }
        ] 
    },
    4: { gold: 3, xp: 15, items: [] },
    5: { 
        gold: 3, xp: 20, 
        items: [
            { name: "村長的眼鏡", prob: 0.3, img: "https://drive.google.com/file/d/1dRBqdIhqoEMc4l767mBSKcwpg2BFnYdU/view?usp=sharing" }
        ] 
    },
    6: { gold: 4, xp: 30, items: [] }
};

// ... (以下為函式區塊) ...

function winBattle() { 
    // 1. 勝利特效 (平板優化：稍微降低數量，並增加錯誤捕捉防止崩潰)
    try {
        confetti({ 
            particleCount: 60, // 從 100 降至 60 提高平板存活率
            spread: 70, 
            origin: { y: 0.6 },
            disableForReducedMotion: true 
        });
    } catch(e) { console.log("特效執行異常，略過以維持程序跑完"); }
    
    let lootConfig;
    const droppedItems = [];

    // 處理擊殺計數
    if (!battle.isBoss) {
        player.killCount = (player.killCount || 0) + 1;
    }

    // --- 掉落判定邏輯 (維持老師原版內容) ---
    if (battle.isBoss) {
        const boss = BOSS_DATA[battle.currentZone];
        console.log(`[戰鬥追蹤] 擊敗 BOSS: ${boss.name}`); 

        lootConfig = { 
            xp: boss.xp || 50, 
            gold: boss.gold || 10, 
            items: [] 
        };
        
        const proofName = `${boss.name}的通關證明`;
        if (!player.inv.includes(proofName)) {
            player.inv.push(proofName);
            droppedItems.push({ name: proofName, img: "" });
            console.log(`[掉落追蹤] 獲得通關證明`);
        }

        const roll = Math.random(); 
        console.log(`[掉落追蹤] 閃電骨頭機率判定: 骰出 ${roll.toFixed(3)} (需小於 0.150)`);

        if (roll < 0.15) {
            if (!player.inv.includes("閃電骨頭")) {
                player.inv.push("閃電骨頭");
                droppedItems.push({ 
                    name: "閃電骨頭", 
                    img: "https://drive.google.com/file/d/1TEYi0Cd0A0IBNi2oRdugq9l7dysa2M2g/view?usp=sharing" 
                });
                console.log(`[掉落追蹤] 恭喜！閃電骨頭成功掉落`);
            } else {
                console.log(`[掉落追蹤] 判定成功，但已有「閃電骨頭」`);
            }
        } else {
            console.log(`[掉落追蹤] 很遺憾，這次沒抽中`);
        }
        
        battle.isBoss = false;
    } else {
        lootConfig = MONSTER_LOOT[battle.mLv] || { gold: 1, xp: 5, items: [] };
        if (lootConfig.items && lootConfig.items.length > 0) {
            lootConfig.items.forEach(item => {
                if (Math.random() < item.prob) { 
                    player.inv.push(item.name);
                    droppedItems.push(item);
                }
            });
        }
    }
    
    // 2. 結算獎勵
    player.xp += lootConfig.xp; 
    player.gold += lootConfig.gold;

    // 3. 升級邏輯
    while(player.xp >= player.nextXp){ 
        player.lv++; 
        player.xp -= player.nextXp; 
        player.nextXp += 10; 
        player.maxHp += 2; 
        player.hp = player.maxHp; 
        console.log(`Level Up: ${player.lv}`);
    }

    // 4. 重置與儲存
    battle.missCount = 0;
    battle.lightningActive = 0;
    
    // 【平板優化關鍵】先標記戰鬥結束，避免重複觸發
    battle.inBattle = false;

    // 5. 更新 UI 與 儲存
    saveAllData(); 

    if (typeof updateLocationUI === "function") {
        updateLocationUI();
    }

    // 6. 顯示戰利品畫面 (針對平板：增加緩衝時間，確保「上傳頭像」造成的內存壓力被釋放)
    // 如果平板依然卡住，建議將 100 改為 300
    setTimeout(() => {
        // 先強行隱藏戰鬥視窗，減少平板渲染壓力
        const bScreen = document.getElementById('battle-screen');
        if (bScreen) bScreen.classList.add('hidden');
        
        showLootScreen(lootConfig.xp, lootConfig.gold, droppedItems);
    }, 200);
}
// 顯示戰利品結算畫面的函式 (這段您寫得很好，保留即可)
function showLootScreen(xp, gold, items) {
    // 1. 強制確保所有畫面隱藏，只顯示戰利品
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const lootScreen = document.getElementById('loot-screen');
    if (lootScreen) lootScreen.classList.remove('hidden');

   // 2. 顯示 XP 與 金幣 (✅ 修正：整合 GOLD_ICON 圖片)
    document.getElementById('xp-gold-display').innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
            <span style="color:#4a90e2; font-weight:bold;">✨ ${xp} XP</span>
            <span style="color:#f5a623; font-weight:bold; display: flex; align-items: center;">
                <img src="${GOLD_ICON}" style="width: 24px; margin-right: 5px; filter: drop-shadow(0 0 2px rgba(0,0,0,0.3));">
                ${gold}
            </span>
        </div>
    `;

    // 3. 處理掉落物顯示 (整合 ITEM_DATABASE 圖片邏輯)
    const dropArea = document.getElementById('item-drops');
    
    if (items && items.length > 0) {
        dropArea.innerHTML = items.map(item => {
            // 取得物品名稱 (處理可能是字串或物件的情況)
            const itemName = (typeof item === 'string' ? item : item.name).trim();
            
            // 🔍 從資料庫抓取對應圖片
            const imgUrl = ITEM_DATABASE[itemName];
            
            // 決定顯示內容：有圖出圖，沒圖出禮物盒
            const displayContent = imgUrl 
                ? `<img src="${imgUrl}" style="width:40px; height:40px; object-fit:contain; margin-bottom:5px;">`
                : `<div style="font-size:24px;">🎁</div>`;

            return `
                <div class="loot-item" style="text-align:center; background:#fff; padding:10px; border-radius:10px; border:1px solid #ddd; min-width:80px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                    ${displayContent}
                    <div style="font-size:14px; font-weight:bold; color:#333;">${itemName}</div>
                    <div style="font-size:10px; color:green;">取得成功!</div>
                </div>
            `;
        }).join('');
    } else {
        dropArea.innerHTML = "<p style='color:#999;'>這次沒有發現稀有物...</p>";
    }

    // --- 【科學修正核心】 ---
    
    // 4. 恢復攻擊權限，確保下一場戰鬥能點擊
    canAtk = true; 

    // 5. 強制執行一次最終存檔 (確保 XP、金幣、背包道具確實入庫)
    if (typeof saveAllData === "function") {
        saveAllData();
        console.log("[系統] 戰利品結算並存檔完成");
    }
}

function addToInv(itemName) {
    if (!player.inv) player.inv = [];
    
    // 1. 強制過濾掉名稱後的空格
    const cleanName = itemName.trim();
    const itemData = ITEM_DATABASE[cleanName];
    const isStackable = itemData && itemData.stackable !== false;

    // 2. 🔍 科學搜尋：同時檢查「純字串」或「物件」
    const existingIndex = player.inv.findIndex(it => {
        if (typeof it === 'string') return it === cleanName;
        if (it && typeof it === 'object') return it.name === cleanName;
        return false;
    });

    // 3. 處理逻辑
    if (existingIndex > -1 && isStackable) {
        // --- 找到重複，執行堆疊 ---
        let existingItem = player.inv[existingIndex];
        
        if (typeof existingItem === 'string') {
            // 如果原本是舊格式字串，強制升級成物件
            player.inv[existingIndex] = { name: cleanName, count: 2 };
        } else {
            // 如果已經是物件，數量 +1
            existingItem.count = (existingItem.count || 1) + 1;
        }
        console.log(`✅ ${cleanName} 已堆疊，目前數量: ${player.inv[existingIndex].count}`);
    } else {
        // --- 沒找到重複 或 不可堆疊，新增格子 ---
        if (player.inv.length >= 25) {
            console.error("❌ 背包已滿");
            return false;
        }
        // 核心修正：加入背包時，一律強制使用物件格式
        player.inv.push({ name: cleanName, count: 1 });
        console.log(`📦 ${cleanName} 已作為新物件存入`);
    }
    
    saveAllData();
    renderBackpack();
    return true;
}



 // 產生文字特效的工具函式
function createEffect(txt, parentId) {
    // 1. 取得容器
    const container = document.getElementById(parentId);
    if (!container) {
        console.warn(`找不到 ID 為 ${parentId} 的容器，特效將顯示在 body`);
    }

    // 2. 建立特效元素
    const div = document.createElement('div');
    div.className = 'damage-txt'; 
    div.innerText = txt;
    
    // 3. 決定掛載位置（如果找不到指定 ID 就掛在 body 上避免報錯）
    const target = container || document.body;
    target.appendChild(div);
    
    // 4. 800 毫秒後自動移除（配合 CSS 動畫時間）
    setTimeout(() => {
        if (div && div.parentNode) {
            div.remove();
        }
    }, 800);
}    


// 1. 切換背包開關
function toggleBackpack() {
    const modal = document.getElementById('backpack-modal');
    if (modal.classList.contains('hidden')) {
        renderBackpack(); // 開啟時刷新內容
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

// 2. 渲染背包內容 (5x5)
// --- 1. 物品資料庫 (已轉換為直接讀取連結) ---

// --- 2. 背包開關邏輯 ---
function toggleBackpack() {
    const modal = document.getElementById('backpack-modal');
    if (modal.classList.contains('hidden')) {
        renderBackpack(); // 開啟時刷新內容
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

// --- 3. 背包渲染邏輯 ---

function renderBackpack() {
    if (!player) return;

    const grid = document.getElementById('backpack-grid');
    const goldDisplay = document.getElementById('backpack-gold');
    
    // 1. 顯示金幣與圖片
    if (goldDisplay) {
        goldDisplay.innerHTML = `
            <img src="${GOLD_ICON}" style="width: 24px; vertical-align: middle; margin-right: 5px; filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));">
            ${player.gold}
        `;
    }

    // 2. 生成 25 格網格
    let gridHTML = "";
    for (let i = 0; i < 25; i++) {
        const invObj = player.inv[i];
        let content = ""; 
        let itemName = "";

        if (invObj) {
            // 💡 科學相容：判斷是物件還是舊格式字串
            itemName = (typeof invObj === 'string') ? invObj : invObj.name;
            const itemData = ITEM_DATABASE[itemName];
            const imgUrl = itemData ? itemData.img : null;
            const count = invObj.count || 1;

            if (imgUrl) {
                content = `<img src="${imgUrl}" style="width: 85%; height: 85%; object-fit: contain;">`;
                // 如果數量大於 1，顯示數量標籤
                if (count > 1) {
                    content += `<span class="item-count" style="position:absolute; bottom:2px; right:2px; background:rgba(0,0,0,0.7); color:#00ff00; font-size:10px; padding:0 4px; border-radius:4px;">${count}</span>`;
                }
            } else {
                content = `<span style="font-size: 24px;">🎁</span>`;
            }
        }

        // ✅ 關鍵補強：綁定點擊事件，並設置為 relative 以便顯示數量標籤
        gridHTML += `
            <div class="backpack-slot" 
                 onclick="selectPlayerItem(this, ${i})" 
                 title="${itemName}" 
                 style="position: relative; display: flex; align-items: center; justify-content: center;">
                 ${content}
            </div>`;
    }
    grid.innerHTML = gridHTML;
}

// 3. 修正原本的 renderPlayerStats，移除金幣顯示
function renderPlayerStats() {
    if (!player) return;
    const hpPercent = (player.hp / player.maxHp * 100);
    const xpPercent = (player.xp / player.nextXp * 100);
    
    document.getElementById('player-profile').innerHTML = `
        <img src="${player.avatar}" class="char-avatar">
        <div class="stats-container">
            <strong>${player.name} (Lv.${player.lv})</strong>
            <div class="bar-container">
                <div class="hp-fill" style="width:${hpPercent}%"></div>
                <div class="bar-text">${player.hp}/${player.maxHp}</div>
            </div>
            <div class="bar-container">
                <div class="xp-fill" style="width:${xpPercent}%"></div>
                <div class="bar-text">${player.xp}/${player.nextXp}</div>
            </div>
            </div>`;
}
/**
 * 鼓手練習系統 - 備份模組
 * 適用於：PC (下載/複製) 與 平板 (複製代碼)
 * 對接 Key: RPG_SaveData (單一當前角色)
 */

// 1. 導出存檔並自動複製 (最適合平板)
async function exportSaveToClipboard() {
    // 確保有最新資料
    if (typeof saveAllData === 'function') saveAllData();
    
    const saveData = localStorage.getItem('RPG_SaveData');
    if (!saveData) return alert("尚未有練習紀錄！");

    // Base64 編碼處理：確保字串在社群軟體或備忘錄傳輸時不因特殊字元損毀
    const encoded = btoa(encodeURIComponent(saveData));

    try {
        await navigator.clipboard.writeText(encoded);
        alert("✨ 存檔成功複製到剪貼簿！\n您可以貼在備忘錄中保存目前的練習進度。");
    } catch (err) {
        // 如果瀏覽器安全性攔截自動複製，則改用 prompt
        prompt("請長按全選並複製下方代碼：", encoded);
    }
}

// 2. 導入存檔 (代碼還原)
function importSaveFromInput() {
    const code = prompt("請貼入備份的存檔代碼：");
    if (!code) return;

    try {
        const decoded = decodeURIComponent(atob(code));
        // 科學驗證：確保內容是合法的 JSON 格式
        JSON.parse(decoded);
        
        // 寫入系統 Key，強制更新當前角色資料
        localStorage.setItem('RPG_SaveData', decoded);
        
        alert("✅ 紀錄導入成功！即將重新載入遊戲...");
        location.reload();
    } catch(e) {
        alert("❌ 無效的代碼，請確認是否完整複製（不可少任何字元）。");
    }
}

// 3. 下載存檔檔案 (最適合 PC 備份)
function downloadSaveAsFile() {
    if (typeof saveAllData === 'function') saveAllData();
    
    const saveData = localStorage.getItem('RPG_SaveData');
    if (!saveData) return alert("尚無紀錄可供下載");

    const blob = new Blob([saveData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // 檔名科學化：[日期] 鼓手名稱_練習紀錄.txt
    const date = new Date().toISOString().slice(0, 10);
    const fileName = (player && player.name) ? `${player.name}_練習紀錄` : "鼓手練習紀錄";
    
    a.download = `${date}_${fileName}.txt`;
    a.href = url;
    a.click();
    
    // 釋放記憶體
    URL.revokeObjectURL(url);
}



