## 矩阵推导总结

在本文提出的方案中，通过使用 6×6 矩阵形式对电子束的传输过程进行分析。为简化推导，仅考虑垂直方向 ($y, y'$) 和纵向 ($z, \delta$) 坐标。电子束的状态向量定义为：

$$
\vec{e} = (y, y', z, \delta)
$$

### 1. 磁偶极 ($B$) 的传输矩阵

电子束通过磁偶极后，因其弯曲角度 $b$ 引入了角度色散，其传输矩阵为：

$$
R_B = 
\begin{pmatrix}
1 & 0 & 0 & 0 \\
b & 1 & 0 & 0 \\
0 & 0 & 1 & 0 \\
0 & 0 & b & 1 \\
\end{pmatrix}
$$

### 2. 调制器 ($M$) 的传输矩阵

在调制器中，电子与种子激光相互作用，产生能量调制 $\delta_1 = \delta + \frac{\Delta \gamma}{\gamma} \sin(k_s z)$，其中：

- $\Delta \gamma$: 激光引起的能量调制幅度；
- $\gamma$: 相对论因子；
- $k_s$: 激光的波数。

假设电子处于激光波长范围内的零点附近，能量变化近似为 $\delta_1 \approx \delta + h z$，其中 $h = k_s \Delta \gamma / \gamma$ 为能量啁啾。对应的传输矩阵为：

$$
R_M = 
\begin{pmatrix}
1 & 0 & 0 & 0 \\
0 & 1 & 0 & 0 \\
0 & 0 & 1 & \xi_M \\
0 & 0 & h & 1 \\
\end{pmatrix}
$$

其中 $\xi_M$ 表示调制器中产生的动量压缩因子。

### 3. 色散节段（狗腿结构，$D$）

色散节段将能量调制转换为密度调制，其传输矩阵为：

$$
R_D = 
\begin{pmatrix}
1 & L_D & 0 & 0 \\
0 & 1 & 0 & 0 \\
\eta & \xi_D & 1 & 0 \\
0 & 0 & 0 & 1 \\
\end{pmatrix}
$$

其中：

- $L_D$: 色散节段的长度；
- $\eta$: 色散量；
- $\xi_D$: 色散节段的动量压缩因子。

### 4. 整体传输矩阵

整个 CHG 光束线的总传输矩阵为：

$$
R = R_D \cdot R_M \cdot R_B = 
\begin{pmatrix}
1 & L & 0 & 0 \\
b & 1 & 0 & 0 \\
\eta + h b \xi_D & h b L + \eta \xi_D & 1 + h \xi_D & \xi \\
b h & b h L & h \xi & 1 \\
\end{pmatrix}
$$

其中：

- $L = L_M + L_D$ 为总长度；
- $\xi = \xi_M + \xi_D$ 为总动量压缩因子。

### 5. 优化条件

根据上述矩阵，电子的纵向位置变化为：

$$
z_1 = (1 + h \xi_D) z + \xi \delta + \eta y' + h b y
$$

优化条件为：

- $1 + h \xi_D = 0$：消除能量色散的影响；
- $\xi = \eta b$：高次谐波的束团因子由 $\eta \sigma_{y'}$ 决定。

在该条件下，最终的束团因子表达式为：

$$
b_n = J_n(n k_s \eta \sigma_{y'}) \exp\left(-\frac{(n k_s \eta \sigma_{y'})^2}{2}\right)
$$

其中 $J_n$ 是第一类 $n$ 阶贝塞尔函数，$\sigma_{y'}$ 是初始电子束的垂直发散。

