(function() {
    var canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var width, height;
    var particles = [];
    
    // 配置参数
    var config = {
        count: 100, // 粒子数量
        radius: 3, // 粒子半径
        dist: 180, // 连线距离
        color: '255, 255, 255', // 粒子颜色 (RGB)
        speed: 0.8 // 移动速度
    };

    // 鼠标位置
    var mouse = { x: null, y: null };

    function resize() {
        if (!canvas.parentElement) return;
        width = canvas.width = canvas.parentElement.offsetWidth;
        height = canvas.height = canvas.parentElement.offsetHeight;
    }

    function Particle() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * config.speed;
        this.vy = (Math.random() - 0.5) * config.speed;
    }

    Particle.prototype.update = function() {
        this.x += this.vx;
        this.y += this.vy;

        // 边界反弹
        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;
    };

    Particle.prototype.draw = function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, config.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + config.color + ', 0.8)';
        ctx.fill();
    };

    function init() {
        resize();
        for (var i = 0; i < config.count; i++) {
            particles.push(new Particle());
        }
        animate();
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.update();
            p.draw();

            // 粒子间连线
            for (var j = i + 1; j < particles.length; j++) {
                var p2 = particles[j];
                var dx = p.x - p2.x;
                var dy = p.y - p2.y;
                var dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < config.dist) {
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(' + config.color + ',' + (1 - dist / config.dist) * 0.3 + ')';
                    ctx.lineWidth = 1;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }

            // 鼠标连线
            if (mouse.x != null) {
                var dx = p.x - mouse.x;
                var dy = p.y - mouse.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(' + config.color + ',' + (1 - dist / 150) * 0.5 + ')';
                    ctx.lineWidth = 1;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('load', resize); // 确保加载完成后再次调整大小
    
    // 监听 Header 区域的鼠标移动
    var header = document.querySelector('header.intro-header');
    if(header){
        header.addEventListener('mousemove', function(e) {
            var rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        header.addEventListener('mouseleave', function() {
            mouse.x = null;
            mouse.y = null;
        });
    }

    init();
})();