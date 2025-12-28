---
layout:     post
title:      "嵌入式开发常用在线工具集"
subtitle:   "Embedded Development Online Tools Collection"
date:       2025-12-28
author:     "Pigeon"
header-img: "img/home-bg.jpg"
tags:
    - 嵌入式
    - 工具
    - 资源
---

> 工欲善其事，必先利其器。这里收集了一些我常用的嵌入式开发在线工具，方便随时取用。

## 🎨 图形与界面 (GUI & Graphics)

*   **[LVGL 在线模拟器](https://sim.lvgl.io/)**
    *   LVGL 官方提供的在线模拟器，可以直接在浏览器中运行和调试 LVGL 代码，支持 MicroPython。
*   **[Image2Lcd 在线版 (类似功能)](http://www.rinkydinkelectronics.com/t_imageconverter565.php)**
    *   虽然经典的 Image2Lcd 是桌面软件，但这个网站可以将图片转换为 RGB565 数组，适用于 TFT 屏幕开发。
*   **[LED Matrix Editor](https://xantorohara.github.io/led-matrix-editor/)**
    *   在线 LED 点阵取模工具，支持自定义尺寸，生成 C/C++ 数组，非常适合点阵屏开发。
*   **[Font Converter (LVGL)](https://lvgl.io/tools/fontconverter)**
    *   LVGL 官方字体转换工具，将 TTF/WOFF 字体转换为 LVGL 可用的 C 文件。

## 🧮 算法与计算 (Algorithms & Math)

*   **[Desmos 图形计算器](https://www.desmos.com/calculator?lang=zh-CN)**
    *   强大的在线函数绘图工具，调试 PID 曲线、滤波器算法或电机控制曲线时非常有用。
*   **[CRC 在线计算](http://www.sunshine2k.de/coding/javascript/crc/crc_js.html)**
    *   支持自定义多项式的 CRC 计算器，调试通信协议（如 Modbus）时必备。
*   **[Hex/ASCII/Float 在线转换](https://www.scadacore.com/tools/programming-calculators/online-hex-converter/)**
    *   在十六进制、浮点数（IEEE 754）、整数之间快速转换，分析传感器原始数据时神器。

## 🤖 机器人与控制 (Robotics & Control)

*   **[Webots Online](https://cyberbotics.com/)**
    *   虽然主要是桌面端，但 Webots 提供了一些在线仿真演示，适合了解机器人仿真。
*   **[CoppeliaSim (V-REP) 资源](https://www.coppeliarobotics.com/)**
    *   外骨骼机器人仿真常用的软件资源。

## 🛠️ 协议与调试 (Protocol & Debug)

*   **[JSON Editor Online](https://jsoneditoronline.org/)**
    *   如果你的嵌入式设备使用 JSON 格式通信（如 ESP32 IoT 项目），这个工具能清晰地查看和编辑 JSON。
*   **[RegExr (正则表达式测试)](https://regexr.com/)**
    *   编写串口数据解析规则时，先在这里测试正则表达式，事半功倍。

## 📚 常用文档与参考

*   **[STM32CubeMX 官网](https://www.st.com/en/development-tools/stm32cubemx.html)**
*   **[RT-Thread 文档中心](https://www.rt-thread.org/document/site/)**

---

*持续更新中... 如果你有好用的工具，欢迎在评论区推荐！*
