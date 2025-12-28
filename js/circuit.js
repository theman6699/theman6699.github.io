(function() {
    // 创建 Canvas 元素
    var canvas = document.createElement('canvas');
    canvas.id = 'circuit-bg';
    canvas.style.position = 'absolute'; // 改为 absolute 以随页面滚动
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.zIndex = '-1'; // 置于最底层
    canvas.style.opacity = '0.8'; // 提高不透明度
    canvas.style.pointerEvents = 'none'; // 不阻挡鼠标点击
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var width, height;
    var traces = [];
    var chips = []; // 芯片装饰
    var gridSize = 40; // 网格大小

    // 调整大小
    function resize() {
        width = canvas.width = document.documentElement.clientWidth;
        height = canvas.height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        canvas.style.height = height + 'px';
        initTraces();
    }

    // 初始化电路走线和元件
    function initTraces() {
        traces = [];
        chips = [];
        var cols = Math.ceil(width / gridSize);
        var rows = Math.ceil(height / gridSize);
        
        // 1. 生成一些随机芯片 (矩形块)
        var chipCount = Math.floor((cols * rows) / 100);
        for(var i=0; i<chipCount; i++) {
            var w = 2 + Math.floor(Math.random() * 3); // 占几格宽
            var h = 2 + Math.floor(Math.random() * 3); // 占几格高
            var x = Math.floor(Math.random() * (cols - w));
            var y = Math.floor(Math.random() * (rows - h));
            chips.push({x: x * gridSize, y: y * gridSize, w: w * gridSize, h: h * gridSize});
        }

        // 2. 生成走线
        var traceCount = Math.floor((cols * rows) / 15); // 增加密度

        for (var i = 0; i < traceCount; i++) {
            var startX = Math.floor(Math.random() * cols) * gridSize;
            var startY = Math.floor(Math.random() * rows) * gridSize;
            
            // 避开芯片区域 (简单判断)
            var inChip = false;
            for(var c of chips) {
                if(startX >= c.x && startX <= c.x + c.w && startY >= c.y && startY <= c.y + c.h) {
                    inChip = true; break;
                }
            }
            if(inChip) continue;

            var path = [{x: startX, y: startY}];
            var currX = startX;
            var currY = startY;
            var len = 5 + Math.floor(Math.random() * 10); // 增加长度
            
            for (var j = 0; j < len; j++) {
                if (Math.random() > 0.5) {
                    currX += (Math.random() > 0.5 ? gridSize : -gridSize);
                } else {
                    currY += (Math.random() > 0.5 ? gridSize : -gridSize);
                }
                if(currX < 0 || currX > width || currY < 0 || currY > height) break;
                path.push({x: currX, y: currY});
            }
            
            if(path.length > 1) {
                traces.push({
                    path: path,
                    signal: {
                        currSegment: 0,
                        progress: 0,
                        speed: 0.03 + Math.random() * 0.04,
                        active: Math.random() > 0.6
                    }
                });
            }
        }
    }

    // 绘制循环
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // 1. 绘制芯片 (装饰)
        ctx.fillStyle = 'rgba(30, 30, 30, 0.05)'; // 极淡的黑色块
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        chips.forEach(function(chip) {
            ctx.fillRect(chip.x, chip.y, chip.w, chip.h);
            ctx.strokeRect(chip.x, chip.y, chip.w, chip.h);
        });

        // 2. 绘制静态走线
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        traces.forEach(function(trace) {
            ctx.strokeStyle = 'rgba(160, 160, 160, 0.3)'; // 加深颜色: 深灰
            ctx.beginPath();
            ctx.moveTo(trace.path[0].x, trace.path[0].y);
            for (var i = 1; i < trace.path.length; i++) {
                ctx.lineTo(trace.path[i].x, trace.path[i].y);
            }
            ctx.stroke();

            // 绘制焊盘 (空心圆风格)
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.lineWidth = 2;
            
            // 起点焊盘
            ctx.beginPath();
            ctx.arc(trace.path[0].x, trace.path[0].y, 4, 0, Math.PI * 2);
            ctx.stroke();
            // 终点焊盘
            ctx.beginPath();
            ctx.arc(trace.path[trace.path.length-1].x, trace.path[trace.path.length-1].y, 4, 0, Math.PI * 2);
            ctx.stroke();
        });

        // 3. 绘制动态信号
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00BFFF'; // 荧光蓝

        traces.forEach(function(trace) {
            var sig = trace.signal;
            if (!sig.active) {
                if(Math.random() > 0.995) sig.active = true;
                return;
            }

            var p1 = trace.path[sig.currSegment];
            var p2 = trace.path[sig.currSegment + 1];

            var x = p1.x + (p2.x - p1.x) * sig.progress;
            var y = p1.y + (p2.y - p1.y) * sig.progress;

            // 信号头
            ctx.fillStyle = '#00BFFF';
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI*2);
            ctx.fill();

            sig.progress += sig.speed;
            if (sig.progress >= 1) {
                sig.progress = 0;
                sig.currSegment++;
                if (sig.currSegment >= trace.path.length - 1) {
                    sig.currSegment = 0;
                    sig.active = false;
                }
            }
        });
        
        ctx.shadowBlur = 0;
        requestAnimationFrame(animate);
    }

    // 监听窗口大小变化和内容高度变化
    window.addEventListener('resize', resize);
    window.addEventListener('load', resize);
    
    // 简单的轮询检查高度变化 (处理动态加载内容)
    setInterval(function() {
        var newHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        if(Math.abs(newHeight - height) > 50) {
            resize();
        }
    }, 2000);

    resize();
    animate();
})();