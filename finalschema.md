# Halocline — Final System Architecture Schema

## Purpose

This document defines the canonical system architecture for Halocline:

- A neural-operator-based digital twin for coastal aquifers  
- Designed for both:
  - Research (Scientific Machine Learning publication)
  - Commercial deployment (utilities, consultants, hydrogeologists)

This schema is the **single source of truth** for:
- Model inputs and outputs  
- Architecture layers  
- Training strategy  
- Incremental development roadmap  

---

# 1. Core Concept

We learn a mapping:
(aquifer state + controls) → (future physical state)


Instead of solving PDEs repeatedly, we approximate the **solution operator**.

---

# 2. Data Representation

## 2.1 Spatial Grid

### 2D Prototype
Input: (H, W, C_in)
Output: (H, W, C_out)


### 3D Target
Input: (X, Y, Z, C_in)
Output: (X, Y, Z, C_out)


---

## 2.2 Input Channels (C_in)

Each channel represents a spatial field:

### Static geology
- Hydraulic conductivity K(x,y,z)
- Porosity φ(x,y,z)
- Stratigraphy / facies encoding

### Boundary conditions
- Ocean boundary mask
- Ocean head / salinity
- Canal stage / inland boundary

### Forcing terms
- Recharge R(x,y,z)
- Pumping W(x,y,z) (well masks + magnitudes)

### Initial conditions
- Initial head h₀(x,y,z)
- Initial salinity c₀(x,y,z)

---

## 2.3 Output Channels (C_out)

### Primary outputs
- Hydraulic head h(x,y,z,t)
- Salinity c(x,y,z,t)

### Optional outputs
- Velocity field q(x,y,z,t)
- Salt-front interface location

---

# 3. System Architecture

## 3.1 Layer 1 — Neural Operator (WNO)

Input grid → Wavelet Neural Operator → Output field


### Purpose
- Learn PDE solution operator
- Capture both global and local spatial behavior

### Why WNO
- Preserves sharp discontinuities (karst, salt fronts)
- Avoids spectral smoothing issues seen in Fourier-based models

---

## 3.2 Layer 2 — Physics Enforcement

### 3.2.1 Sobolev Training (H¹ Loss)

L = ||u - û||² + λ ||∇u - ∇û||²


### Purpose
- Enforce correct gradients
- Preserve transport dynamics and flow behavior

---

### 3.2.2 Hard Constraint Projection Layer

predicted_output → projection → physically valid output


### Enforces
- Mass conservation
- Boundary conditions
- Physical limits and feasibility

---

## 3.3 Layer 3 — Optimization / Control

### Objective

Find optimal pumping schedules under constraints


---

### Option A — Reinforcement Learning (Primary)

- Constrained RL (e.g., CPO)
- State:
  - hydraulic head
  - salinity field
- Action:
  - pumping schedule
- Reward:
  - maximize freshwater supply
  - minimize saltwater intrusion

---

### Option B — Unrolled Optimization (Advanced)

schedule₀ → update₁ → update₂ → ... → optimal schedule


### Use cases
- Inverse modeling
- Data assimilation
- Fast policy refinement

---

# 4. Training Pipeline

## 4.1 Data Generation

Use high-fidelity simulators:
- MODFLOW
- SEAWAT
- PFLOTRAN

Generate datasets:
(input fields) → (output fields)


Across:
- pumping scenarios
- sea-level variations
- recharge variability

---

## 4.2 Training Objectives

### Primary
- L2 loss on outputs

### Enhanced
- Sobolev (gradient) loss
- Constraint enforcement

---

## 4.3 Evaluation Metrics

- RMSE / MAE
- Salt-front displacement error
- Mass balance error
- Long-term stability

---

# 5. Development Roadmap

## Stage 1 — Interactive Physics Approximation

### Model
- 2D Darcy solver (simplified physics)

### Features
- Real-time map interaction
- Ghyben-Herzberg interface approximation

### Purpose
- User experience validation
- Domain expert trust

---

## Stage 2 — Learned Physics Surrogate

### Model
- U-FNO transitioning to WNO

### Features
- Trained on simulator outputs
- Sub-second inference
- 2D → early 3D capability

### Additions
- Sobolev loss
- Basic constraints

### Goal
- Match simulator accuracy
- Enable rapid scenario exploration

---

## Stage 3 — Full Digital Twin + Optimization (Final)

### Architecture

WNO surrogate
↓
Constraint projection layer
↓
Optimization engine (RL or unrolled)


### Features
- Full 3D aquifer modeling
- Dynamic boundary conditions
- Uncertainty-aware predictions
- Pumping schedule optimization

### Advanced components
- Graph Neural Networks (karst conduits)
- Implicit Neural Representations (INR)
- Data assimilation (ESMDA or learned)

### Output
- Optimal pumping strategies
- Risk forecasts
- Decision support insights

---

# 6. Commercial Layer

## Users
- Water utilities
- Engineering consultants
- Hydrogeologists

---

## Product Surface
- Web-based interactive map
- Scenario sliders
- Side-by-side comparisons
- Exportable reports

---

## Value Proposition

Replace:
6–9 month consulting study


With:
real-time interactive decision tool


---

## Business Model
- Sell to consultants (not replace them)
- White-labeled computational engine
- Subscription or per-project pricing

---

# 7. Key Technical Risks

- Generalization to complex 3D systems
- Maintaining physical realism over long horizons
- Data scarcity and calibration challenges
- Extreme scenario extrapolation

---

# 8. Key Differentiators

- Neural operator (not traditional CNN surrogate)
- Real-time simulation capability
- Optimization-enabled decision system
- Physically constrained outputs

---

# 9. Guiding Principle

> We are not building a faster simulator.  
> We are building a **decision engine for groundwater systems**.
