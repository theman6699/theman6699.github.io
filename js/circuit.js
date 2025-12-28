(function() {
    // 创建 Canvas 元素
    var canvas = document.createElement('canvas');
    canvas.id = 'circuit-bg';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1'; // 置于最底层
    canvas.style.opacity = '0.4'; // 透明度，避免干扰文字
    canvas.style.pointerEvents = 'none'; // 不阻挡鼠标点击
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var width, height;
    var traces = [];
    var gridSize = 30; // 网格大小

    // 调整大小
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initTraces();
    }

    // 初始化电路走线
    function initTraces() {
        traces = [];
        var cols = Math.ceil(width / gridSize);
        var rows = Math.ceil(height / gridSize);
        var count = Math.floor((cols * rows) / 20); // 走线密度

        for (var i = 0; i < count; i++) {
            var startX = Math.floor(Math.random() * cols) * gridSize;
            var startY = Math.floor(Math.random() * rows) * gridSize;
            var path = [{x: startX, y: startY}];
            
            var currX = startX;
            var currY = startY;
            var len = 3 + Math.floor(Math.random() * 5); // 走线长度
            
            // 生成随机折线路径
            for (var j = 0; j < len; j++) {
                if (Math.random() > 0.5) {
                    currX += (Math.random() > 0.5 ? gridSize : -gridSize);
                } else {
                    currY += (Math.random() > 0.5 ? gridSize : -gridSize);
                }
                // 边界检查
                if(currX < 0 || currX > width || currY < 0 || currY > height) break;
                path.push({x: currX, y: currY});
            }
            
            if(path.length > 1) {
                traces.push({
                    path: path,
                    signal: {
                        currSegment: 0,
                        progress: 0,
                        speed: 0.02 + Math.random() * 0.03, // 信号传输速度
                        active: Math.random() > 0.5 // 是否激活
                    }
                });
            }
        }
    }

    // 绘制循环
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // 1. 绘制静态走线 (PCB Traces)
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        traces.forEach(function(trace) {
            ctx.strokeStyle = '#e0e0e0'; // 浅灰色走线
            ctx.beginPath();
            ctx.moveTo(trace.path[0].x, trace.path[0].y);
            for (var i = 1; i < trace.path.length; i++) {
                ctx.lineTo(trace.path[i].x, trace.path[i].y);
            }
            ctx.stroke();

            // 绘制焊盘 (Pads)
            ctx.fillStyle = '#d0d0d0';
            ctx.beginPath();
            ctx.arc(trace.path[0].x, trace.path[0].y, 3, 0, Math.PI * 2);
            ctx.arc(trace.path[trace.path.length-1].x, trace.path[trace.path.length-1].y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // 2. 绘制动态信号 (Signals)
        ctx.lineWidth = 3;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00BFFF'; // 亮蓝色光晕

        traces.forEach(function(trace) {
            var sig = trace.signal;
            if (!sig.active) {
                if(Math.random() > 0.99) sig.active = true; // 随机激活
                return;
            }

            var p1 = trace.path[sig.currSegment];
            var p2 = trace.path[sig.currSegment + 1];

            // 计算当前信号位置
            var x = p1.x + (p2.x - p1.x) * sig.progress;
            var y = p1.y + (p2.y - p1.y) * sig.progress;

            // 绘制信号头
            ctx.strokeStyle = '#00BFFF'; // 深天蓝
            ctx.beginPath();
            // 绘制一个小拖尾
            var tailLen = 0.2; 
            var tailX = x - (p2.x - p1.x) * tailLen;
            var tailY = y - (p2.y - p1.y) * tailLen;
            
            // 简单的点绘制
            ctx.moveTo(x, y);
            ctx.lineTo(x - (p2.x - p1.x) * 0.05, y - (p2.y - p1.y) * 0.05);
            ctx.stroke();
            
            // 绘制发光点
            ctx.fillStyle = '#00BFFF';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI*2);
            ctx.fill();

            // 更新进度
            sig.progress += sig.speed;
            if (sig.progress >= 1) {
                sig.progress = 0;
                sig.currSegment++;
                if (sig.currSegment >= trace.path.length - 1) {
                    sig.currSegment = 0;
                    sig.active = false; // 跑完一圈休息一下
                }
            }
        });
        
        ctx.shadowBlur = 0; // 重置阴影
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animate();
})();