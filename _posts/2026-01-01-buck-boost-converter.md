---
layout:     post
title:      "Buck-Boost 变换器学习笔记：原理推导与 Simulink 仿真"
subtitle:   "升降压电路的原理推导与仿真练习"
date:       2026-01-01 12:00:00
author:     "Pigeon"
header-img: "img/post-bg-2015.jpg"
tags:
    - Power Electronics
    - Simulink
    - Circuit Design
---

> 在电源设计中，我们经常遇到输入电压范围较宽，既可能高于也可能低于输出电压的情况（例如电池供电系统）。这时，Buck-Boost（升降压）变换器就派上用场了。本文将详细讲解其工作原理、公式推导，并手把手教你在 MATLAB Simulink 中搭建仿真模型。

## 1. Buck-Boost 电路原理

Buck-Boost 变换器是一种**反极性**（Inverting）的开关电源拓扑。它的输出电压极性与输入电压相反（即输入正，输出负）。

### 1.1 电路拓扑
基本电路由以下元件组成：
*   **开关管 (Switch/MOSFET)**：控制能量的输入。
*   **电感 (Inductor, L)**：储能元件，能量的中转站。
*   **二极管 (Diode, D)**：续流元件，在开关断开时为电感电流提供通路。
*   **电容 (Capacitor, C)**：滤波，维持输出电压稳定。

![Buck-Boost Circuit](/img/post-buckboost/buck-boost-circuit.svg)
*(图片来源: 自制示意图)*

### 1.2 工作过程

电路的工作分为两个模态（假设电感电流连续，CCM 模式）：

1.  **开关导通 (Switch ON)**:
    *   电源 $V_{in}$ 直接加在电感 $L$ 两端。
    *   二极管 $D$ 反向截止（因为阳极接负输出，阴极接正输入）。
    *   电感电流 $i_L$ 线性上升，电感储能。
    *   负载由电容 $C$ 供电。

2.  **开关关断 (Switch OFF)**:
    *   电源断开。
    *   电感电流不能突变，为了维持电流方向（向下），电感产生感应电动势（下正上负）。
    *   二极管 $D$ 导通。
    *   电感释放能量，给电容 $C$ 充电并供给负载 $R$。
    *   注意：电流流向是从地流向输出端，因此输出电压 $V_o$ 是**负值**。

---

## 2. 公式推导 (伏秒平衡)

我们利用**伏秒平衡原理** (Volt-Second Balance) 来推导输入输出电压关系。在稳态下，电感两端的平均电压在一个开关周期内为零。

设开关周期为 $T$，占空比为 $D$。

### 2.1 导通阶段 ($0 \sim DT$)
电感两端电压 $v_L$ 等于输入电压 $V_{in}$：
$$ v_L = V_{in} $$
持续时间：$DT$

### 2.2 关断阶段 ($DT \sim T$)
电感两端电压 $v_L$ 等于输出电压 $V_o$（忽略二极管压降）。
注意：由于输出是负电压，如果我们定义 $V_o$ 为绝对值，则 $v_L = -V_o$；如果 $V_o$ 包含符号，则 $v_L = V_o$。
为了方便理解，我们取 $V_o$ 为输出电压的**绝对值**。在关断期间，电感作为电源，电压方向翻转，所以：
$$ v_L = -V_o $$
持续时间：$(1-D)T$

### 2.3 伏秒平衡方程
$$ \int_0^T v_L(t) dt = 0 $$
$$ V_{in} \cdot DT + (-V_o) \cdot (1-D)T = 0 $$

整理得：
$$ V_{in} D = V_o (1-D) $$

### 2.4 传递函数
$$ \frac{V_o}{V_{in}} = \frac{D}{1-D} $$

考虑到极性反转，实际输出电压为：
$$ V_{out} = - V_{in} \frac{D}{1-D} $$

*   当 $D < 0.5$ 时，$V_o < V_{in}$ (降压)
*   当 $D > 0.5$ 时，$V_o > V_{in}$ (升压)

---

## 3. MATLAB Simulink 仿真教程

接下来，我们用 Simulink 搭建一个 Buck-Boost 电路来验证上述公式。

### 3.1 准备工作
打开 MATLAB，输入 `simulink` 启动，新建一个 Blank Model。
我们需要用到 **Simscape / Electrical / Specialized Power Systems** 库中的元件。

### 3.2 搭建步骤

1.  **添加元件** (在 Library Browser 中搜索并拖入):
    *   `DC Voltage Source`: 输入电源 (设为 24V)。
    *   `MOSFET`: 开关管 (取消 Measurement 端口)。
    *   `Diode`: 二极管 (取消 Measurement 端口)。
    *   `Series RLC Branch`:
        *   一个设为 **L** (Inductor)，比如 1mH。
        *   一个设为 **C** (Capacitor)，比如 470uF。
        *   一个设为 **R** (Resistor)，作为负载，比如 10 Ohm。
    *   `Pulse Generator`: 产生 PWM 波。
    *   `Voltage Measurement`: 测量输出电压。
    *   `Scope`: 示波器显示波形。
    *   `powergui`: **必须添加**，否则无法仿真。

2.  **连接电路**:
    *   参考下图进行连接。注意 MOSFET 的方向和二极管的方向。
    *   **关键点**：Buck-Boost 的拓扑是：电源 -> 开关 -> 电感(接地) -> 二极管 -> 输出。
    *   **注意**：标准的 Inverting Buck-Boost 中，开关在上方，电感在开关后串联到地？不对。
    *   **正确连接**：
        1.  电源正极 -> MOSFET Drain。
        2.  MOSFET Source -> 电感上端 & 二极管阴极 (Cathode)。
        3.  电感下端 -> 电源负极 (GND)。
        4.  二极管阳极 (Anode) -> 电容上端 & 负载上端。
        5.  电容下端 & 负载下端 -> 电源负极 (GND)。
    *   这样连接，输出端（电容上端）相对于地是**负电压**。

![Simulink Model](/img/post-buckboost/simulink-model.svg)
*(图片来源: 自制仿真模型图)*

3.  **参数设置**:
    *   **DC Source**: 24V。
    *   **Pulse Generator**:
        *   Period: `1/20000` (20kHz 开关频率)。
        *   Pulse Width: `60` (60% 占空比，理论输出应该是 $24 \times \frac{0.6}{0.4} = 36V$)。
    *   **L**: 1e-3 H。
    *   **C**: 470e-6 F。
    *   **R**: 10 Ohm。
    *   **powergui**: 设置为 `Discrete`，Sample time 设为 `1e-6`。

4.  **运行仿真**:
    *   设置仿真时间为 0.1s。
    *   点击 Run。
    *   双击 Scope 查看电压波形。

### 3.3 结果分析
如果一切设置正确，你应该能看到输出电压稳定在 **-36V** 左右（由于二极管压降和开关损耗，实际绝对值会略小于 36V）。

### 3.4 常见坑点
*   **二极管方向反了**：如果二极管方向接反，电感能量无法释放，会产生极高电压击穿开关管（在仿真里就是报错或数值发散）。
*   **没有加 powergui**：Simscape 电力系统仿真必须有这个模块。
*   **步长太大**：开关频率 20kHz，仿真步长建议至少 1us，否则波形会失真。

希望这篇教程能帮你搞定 Buck-Boost 电路！
