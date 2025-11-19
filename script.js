// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', function() {

// Canvas 元素
const skyCanvas = document.getElementById('skyCanvas');
const drawCanvas = document.getElementById('drawCanvas');
const skyCtx = skyCanvas.getContext('2d');
const drawCtx = drawCanvas.getContext('2d');

// 按钮和控件元素
const styleButtons = document.querySelectorAll('.style-btn');
const uploadBtn = document.getElementById('uploadBtn');
const uploadInput = document.getElementById('uploadInput');
const sizeSelector = document.getElementById('sizeSelector');
const generateBtn = document.getElementById('generateBtn');
const saveBtn = document.getElementById('saveBtn');
const undoBtn = document.getElementById('undoBtn');
const clearDrawBtn = document.getElementById('clearDrawBtn');
const clearCloudBtn = document.getElementById('clearCloudBtn');
const brushSizeInput = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');

// 状态变量
let isDrawing = false;
let currentStyle = 1;
let brushSize = 20;
let clouds = []; // 存储生成的白云
let customBackground = null;
let drawingHistory = []; // 存储绘画历史记录
let currentHistoryIndex = -1; // 当前历史记录索引

// 云朵拖拽相关变量
let isDraggingCloud = false;
let selectedCloudIndex = -1;
let dragOffsetX = 0;
let dragOffsetY = 0;

// 6种天空渐变样式
const skyStyles = {
    1: {
        gradient: [
            { pos: 0, color: '#87CEEB' },
            { pos: 0.5, color: '#B0E0E6' },
            { pos: 1, color: '#E0F6FF' }
        ]
    },
    2: {
        gradient: [
            { pos: 0, color: '#4A90E2' },
            { pos: 0.6, color: '#87CEEB' },
            { pos: 1, color: '#D4E8F7' }
        ]
    },
    3: {
        gradient: [
            { pos: 0, color: '#1E3A8A' },
            { pos: 0.4, color: '#3B82F6' },
            { pos: 0.7, color: '#93C5FD' },
            { pos: 1, color: '#DBEAFE' }
        ]
    },
    4: {
        gradient: [
            { pos: 0, color: '#667eea' },
            { pos: 0.5, color: '#764ba2' },
            { pos: 1, color: '#C3B1E1' }
        ]
    },
    5: {
        gradient: [
            { pos: 0, color: '#FF6B9D' },
            { pos: 0.5, color: '#C371F5' },
            { pos: 1, color: '#E8D5FF' }
        ]
    },
    6: {
        gradient: [
            { pos: 0, color: '#FFA17F' },
            { pos: 0.5, color: '#FDCB6E' },
            { pos: 1, color: '#FFF4E6' }
        ]
    }
};

// 画布尺寸预设
const canvasSizes = {
    '1920x1080': { width: 1920, height: 1080, ratio: '16:9' },
    '1080x1080': { width: 1080, height: 1080, ratio: '1:1' },
    '1080x1920': { width: 1080, height: 1920, ratio: '9:16' },
    '1200x630': { width: 1200, height: 630, ratio: '1.9:1' },
    '1024x512': { width: 1024, height: 512, ratio: '2:1' },
    '1920x1200': { width: 1920, height: 1200, ratio: '16:10' },
    '2560x1440': { width: 2560, height: 1440, ratio: '16:9' },
    '750x1334': { width: 750, height: 1334, ratio: '9:16' }
};

// 初始化画布尺寸
function initCanvasSize() {
    const selectedSize = sizeSelector.value;
    const size = canvasSizes[selectedSize];
    
    // 设置天空画布
    skyCanvas.width = size.width;
    skyCanvas.height = size.height;
    
    // 更新尺寸信息显示
    updateSizeInfo();
    
    // 设置绘画画布（匹配天空画布的宽高比）
    updateDrawCanvasSize();
    
    // 绘制背景
    drawSkyBackground();
}

// 更新尺寸信息显示
function updateSizeInfo() {
    const selectedSize = sizeSelector.value;
    const size = canvasSizes[selectedSize];
    const ratio = (size.width / size.height).toFixed(2);
    const sizeInfo = document.querySelector('.size-info');
    if (sizeInfo) {
        sizeInfo.textContent = `${size.width} × ${size.height}px (${ratio}:1)`;
    }
}

