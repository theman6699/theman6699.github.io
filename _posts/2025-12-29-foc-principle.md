---
layout:     post
title:      "深入浅出 FOC：原理与 STM32 实现"
subtitle:   "Field Oriented Control Principle & Implementation"
date:       2025-12-29
author:     "Pigeon"
header-img: "img/home-bg.jpg"
tags:
    - 嵌入式
    - 电机控制
    - FOC
    - STM32
---

> 磁场定向控制 (FOC) 是现代电机控制的皇冠。它让交流电机像直流电机一样听话。

## 1. 什么是 FOC？

**FOC (Field Oriented Control)**，即磁场定向控制，是一种用于无刷直流电机 (BLDC) 和永磁同步电机 (PMSM) 的高效控制算法。

### 核心思想
简单来说，FOC 的目的就是**解耦**。

*   **直流有刷电机**：天生就有两个垂直的磁场（定子和转子），控制电流就能直接控制转矩，效率极高。
*   **交流电机 (BLDC/PMSM)**：三相线圈产生的磁场是旋转且耦合的，直接控制非常困难。

FOC 通过数学变换，将三相交流电 ($I_a, I_b, I_c$) 变成了两个恒定的直流分量：
1.  **$I_d$ (直轴电流)**：负责产生磁通。对于永磁电机，通常控制为 **0**（因为磁铁已经有磁性了）。
2.  **$I_q$ (交轴电流)**：负责产生转矩。**控制 $I_q$ 就等于控制力矩**。

---

## 2. 控制原理图解

FOC 的整个控制流程是一个闭环系统，主要包含以下几个步骤：

1.  **采样**：读取三相电流和转子角度。
2.  **Clarke 变换**：将 3 相静止坐标系 ($abc$) 转换为 2 相静止坐标系 ($\alpha\beta$)。
3.  **Park 变换**：将 2 相静止坐标系 ($\alpha\beta$) 转换为 2 相旋转坐标系 ($dq$)。**此时交流变直流**。
4.  **PID 控制**：对 $I_d$ 和 $I_q$ 进行闭环控制。
5.  **反 Park 变换**：将控制量转换回静止坐标系。
6.  **SVPWM**：生成 PWM 波形驱动电机。

### FOC 控制框图
![FOC Block Diagram](https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Vector_Control_Block_Diagram.svg/1920px-Vector_Control_Block_Diagram.svg.png)
*(图片来源: Wikimedia Commons)*

### Park 变换示意图
![Park Transform](https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Park_transform.svg/800px-Park_transform.svg.png)
*(图片来源: Wikimedia Commons)*

---

## 3. STM32 代码实现 (简化版)

下面是一份可以直接移植到 STM32 工程中的 FOC 核心算法代码。它包含了 Clarke、Park 变换以及 SVPWM 的实现。

