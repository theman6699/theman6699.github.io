---
layout:     post
title:      "几种常用控制算法的学习总结：PID、LQR 与 模糊PID"
subtitle:   "对三种主流控制策略的原理梳理与简单实现"
date:       2026-01-02 12:00:00
author:     "Pigeon"
header-img: "img/post-bg-2015.jpg"
tags:
    - Control Theory
    - PID
    - LQR
    - Fuzzy Logic
    - C/C++
---

> 在自动化控制领域，算法的选择往往决定了系统的性能上限。无论是简单的温控系统，还是复杂的倒立摆或四足机器人，我们总能在 PID、LQR 和模糊控制这三者中找到身影。本文将深入浅出地介绍这三种控制方法，分析优缺点，并给出最简单的代码实现。

## 1. PID 控制 (Proportional-Integral-Derivative)

PID 是控制界的“万金油”，占据了工业控制 90% 以上的市场。

### 1.1 原理
PID 控制器根据设定值与实际值的偏差 $e(t)$，通过比例 ($P$)、积分 ($I$)、微分 ($D$) 三个环节计算控制量 $u(t)$。

$$ u(t) = K_p e(t) + K_i \int e(t) dt + K_d \frac{de(t)}{dt} $$

*   **P (比例)**：反映当前误差，误差越大，调节力度越大。
*   **I (积分)**：反映历史误差，用于消除稳态误差（静差）。
*   **D (微分)**：反映误差变化趋势，具有超前预测作用，抑制震荡。

### 1.2 优缺点
*   **优点**：原理简单，无需系统精确模型，参数物理意义明确，鲁棒性好。
*   **缺点**：对于多输入多输出 (MIMO) 系统无能为力；参数整定依赖经验；对非线性系统适应性差。

### 1.3 最简实现 (C语言位置式 PID)

```c
typedef struct {
    float Kp, Ki, Kd;
    float prev_error;
    float integral;
} PID_Controller;

float PID_Update(PID_Controller *pid, float setpoint, float measured) {
    float error = setpoint - measured;
    
    // 积分项 (需增加限幅防止积分饱和)
    pid->integral += error;
    
    // 微分项
    float derivative = error - pid->prev_error;
    
    // 计算输出
    float output = (pid->Kp * error) + 
                   (pid->Ki * pid->integral) + 
                   (pid->Kd * derivative);
    
    pid->prev_error = error;
    return output;
}
```

---

## 2. LQR 控制 (Linear Quadratic Regulator)

LQR 是现代控制理论的代表，基于状态空间模型，通过优化代价函数来寻找最优控制律。

### 2.1 原理
假设系统状态方程为 $\dot{x} = Ax + Bu$。
LQR 的目标是找到一个控制律 $u = -Kx$，使得下面的代价函数 $J$ 最小：

$$ J = \int_0^\infty (x^T Q x + u^T R u) dt $$

*   **Q 矩阵**：惩罚状态误差（希望状态 $x$ 尽快收敛到 0）。
*   **R 矩阵**：惩罚控制能量（希望控制量 $u$ 不要太大，省电/保护电机）。

通过求解黎卡提方程 (Riccati Equation)，可以算出最优增益矩阵 $K$。

### 2.2 优缺点
*   **优点**：能处理多输入多输出 (MIMO) 系统；数学上保证了系统的稳定性；只需调整 Q 和 R 的权重即可平衡性能与能耗。
*   **缺点**：**必须依赖精确的系统数学模型** (A, B 矩阵)；对模型误差敏感；计算量较大（通常 $K$ 矩阵是离线算好的）。

### 2.3 最简实现 (C语言)
LQR 的难点在于离线计算 $K$ 矩阵（通常用 MATLAB/Python 的 `control.lqr(A,B,Q,R)` 计算）。一旦算出 $K$，运行时代码非常简单，就是矩阵乘法。

