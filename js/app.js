// 全局常量（保留11列EV值）
const EV_VALUES = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]; // 11列
const CELL_WIDTH = 60; // 单元格/标尺列宽度
const CELL_HEIGHT = 80; // 单元格高度
const CARD_WIDTH = 58; // 卡片宽度
const CARD_HEIGHT = 78; // 卡片高度
const MIDDLE_INDEX = 5; // 表格中心列索引（0EV）
const CARD_COUNT = 9; // 卡片数量
const CARD_GAP = 10; // 卡片间距

// 核心：计算9个卡片的居中偏移（以表格中心为基准）
const TABLE_TOTAL_WIDTH = 11 * CELL_WIDTH; // 表格总宽度660px
const CARDS_TOTAL_WIDTH = CARD_COUNT * CARD_WIDTH + (CARD_COUNT - 1) * CARD_GAP; // 9个卡片总宽度602px
const CENTER_OFFSET = (TABLE_TOTAL_WIDTH - CARDS_TOTAL_WIDTH) / 2; // 居中偏移量29px

// 卡片初始位置（基于居中偏移，整体中心与表格中心对齐）
const CARD_INITIAL_POSITIONS = {};
for (let i = 1; i <= CARD_COUNT; i++) {
    CARD_INITIAL_POSITIONS[i] = {
        x: CENTER_OFFSET + (CARD_WIDTH + CARD_GAP) * (i - 1),
        y: 0
    };
}

// 标尺拖动变量
let isDragging = false;
let startX = 0;
let startTranslateX = 0;

// DOM元素
const landscapeTip = document.querySelector('.landscape-tip');
const evRuler = document.getElementById('evRuler');
const exposureTable = document.getElementById('exposureTable');
const exposureCardsContainer = document.getElementById('exposureCardsContainer');
const resetTableBtn = document.getElementById('resetTable');
const resetCardsBtn = document.getElementById('resetCards');
const resetRulerBtn = document.getElementById('resetRuler');
const toast = document.getElementById('toast');

// 初始化
window.addEventListener('load', init);

function init() {
    generateTableCells();
    generateEVRuler();
    generateExposureCards();
    bindEvents();
    checkOrientation();
    alignRulerToMiddle();
}

// 生成11个表格单元格
function generateTableCells() {
    EV_VALUES.forEach((_, index) => {
        const cell = document.createElement('div');
        cell.className = 'table-cell';
        cell.dataset.index = index;
        exposureTable.appendChild(cell);
    });
}

// 生成11列EV标尺（亚当斯法适配）
function generateEVRuler() {
    EV_VALUES.forEach((ev, index) => {
        const column = document.createElement('div');
        const evClass = ev < 0 ? `ev-neg${Math.abs(ev)}` : ev > 0 ? `ev-pos${ev}` : 'ev-0';
        column.className = `ev-column ${evClass}`;
        column.dataset.index = index;
        column.textContent = ev > 0 ? `+${ev}` : ev < 0 ? `-${Math.abs(ev)}` : ev;
        evRuler.appendChild(column);
    });
}

// 生成9个曝光卡片（居中对齐）
function generateExposureCards() {
    for (let i = 1; i <= CARD_COUNT; i++) {
        const card = document.createElement('div');
        card.className = 'exposure-card';
        card.id = `exposureCard-${i}`;
        card.dataset.cardId = i;
        card.draggable = true;
        // 应用居中后的初始位置
        card.style.left = `${CARD_INITIAL_POSITIONS[i].x}px`;
        card.style.top = `${CARD_INITIAL_POSITIONS[i].y}px`;
        card.innerHTML = `
            <span class="card-label">${i}</span>
            <input type="text" class="card-input" placeholder="区域" id="areaInput-${i}">
            <input type="text" class="card-input" placeholder="快门" id="shutterInput-${i}">
        `;
        exposureCardsContainer.appendChild(card);
    }
}

// 绑定所有事件
function bindEvents() {
    // 横竖屏/窗口调整
    window.addEventListener('resize', throttle(() => {
        checkOrientation();
        alignRulerToNearestCell();
    }, 200));
    window.addEventListener('orientationchange', throttle(() => {
        checkOrientation();
        alignRulerToNearestCell();
    }, 200));

    // 标尺拖动
    bindRulerDrag();

    // 卡片拖拽
    bindCardDrag();

    // 按钮事件
    resetTableBtn.addEventListener('click', resetTable);
    resetCardsBtn.addEventListener('click', resetCardsContent);
    resetRulerBtn.addEventListener('click', () => {
        alignRulerToMiddle();
        showToast('标尺已恢复默认位置（0EV对齐中间列）');
    });
}

// 横竖屏检测
function checkOrientation() {
    if (window.matchMedia('(orientation: landscape)').matches) {
        landscapeTip.classList.add('hidden');
    } else {
        landscapeTip.classList.remove('hidden');
    }
}

// 标尺拖动逻辑
function bindRulerDrag() {
    // 桌面端鼠标事件
    evRuler.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startTranslateX = getCurrentTranslateX(evRuler);
        evRuler.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const deltaX = e.clientX - startX;
        evRuler.style.transform = `translateX(${startTranslateX + deltaX}px)`;
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        evRuler.style.cursor = 'grab';
        alignRulerToNearestCell();
        showToast('标尺已就近对齐表格列');
    });

    // 移动端触摸事件
    evRuler.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startTranslateX = getCurrentTranslateX(evRuler);
        evRuler.style.cursor = 'grabbing';
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        evRuler.style.transform = `translateX(${startTranslateX + deltaX}px)`;
    });

    document.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        evRuler.style.cursor = 'grab';
        alignRulerToNearestCell();
        showToast('标尺已就近对齐表格列');
    });

    document.addEventListener('touchcancel', () => {
        isDragging = false;
        evRuler.style.cursor = 'grab';
    });
}