```c
#include <math.h>
#include <stdint.h>

// 定义数学常数
#define SQRT3        1.73205080757f
#define ONE_BY_SQRT3 0.57735026919f
#define TWO_BY_SQRT3 1.15470053838f

// FOC 状态结构体
typedef struct {
    // --- 输入 ---
    float Ia, Ib, Ic;       // 三相电流采样值
    float theta_el;         // 电角度 (弧度)

    // --- 中间变量 ---
    float Ialpha, Ibeta;    // Clarke 变换结果
    float Id, Iq;           // Park 变换结果 (反馈值)
    float Vd, Vq;           // PI 控制器输出 (设定电压)
    float Valpha, Vbeta;    // 反 Park 变换结果

    // --- 输出 ---
    float DutyA, DutyB, DutyC; // SVPWM 计算出的占空比 (0.0 ~ 1.0)
    
} FOC_State_t;

// 简单的 PI 控制器
typedef struct {
    float Kp, Ki;
    float integral;
    float limit;
    float out_limit;
} PI_Controller_t;

// ---------------------------------------------------------
// 1. Clarke 变换: abc -> alpha, beta
// ---------------------------------------------------------
void FOC_Clarke(FOC_State_t *foc) {
    // 根据基尔霍夫定律 Ia + Ib + Ic = 0，只需要 Ia 和 Ib
    foc->Ialpha = foc->Ia;
    foc->Ibeta  = ONE_BY_SQRT3 * foc->Ia + TWO_BY_SQRT3 * foc->Ib;
}

// ---------------------------------------------------------
// 2. Park 变换: alpha, beta -> d, q
// ---------------------------------------------------------
void FOC_Park(FOC_State_t *foc) {
    float c = cosf(foc->theta_el);
    float s = sinf(foc->theta_el);

    foc->Id =  foc->Ialpha * c + foc->Ibeta * s;
    foc->Iq = -foc->Ialpha * s + foc->Ibeta * c;
}

// ---------------------------------------------------------
// PI 控制器更新
// ---------------------------------------------------------
float PI_Update(PI_Controller_t *pi, float error) {
    pi->integral += error * pi->Ki;
    
    // 积分限幅
    if (pi->integral > pi->limit) pi->integral = pi->limit;
    if (pi->integral < -pi->limit) pi->integral = -pi->limit;

    float output = error * pi->Kp + pi->integral;

    // 输出限幅
    if (output > pi->out_limit) output = pi->out_limit;
    if (output < -pi->out_limit) output = -pi->out_limit;

    return output;
}

// ---------------------------------------------------------
// 3. 反 Park 变换: Vd, Vq -> Valpha, Vbeta
// ---------------------------------------------------------
void FOC_InvPark(FOC_State_t *foc) {
    float c = cosf(foc->theta_el);
    float s = sinf(foc->theta_el);

    foc->Valpha = foc->Vd * c - foc->Vq * s;
    foc->Vbeta  = foc->Vd * s + foc->Vq * c;
}

// ---------------------------------------------------------
// 4. SVPWM 生成 (马鞍波)
// ---------------------------------------------------------
void FOC_SVPWM(FOC_State_t *foc, float Vbus) {
    // 反 Clarke 变换
    float Va = foc->Valpha;
    float Vb = -0.5f * foc->Valpha + (SQRT3 / 2.0f) * foc->Vbeta;
    float Vc = -0.5f * foc->Valpha - (SQRT3 / 2.0f) * foc->Vbeta;

    // 寻找最大最小值，注入零序分量
    float Vmax = Va;
    float Vmin = Va;

    if (Vb > Vmax) Vmax = Vb;
    if (Vb < Vmin) Vmin = Vb;
    if (Vc > Vmax) Vmax = Vc;
    if (Vc < Vmin) Vmin = Vc;

    float Vcommon = (Vmax + Vmin) / 2.0f;

    Va -= Vcommon;
    Vb -= Vcommon;
    Vc -= Vcommon;

    // 归一化为占空比 (0.0 ~ 1.0)
    foc->DutyA = (Va + (Vbus / 2.0f)) / Vbus;
    foc->DutyB = (Vb + (Vbus / 2.0f)) / Vbus;
    foc->DutyC = (Vc + (Vbus / 2.0f)) / Vbus;
}
```

### 如何在主循环中调用？

```c
// 伪代码示例
void FOC_Loop() {
    // 1. 读取传感器 (电流 & 角度)
    foc.Ia = ADC_Read_Ia();
    foc.Ib = ADC_Read_Ib();
    foc.theta_el = Encoder_Read_Angle();

    // 2. 坐标变换
    FOC_Clarke(&foc);
    FOC_Park(&foc);

    // 3. PID 控制 (Id 目标通常为 0, Iq 控制转矩)
    foc.Vd = PI_Update(&pid_d, 0.0f - foc.Id);
    foc.Vq = PI_Update(&pid_q, Target_Torque - foc.Iq);

    // 4. 输出变换
    FOC_InvPark(&foc);
    FOC_SVPWM(&foc, 12.0f); // 假设 12V 供电

    // 5. 更新 PWM 寄存器
    __HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_1, foc.DutyA * 1000);
    __HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_2, foc.DutyB * 1000);
    __HAL_TIM_SET_COMPARE(&htim1, TIM_CHANNEL_3, foc.DutyC * 1000);
}
```

## 总结

FOC 虽然数学原理稍显复杂，但代码实现其实非常结构化。掌握了 Clarke 和 Park 变换，你就掌握了电机控制的钥匙。

如果你想深入学习，推荐参考 **SimpleFOC** 开源项目，或者 ST 官方的 **Motor Control Workbench**。