假设算出的 $K = [k_1, k_2, k_3, k_4]$，状态向量 $x = [\theta, \dot{\theta}, x, \dot{x}]^T$ (倒立摆典型状态)。

```c
// 离线算好的 K 矩阵参数
const float K[4] = { -10.5, -2.3, -1.0, -1.5 };

float LQR_Update(float theta, float theta_dot, float pos, float pos_dot) {
    // u = -K * x
    // 简单的向量点乘
    float u = -(K[0] * theta + 
                K[1] * theta_dot + 
                K[2] * pos + 
                K[3] * pos_dot);
    return u; // 输出电机电压或占空比
}
```

---

## 3. 模糊 PID 控制 (Fuzzy PID)

模糊 PID 是智能控制的一种，它利用模糊逻辑（Fuzzy Logic）根据系统的实时状态，动态调整 PID 的三个参数 ($K_p, K_i, K_d$)。

### 3.1 原理
它模仿人类专家的思维：
*   "如果误差很大，那就加大 $K_p$ 快速响应，减小 $K_d$ 防止刹车太猛。"
*   "如果误差很小，那就加大 $K_i$ 消除静差。"

流程：**模糊化** (输入 $e, ec$) -> **模糊推理** (查规则表) -> **解模糊** (输出 $\Delta K_p, \Delta K_i, \Delta K_d$)。

### 3.2 优缺点
*   **优点**：能适应非线性、时变系统；无需精确模型；比传统 PID 响应更快、超调更小。
*   **缺点**：规则表设计复杂，依赖专家经验；计算量比传统 PID 大。

### 3.3 最简实现 (查表法)
完整的模糊推理计算量大，单片机上常用**查表法**。预先计算好一张二维表。

```c
// 假设误差 e 和误差变化率 ec 都被量化为 -3 到 +3 (NB, NM, NS, ZO, PS, PM, PB)
// 这是一个简化的 Kp 调整表
const float Kp_RuleTable[7][7] = {
    { 0.9, 0.9, 0.9, 0.9, 0.6, 0.3, 0.0 }, // e = NB (负大)
    { 0.9, 0.9, 0.9, 0.6, 0.3, 0.0, 0.0 }, // e = NM
    // ... 中间省略 ...
    { 0.0, 0.3, 0.6, 0.9, 0.9, 0.9, 0.9 }  // e = PB (正大)
};

float FuzzyPID_Update(float error, float error_rate) {
    // 1. 模糊化：将误差映射到 0~6 的索引
    int e_idx = Quantize(error);      // 自定义函数：映射到 0..6
    int ec_idx = Quantize(error_rate); // 自定义函数：映射到 0..6
    
    // 2. 查表获取系数调整量
    float kp_scale = Kp_RuleTable[e_idx][ec_idx];
    
    // 3. 动态调整 PID 参数
    float current_Kp = BASE_KP * kp_scale;
    
    // 4. 运行普通 PID
    return current_Kp * error + ...;
}
```

---

## 4. 总结对比

| 特性 | PID | LQR | 模糊 PID |
| :--- | :--- | :--- | :--- |
| **依赖模型** | 否 | **是 (强依赖)** | 否 |
| **适用对象** | 单入单出 (SISO) | 多入多出 (MIMO) | 非线性/时变系统 |
| **参数整定** | 试凑法/Z-N法 | 调整 Q/R 权重 | 设计规则表 |
| **计算复杂度** | 低 | 低 (运行时) | 中/高 |
| **典型应用** | 温控、电机速度 | 倒立摆、无人机 | 复杂化工过程 |

![Control Algorithms Comparison](/img/post-control-algo/control-comparison.svg)
*(图片来源: 自制对比图)*

选择建议：
*   简单系统、不想建模 -> **PID**。
*   多变量系统（如四旋翼）、有精确模型 -> **LQR**。
*   系统参数会变（如负载变化大）、要求极高 -> **模糊 PID**。