// 更新绘画画布尺寸以匹配天空画布比例
function updateDrawCanvasSize() {
    const skyRatio = skyCanvas.width / skyCanvas.height;
    const containerWidth = drawCanvas.parentElement.offsetWidth - 20; // 减去padding
    const containerHeight = 320; // 固定高度
    
    let displayWidth, displayHeight;
    
    if (skyRatio > containerWidth / containerHeight) {
        // 宽度限制
        displayWidth = containerWidth;
        displayHeight = containerWidth / skyRatio;
    } else {
        // 高度限制
        displayHeight = containerHeight;
        displayWidth = containerHeight * skyRatio;
    }
    
    // 设置画布的CSS显示尺寸和实际尺寸相同（1:1，不缩放）
    drawCanvas.style.width = Math.floor(displayWidth) + 'px';
    drawCanvas.style.height = Math.floor(displayHeight) + 'px';
    drawCanvas.width = Math.floor(displayWidth);
    drawCanvas.height = Math.floor(displayHeight);
}

// 绘制天空背景
function drawSkyBackground() {
    if (customBackground) {
        // 绘制自定义上传的图片
        skyCtx.drawImage(customBackground, 0, 0, skyCanvas.width, skyCanvas.height);
    } else {
        // 绘制渐变背景
        const gradient = skyCtx.createLinearGradient(0, 0, 0, skyCanvas.height);
        const styleConfig = skyStyles[currentStyle];
        
        styleConfig.gradient.forEach(stop => {
            gradient.addColorStop(stop.pos, stop.color);
        });
        
        skyCtx.fillStyle = gradient;
        skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
    }
    
    // 重新绘制所有云朵
    clouds.forEach(cloud => {
        drawCloudOnSky(cloud);
    });
}

// 绘制云朵到天空画布
function drawCloudOnSky(cloudData) {
    skyCtx.save();
    
    // 多层云朵效果
    // 第1层：外发光
    skyCtx.shadowBlur = 30;
    skyCtx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    
    cloudData.points.forEach(point => {
        const gradient = skyCtx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, point.size * 1.5
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        skyCtx.fillStyle = gradient;
        skyCtx.beginPath();
        skyCtx.arc(point.x, point.y, point.size * 1.5, 0, Math.PI * 2);
        skyCtx.fill();
    });
    
    // 第2层：主体
    skyCtx.shadowBlur = 15;
    cloudData.points.forEach(point => {
        const gradient = skyCtx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, point.size
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
        
        skyCtx.fillStyle = gradient;
        skyCtx.beginPath();
        skyCtx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        skyCtx.fill();
    });
    
    // 第3层：高光
    skyCtx.shadowBlur = 5;
    cloudData.points.forEach(point => {
        const gradient = skyCtx.createRadialGradient(
            point.x - point.size * 0.3, point.y - point.size * 0.3, 0,
            point.x, point.y, point.size * 0.5
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        skyCtx.fillStyle = gradient;
        skyCtx.beginPath();
        skyCtx.arc(point.x - point.size * 0.3, point.y - point.size * 0.3, point.size * 0.5, 0, Math.PI * 2);
        skyCtx.fill();
    });
    
    skyCtx.restore();
}

// 手写涂鸦功能
function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        drawCtx.beginPath();
        // 保存当前绘画状态到历史记录
        saveDrawingState();
    }
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = drawCanvas.getBoundingClientRect();
    
    // 获取鼠标或触摸位置
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    // 计算相对于画布的位置
    const x = (clientX - rect.left) * (drawCanvas.width / rect.width);
    const y = (clientY - rect.top) * (drawCanvas.height / rect.height);
    
    drawCtx.lineWidth = brushSize;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCtx.strokeStyle = '#333';
    
    drawCtx.lineTo(x, y);
    drawCtx.stroke();
    drawCtx.beginPath();
    drawCtx.moveTo(x, y);
}

// 保存绘画状态
function saveDrawingState() {
    // 删除当前索引之后的所有历史记录
    drawingHistory = drawingHistory.slice(0, currentHistoryIndex + 1);
    
    // 保存当前画布状态
    const imageData = drawCanvas.toDataURL();
    drawingHistory.push(imageData);
    currentHistoryIndex++;
    
    // 限制历史记录数量（最多保存20步）
    if (drawingHistory.length > 20) {
        drawingHistory.shift();
        currentHistoryIndex--;
    }
    
    updateUndoButton();
}