// 获取元素当前translateX值
function getCurrentTranslateX(el) {
    const transform = window.getComputedStyle(el).transform;
    if (transform === 'none') return -50;
    const matrix = transform.split(',');
    const translateX = parseFloat(matrix[4] || 0);
    return translateX;
}

// 标尺就近对齐表格列
function alignRulerToNearestCell() {
    const tableRect = exposureTable.getBoundingClientRect();
    const rulerRect = evRuler.getBoundingClientRect();
    const rulerRelativeX = rulerRect.left - tableRect.left;
    const alignedOffset = Math.round(rulerRelativeX / CELL_WIDTH) * CELL_WIDTH;
    const currentTranslateX = getCurrentTranslateX(evRuler);
    const deltaX = alignedOffset - rulerRelativeX;
    evRuler.style.transform = `translateX(${currentTranslateX + deltaX}px)`;
}

// 标尺对齐中间列（0EV）
function alignRulerToMiddle() {
    const tableRect = exposureTable.getBoundingClientRect();
    const rulerRect = evRuler.getBoundingClientRect();
    const tableMiddleX = tableRect.left + MIDDLE_INDEX * CELL_WIDTH;
    const rulerMiddleX = rulerRect.left + MIDDLE_INDEX * CELL_WIDTH;
    const deltaX = tableMiddleX - rulerMiddleX;
    const currentTranslateX = getCurrentTranslateX(evRuler);
    evRuler.style.transform = `translateX(${currentTranslateX + deltaX}px)`;
}

// 卡片拖拽逻辑
function bindCardDrag() {
    const cards = document.querySelectorAll('.exposure-card');

    // 桌面端拖拽
    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.dataset.cardId);
            card.style.zIndex = 30;
            card.style.opacity = '0.8';
        });

        card.addEventListener('dragend', () => {
            card.style.zIndex = 20;
            card.style.opacity = '1';
        });

        // 移动端触摸
        card.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            card.dataset.startX = touch.clientX;
            card.dataset.startY = touch.clientY;
            card.dataset.originalX = card.getBoundingClientRect().left;
            card.dataset.originalY = card.getBoundingClientRect().top;
            card.style.zIndex = 30;
            card.style.opacity = '0.8';
        });
    });

    // 允许放置
    document.addEventListener('dragover', (e) => e.preventDefault());

    // 处理放置
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        const card = document.getElementById(`exposureCard-${cardId}`);
        const targetCell = e.target.closest('.table-cell');
        handleCardDrop(card, targetCell);
    });

    // 移动端触摸移动
    document.addEventListener('touchmove', (e) => {
        const card = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY).closest('.exposure-card');
        if (!card || !card.dataset.startX) return;
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - parseInt(card.dataset.startX);
        const deltaY = touch.clientY - parseInt(card.dataset.startY);
        card.style.left = `${parseInt(card.dataset.originalX) + deltaX}px`;
        card.style.top = `${parseInt(card.dataset.originalY) + deltaY}px`;
    });

    // 移动端触摸结束
    document.addEventListener('touchend', (e) => {
        const touch = e.changedTouches[0];
        const card = document.elementFromPoint(touch.clientX, touch.clientY).closest('.exposure-card');
        if (!card) return;
        const targetCell = document.elementFromPoint(touch.clientX, touch.clientY).closest('.table-cell');
        handleCardDrop(card, targetCell);
        card.style.zIndex = 20;
        card.style.opacity = '1';
        delete card.dataset.startX;
        delete card.dataset.startY;
    });
}

// 处理卡片放置
function handleCardDrop(card, targetCell) {
    const cardId = card.dataset.cardId;
    if (targetCell) {
        if (targetCell.querySelector('.exposure-card')) {
            showToast(`卡片${cardId}：该单元格已有卡片`);
            resetCardPosition(card);
            return;
        }
        card.style.position = 'absolute';
        card.style.left = `${(CELL_WIDTH - CARD_WIDTH) / 2}px`;
        card.style.top = `${(CELL_HEIGHT - CARD_HEIGHT) / 2}px`;
        targetCell.appendChild(card);
        showToast(`卡片${cardId}已绑定到单元格`);
    } else {
        resetCardPosition(card);
        showToast(`卡片${cardId}已恢复原位置`);
    }
}

// 重置卡片位置（恢复居中后的初始位置）
function resetCardPosition(card) {
    const cardId = card.dataset.cardId;
    const initialPos = CARD_INITIAL_POSITIONS[cardId];
    exposureCardsContainer.appendChild(card);
    card.style.position = 'absolute';
    card.style.left = `${initialPos.x}px`;
    card.style.top = `${initialPos.y}px`;
    card.style.zIndex = 20;
}

// 重设表格（恢复卡片居中位置）
function resetTable() {
    const cards = document.querySelectorAll('.exposure-card');
    cards.forEach(card => resetCardPosition(card));
    showToast('所有卡片已重置到居中初始位置，输入值已保留');
}

// 重设卡片（清空内容）
function resetCardsContent() {
    const cardInputs = document.querySelectorAll('.exposure-card .card-input');
    cardInputs.forEach(input => {
        input.value = '';
        input.placeholder = input.id.includes('area') ? '区域' : '快门';
    });
    showToast('所有卡片内容已清空');
}

// 提示框
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// 节流函数
function throttle(fn, delay) {
    let timer = null;
    return (...args) => {
        if (!timer) {
            timer = setTimeout(() => {
                fn.apply(this, args);
                timer = null;
            }, delay);
        }
    };
}
