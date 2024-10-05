---
layout: archive
title: "Projects"
permalink: /projects/
author_profile: true
---

## Single photon emission in 2D materials (2024 - Present)
#### _This work is supervised by [Dr. Wenjing Wu](https://scholar.google.com/citations?user=lm68m7kAAAAJ&hl=en) and [Prof. Shengxi Huang](https://profiles.rice.edu/faculty/shengxi-huang), [SCOPE Lab](https://scopelab.rice.edu/) in Rice University_
****
* <font color=Red>Now I try my best to do this research...</font>
* Designed and fabricated substrates with strain engineering features (nano pillars, nano discs) with electron beam lithography for deterministically creation of single photon emitters.
* Carried out optical spectroscopy measurements including photoluminescence (PL), Raman, Time-Correlated Single Photon Counting (TCSPC) on hBN encapsulated WSe2 and WS2 monolayers integrated with strain engineered substrates.
* Examined the single photon emission quality by conducting photon statistic measurements, obtain second-order correlation function $g^{2}(\tau)$ using Hanbury Brown and Twiss (HBT) interferometry. 
* Improved the purity of SPE by electrostatic gating and charge transfer between molecules and graphene. 

## Heatmap plotter & Spectrum fitting plotter (2024 - Present)
****
_Served for SCOPE Lab (Original python codes in [Github](https://github.com/k-telux/SPE-purity))_
* [Heatmap plotter](../assets/Heatmap_plotter.exe):
  * This application is designed to generate heatmaps from Renishaw map data files. Also, it can plot the specific points' spectrum to know how to choose the range. Users can fit the spectrum of specific points by just clicking the points on the plot.

* [Spectrum fitting plotter](../assets/Justplot.exe):
  * This application is designed to plot Raman/PL spectrum and draw fitted curves on it. Users need to fit the curves with Origin to get the parameters first.

## Combination of the cavity cooling and feed back cooling to reach new cooling temperature limit (2024 - Present)
#### _This work is supervised by [Prof. Chuan-Feng Li](http://lqcc.ustc.edu.cn/cfli/) and associate professor [Dr. Jian Wang](https://faculty.ustc.edu.cn/wangjian1), [CAS Key Laboratory of Quantum Information](https://lqcc.ustc.edu.cn/) in USTC_
****

* Simulated the limited temperature that cavity and feedback cooling can reach.
* Calculated the combination of 2 cooling methods and certified that the new method's lowest temperature has the correct positive correlation with a low cavity decay rate.
* Simulated the new model using the Quantum Monte Carlo to find the lowest temperature the new method can reach. Compared with the separated cooling method, the new method can reach a lower temperature, which means the laser cooling method can also be enhanced with this new method.
* Reference and progress of the work: [Github](https://github.com/k-telux/Combine-cooling) (_Unpublished_).

## Single atom trapping technique based on movable optical lattices (2022 - 2024)
#### _This work is supervised by [Prof. Chuan-Feng Li](http://lqcc.ustc.edu.cn/cfli/) and associate professor [Dr. Jian Wang](https://faculty.ustc.edu.cn/wangjian1), [CAS Key Laboratory of Quantum Information](https://lqcc.ustc.edu.cn/) in USTC_
****
* Proposed to achieve the trapping of single atoms and combine fluorescence detection to achieve high-precision control of atomic positions by movable optical lattice.
* Participated in setting up the optical path for magneto-optical trap for $^{87}Rb$. Independently built the double pass configuration to adjust the frequency of cooling light with Bragg diffraction.
* Led building and cleaning our second ultrahigh optical accessible vacuum system, in which we mounted a Rb atom dispenser for the MOT and optical dipole traps for ensembles and single atoms. The vacuum degree of the system has reached $3\times10^{-11}$ Torr.
* Independently pre-treated the optical fiber which will be used in the vacuum system and tested the mode field diameter of treated single mode fiber to optimize the mode matching between the modes of cavity and fiber.
* Independently designed control circuits and installed control electronics such as the microwave amplifier, radio frequency switch, and radio frequency generator into multiple integrated chassis to facilitate the connection of electrical devices in the optical path.
* Achieved the control time of atoms to 3s (_Unpublished_).
  
## Simulation of the focusing property with high-NA lens of vectorial polarized beam (2024)
#### _This work is supervised by [Prof. Kun Huang](https://faculty.ustc.edu.cn/huangkun) in USTC_
****

* Simulated the effect of polarization states on the propagation process of the light field and the focused light field.
* Calculated and analyzed different polarized light Bessel-Gauss beams and polarized light beams with vortex phase at the focal plane based on the Richard-Wolf vector-integral formula.
* Summary of the work: [Paper](../assets/Vector_beams.pdf)

## Search exotic particles with deep learning and use Random Forests to classify phases in the Ising Model(2023)
****
* Described a ferromagnetic phase transition problem using a 40 x 40 two-dimensional array of atomic dots(2D Ising model).
* Utilized deep neuron network to examine the search for supersymmetry in collider experiments.(Five million data samples and 18 features of the end state) [Reference](../assets/deep_learning.pdf)
* Codes of the works: [Github](https://github.com/k-telux/Deep-learning) 


## RoboGame 2023 (2023)
****
_RoboGame Robotics Competition is a major brand activity of students' scientific and technological innovation and comprehensive practical education founded by the University of Science and Technology of China (USTC) in 2001, which requires the participating teams to design and build their own robots to participate in the competition within no more than half a year and with a certain amount of funding, centering on a specific theme and rules of the competition._ 

* [Robotics Budget and Feasibility Plan](../assets/plan.pdf) (Got second prize in 50+ teams)
* As the sole electrical controls engineer on the team, I developed the majority of the control code for the robot's movement and catching mechanisms. 
  * Designed the main control board (STM32) using Cubemx and Keil 
  * Drew the power distribution boards PCB, ensured consistency across all robot components.
  * Wrote and fine-tuned the PID for wheel movement.
* Finally we successfully finished the tasks and won third prize in the finals.
* Codes and PCBs: [Github](https://github.com/k-telux/RoboGame2023)

## Simulation and review of light field modes in Fabry–Pérot cavity (2022)
****
* Simulated the transmission characteristics (transmission rate, resonance mode) of Fabry-Perot resonators using COMSOL and compared the results with analytical solutions.
* Summary of the work: [Paper](../assets/FPcavity.pdf) 

## Theoretical and experimental research on IYPT 2022 Problem 8 — Equipotential Lines (2022)
****
_Place two electrodes into water, supply a safe voltage and use a voltmeter to determine electric potential at various locations. Investigate how the measured equipotential lines deviate from your expectations for different conditions and liquids._
* Investigated the equipotential lines in pure water and salt water, constructing the influence of electrodes on the potential distribution in water through different models.
  * According to the comparison of measured data and theoretical fitting models (using COMSOL), the formula analysis of electric double layer capacitance theory, bubble theory, alternating current substitution theory and ion concentration theory is carried out. 
* Summary of the work: [Paper](../assets/equipotential_lines.pdf) 

## Discover physical concepts with neural networks (2021 -  2022)
****
* Independently built neural networks with three neurons using MATLAB. 
* Derived the Planck radiation law formula from original spectrum data using the model. [Reference](../assets/neural_network.pdf)
* Summary of the work (This work got first prize in competition): [Paper](../assets/neural_network_report.pdf)