// 撤回功能
function undoDrawing() {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        const imageData = drawingHistory[currentHistoryIndex];
        
        // 加载历史图像
        const img = new Image();
        img.onload = function() {
            drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            drawCtx.drawImage(img, 0, 0);
        };
        img.src = imageData;
    } else if (currentHistoryIndex === 0) {
        // 回到空白画布
        currentHistoryIndex = -1;
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    }
    
    updateUndoButton();
}

// 更新撤回按钮状态
function updateUndoButton() {
    if (undoBtn) {
        undoBtn.disabled = currentHistoryIndex < 0;
        if (currentHistoryIndex < 0) {
            undoBtn.style.opacity = '0.5';
            undoBtn.style.cursor = 'not-allowed';
        } else {
            undoBtn.style.opacity = '1';
            undoBtn.style.cursor = 'pointer';
        }
    }
}

// 生成云朵
function generateCloud() {
    const imageData = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    const data = imageData.data;
    
    const drawnPoints = [];
    for (let y = 0; y < drawCanvas.height; y += 5) {
        for (let x = 0; x < drawCanvas.width; x += 5) {
            const index = (y * drawCanvas.width + x) * 4;
            const alpha = data[index + 3];
            
            if (alpha > 50) {
                drawnPoints.push({ x, y });
            }
        }
    }
    
    if (drawnPoints.length === 0) {
        alert('请先在画板上绘制内容！');
        return;
    }
    
    // 转换坐标到天空画布
    const scaleX = skyCanvas.width / drawCanvas.width;
    const scaleY = skyCanvas.height / drawCanvas.height;
    
    const offsetY = skyCanvas.height * 0.25;
    
    const cloudPoints = drawnPoints.map(point => ({
        x: point.x * scaleX,
        y: point.y * scaleY * 0.5 + offsetY,
        size: brushSize * scaleX * (Math.random() * 0.4 + 0.8)
    }));
    
    // 计算云朵边界（用于碰撞检测）
    const minX = Math.min(...cloudPoints.map(p => p.x - p.size * 1.5));
    const maxX = Math.max(...cloudPoints.map(p => p.x + p.size * 1.5));
    const minY = Math.min(...cloudPoints.map(p => p.y - p.size * 1.5));
    const maxY = Math.max(...cloudPoints.map(p => p.y + p.size * 1.5));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const cloudData = { 
        points: cloudPoints,
        centerX: centerX,
        centerY: centerY,
        minX: minX,
        maxX: maxX,
        minY: minY,
        maxY: maxY
    };
    clouds.push(cloudData);
    
    drawCloudOnSky(cloudData);
    clearDrawCanvas();
}

// 清除绘画画布
function clearDrawCanvas() {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    // 清空历史记录
    drawingHistory = [];
    currentHistoryIndex = -1;
    updateUndoButton();
}

// 清除所有云朵
function clearAllClouds() {
    clouds = [];
    drawSkyBackground();
}

// 保存作品
function saveImage() {
    const link = document.createElement('a');
    link.download = `cloud_art_${Date.now()}.png`;
    link.href = skyCanvas.toDataURL('image/png');
    link.click();
}

// ===== 云朵拖拽功能 =====

// 检测点击是否在云朵上
function getCloudAtPosition(x, y) {
    // 从后往前遍历（最新的云朵在最上层）
    for (let i = clouds.length - 1; i >= 0; i--) {
        const cloud = clouds[i];
        if (x >= cloud.minX && x <= cloud.maxX && 
            y >= cloud.minY && y <= cloud.maxY) {
            return i;
        }
    }
    return -1;
}

// 开始拖拽云朵
function startDraggingCloud(e) {
    const rect = skyCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (skyCanvas.width / rect.width);
    const y = (e.clientY - rect.top) * (skyCanvas.height / rect.height);
    
    selectedCloudIndex = getCloudAtPosition(x, y);
    
    if (selectedCloudIndex !== -1) {
        isDraggingCloud = true;
        const cloud = clouds[selectedCloudIndex];
        dragOffsetX = x - cloud.centerX;
        dragOffsetY = y - cloud.centerY;
        skyCanvas.style.cursor = 'grabbing';
        e.preventDefault();
    }
}

