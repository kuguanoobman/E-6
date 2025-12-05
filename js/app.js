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
    // 计算卡片之间的间隙距离：每个卡片宽度 + 间隙
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
    
    // 调试：打印卡片初始位置
    console.log('=== 卡片初始位置 ===');
    console.log('CENTER_OFFSET:', CENTER_OFFSET);
    console.log('TABLE_TOTAL_WIDTH:', TABLE_TOTAL_WIDTH);
    console.log('CARDS_TOTAL_WIDTH:', CARDS_TOTAL_WIDTH);
    for (let i = 1; i <= CARD_COUNT; i++) {
        console.log(`卡片${i}: x=${CARD_INITIAL_POSITIONS[i].x}px, y=${CARD_INITIAL_POSITIONS[i].y}px`);
    }
    
    bindEvents();
    alignRulerToMiddle();
    adjustViewportScale();
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
        card.style.position = 'absolute';
        card.style.left = `${CARD_INITIAL_POSITIONS[i].x}px`;
        card.style.top = `${CARD_INITIAL_POSITIONS[i].y}px`;
        card.innerHTML = `
            <div class="card-handle">≡</div>
            <span class="card-label">${i}</span>
            <input type="text" class="card-input" placeholder="区域" id="areaInput-${i}">
            <input type="text" class="card-input" placeholder="快门" id="shutterInput-${i}">
        `;
        exposureCardsContainer.appendChild(card);
    }
}

// 绑定所有事件
function bindEvents() {
    // 窗口调整
    window.addEventListener('resize', throttle(() => {
        alignRulerToNearestCell();
        adjustViewportScale();
    }, 200));

    // 方向变化（横竖屏切换）
    window.addEventListener('orientationchange', throttle(() => {
        setTimeout(adjustViewportScale, 100); // 延迟以确保尺寸更新
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
            // Only start custom dragging for single-finger touches.
            if (e.touches && e.touches.length === 1) {
                e.preventDefault();
                isDragging = true;
                const touch = e.touches[0];
                startX = touch.clientX;
                startTranslateX = getCurrentTranslateX(evRuler);
                evRuler.style.cursor = 'grabbing';
            } else {
                // For multi-touch (pinch) do not prevent default — allow pinch-zoom.
                isDragging = false;
            }
        });

    document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            // still single-touch dragging
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
    if (transform === 'none') return 0;
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
    let activeCard = null; // 追踪当前被拖动的卡片

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
            // 检查是否点击了输入框，如果是则不启动拖拽
            if (e.target.classList.contains('card-input')) {
                return;
            }

            // Only treat single-finger touches as drag starts. Allow multi-touch (pinch) to proceed.
            if (e.touches && e.touches.length === 1) {
                e.preventDefault(); // 在卡片上立即阻止默认行为
                activeCard = card;
                const touch = e.touches[0];
                
                // 保存初始触摸位置和卡片位置
                card.dataset.startX = touch.clientX;
                card.dataset.startY = touch.clientY;
                // 保存卡片的当前style.left和style.top值
                card.dataset.initialLeft = parseFloat(card.style.left) || 0;
                card.dataset.initialTop = parseFloat(card.style.top) || 0;
                
                card.style.zIndex = 30;
                card.style.opacity = '0.8';
            }
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
        if (!activeCard || !activeCard.dataset.startX) return;

        // 如果正在编辑输入框，不处理拖拽
        if (e.target.closest('.card-input')) {
            return;
        }

        // 在卡片上滑动，阻止页面滑动并移动卡片
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - parseInt(activeCard.dataset.startX);
        const deltaY = touch.clientY - parseInt(activeCard.dataset.startY);
        
        const newLeft = parseInt(activeCard.dataset.initialLeft) + deltaX;
        const newTop = parseInt(activeCard.dataset.initialTop) + deltaY;
        
        activeCard.style.left = `${newLeft}px`;
        activeCard.style.top = `${newTop}px`;
    }, { passive: false });

    // 移动端触摸结束
    document.addEventListener('touchend', (e) => {
        if (!activeCard) return;

        const touch = e.changedTouches[0];
        
        // 临时隐藏卡片，以便获取其下方的元素
        activeCard.style.visibility = 'hidden';
        // 获取触摸位置的元素
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        // 恢复卡片可见性
        activeCard.style.visibility = 'visible';
        
        const targetCell = targetElement.closest('.table-cell');
        
        handleCardDrop(activeCard, targetCell);
        activeCard.style.zIndex = 20;
        activeCard.style.opacity = '1';
        delete activeCard.dataset.startX;
        delete activeCard.dataset.startY;
        delete activeCard.dataset.initialLeft;
        delete activeCard.dataset.initialTop;
        activeCard = null;
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

// 动态调整视口缩放，使内容在横屏时合适显示
function adjustViewportScale() {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) return;

    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;

    // 横竖屏判定
    const isLandscape = window.innerWidth > window.innerHeight;

    if (isLandscape) {
        // 横屏：计算合适的缩放比例
        const pageHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        
        // 如果内容高度超过窗口高度，计算缩放比例
        if (pageHeight > windowHeight) {
            const scale = Math.max(0.6, windowHeight / pageHeight);
            // 动态更新 viewport 的 initial-scale
            viewportMeta.setAttribute('content', 
                `width=device-width, initial-scale=${scale.toFixed(2)}, viewport-fit=cover`);
        } else {
            // 内容能完全显示，恢复默认缩放
            viewportMeta.setAttribute('content', 
                'width=device-width, initial-scale=1.0, viewport-fit=cover');
        }
    } else {
        // 竖屏：恢复默认缩放
        viewportMeta.setAttribute('content', 
            'width=device-width, initial-scale=1.0, viewport-fit=cover');
    }
}