// 拖拽云朵
function dragCloud(e) {
    if (!isDraggingCloud || selectedCloudIndex === -1) return;
    
    const rect = skyCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (skyCanvas.width / rect.width);
    const y = (e.clientY - rect.top) * (skyCanvas.height / rect.height);
    
    const cloud = clouds[selectedCloudIndex];
    const newCenterX = x - dragOffsetX;
    const newCenterY = y - dragOffsetY;
    
    // 计算偏移量
    const deltaX = newCenterX - cloud.centerX;
    const deltaY = newCenterY - cloud.centerY;
    
    // 更新云朵所有点的位置
    cloud.points.forEach(point => {
        point.x += deltaX;
        point.y += deltaY;
    });
    
    // 更新边界
    cloud.centerX = newCenterX;
    cloud.centerY = newCenterY;
    cloud.minX += deltaX;
    cloud.maxX += deltaX;
    cloud.minY += deltaY;
    cloud.maxY += deltaY;
    
    // 重绘天空
    drawSkyBackground();
}

// 停止拖拽云朵
function stopDraggingCloud() {
    if (isDraggingCloud) {
        isDraggingCloud = false;
        selectedCloudIndex = -1;
        skyCanvas.style.cursor = 'default';
    }
}

// 鼠标悬停时改变光标
function handleCloudHover(e) {
    if (isDraggingCloud) return;
    
    const rect = skyCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (skyCanvas.width / rect.width);
    const y = (e.clientY - rect.top) * (skyCanvas.height / rect.height);
    
    const cloudIndex = getCloudAtPosition(x, y);
    skyCanvas.style.cursor = cloudIndex !== -1 ? 'grab' : 'default';
}

// 切换样式
function switchStyle(styleNum) {
    currentStyle = styleNum;
    customBackground = null;
    
    // 更新按钮状态
    styleButtons.forEach(btn => {
        if (parseInt(btn.dataset.style) === styleNum) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    drawSkyBackground();
}

// 上传自定义背景
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            customBackground = img;
            
            // 取消所有样式按钮的激活状态
            styleButtons.forEach(btn => btn.classList.remove('active'));
            
            drawSkyBackground();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// 事件监听器

// 样式按钮
styleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const styleNum = parseInt(btn.dataset.style);
        switchStyle(styleNum);
    });
});

// 上传按钮
uploadBtn.addEventListener('click', () => {
    uploadInput.click();
});

uploadInput.addEventListener('change', handleImageUpload);

// 尺寸选择器
sizeSelector.addEventListener('change', initCanvasSize);

// 绘画画布事件
drawCanvas.addEventListener('mousedown', startDrawing);
drawCanvas.addEventListener('mousemove', draw);
drawCanvas.addEventListener('mouseup', stopDrawing);
drawCanvas.addEventListener('mouseout', stopDrawing);

// 天空画布云朵拖拽事件
skyCanvas.addEventListener('mousedown', startDraggingCloud);
skyCanvas.addEventListener('mousemove', (e) => {
    if (isDraggingCloud) {
        dragCloud(e);
    } else {
        handleCloudHover(e);
    }
});
skyCanvas.addEventListener('mouseup', stopDraggingCloud);
skyCanvas.addEventListener('mouseleave', stopDraggingCloud);

// 触摸事件（绘画画布）
drawCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    drawCanvas.dispatchEvent(mouseEvent);
});

drawCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    drawCanvas.dispatchEvent(mouseEvent);
});

drawCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopDrawing();
});

// 触摸事件（天空画布云朵拖拽）
skyCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    startDraggingCloud(mouseEvent);
});

skyCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isDraggingCloud) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        dragCloud(mouseEvent);
    }
});

skyCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopDraggingCloud();
});

// 操作按钮
generateBtn.addEventListener('click', generateCloud);
saveBtn.addEventListener('click', saveImage);
undoBtn.addEventListener('click', undoDrawing);
clearDrawBtn.addEventListener('click', clearDrawCanvas);
clearCloudBtn.addEventListener('click', clearAllClouds);

// 画笔大小
brushSizeInput.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
    brushSizeValue.textContent = brushSize;
});

// 窗口大小改变
window.addEventListener('resize', () => {
    const tempClouds = [...clouds];
    const tempCustomBg = customBackground;
    initCanvasSize();
    clouds = tempClouds;
    customBackground = tempCustomBg;
    drawSkyBackground();
});

// 初始化
initCanvasSize();
updateUndoButton(); // 初始化撤回按钮状态

}); // DOMContentLoaded 结束
