# Sistema Modular de CSS para Juegos de Casino

## 📁 Estructura de Archivos

```
public/css/games/
├── game-base.css      # Estilos base, variables, top bar, control bar
├── game-cards.css     # Sistema de cartas reutilizable
├── game-menu.css      # Menú lateral común
├── game-table.css     # Mesa de juego, zonas de apuestas
└── game-ui.css        # Overlays, toasts, modales, sidebar de pagos
```

## 🎨 Variables CSS Globales

Todas las variables están definidas en `game-base.css`:

```css
/* Colores */
--game-primary: #9333ea
--game-primary-light: #a855f7
--game-primary-dark: #581c87
--game-success: #10b981
--game-warning: #f59e0b
--game-error: #ef4444
--game-gold: #fbbf24

/* Espaciado */
--game-spacing-xs: 4px
--game-spacing-sm: 8px
--game-spacing-md: 16px
--game-spacing-lg: 24px
--game-spacing-xl: 32px

/* Bordes */
--game-radius-sm: 8px
--game-radius-md: 12px
--game-radius-lg: 16px

/* Transiciones */
--game-transition-fast: 0.15s ease
--game-transition-normal: 0.3s ease
--game-transition-slow: 0.5s ease
```

## 🚀 Cómo Usar en un Nuevo Juego

### 1. Incluir los CSS en el HTML

```html
<head>
    <!-- CSS Modular del Casino -->
    <link rel="stylesheet" href="/css/games/game-base.css">
    <link rel="stylesheet" href="/css/games/game-cards.css">
    <link rel="stylesheet" href="/css/games/game-menu.css">
    <link rel="stylesheet" href="/css/games/game-table.css">
    <link rel="stylesheet" href="/css/games/game-ui.css">
    
    <!-- CSS específico del juego (opcional) -->
    <link rel="stylesheet" href="/css/mi-juego.css">
</head>
```

### 2. Estructura HTML Base

```html
<div class="casino-fullscreen">
    <!-- Top Bar -->
    <div class="top-bar">
        <div class="user-info">
            <button class="menu-btn" id="menuBtn">
                <i class="fas fa-bars"></i>
            </button>
            <div class="balance-widget">
                <span class="balance-label">SALDO</span>
                <span class="balance-amount" id="balanceAmount">$0</span>
            </div>
        </div>
        <div class="game-title">
            <h1><i class="fas fa-gamepad"></i> MI JUEGO</h1>
        </div>
        <div class="game-stats">
            <button class="fullscreen-btn">
                <i class="fas fa-expand"></i>
            </button>
        </div>
    </div>

    <!-- Table Area -->
    <div class="table-area">
        <!-- Contenido del juego aquí -->
    </div>

    <!-- Control Bar -->
    <div class="control-bar">
        <!-- Controles de apuesta -->
        <div class="bet-controls">
            <div class="bet-input-group">
                <button class="bet-clear-btn" id="clearBtn">
                    <i class="fas fa-trash"></i>
                </button>
                <input type="number" id="betAmount" class="bet-input" 
                       placeholder="Apuesta" value="100">
                <span class="currency-symbol">$</span>
            </div>
            <div class="quick-chips">
                <button class="quick-chip" data-value="10">10</button>
                <button class="quick-chip" data-value="25">25</button>
                <button class="quick-chip" data-value="50">50</button>
                <button class="quick-chip" data-value="100">100</button>
            </div>
        </div>

        <!-- Acciones del juego -->
        <div class="game-actions">
            <button class="action-btn primary">
                <i class="fas fa-play"></i> JUGAR
            </button>
        </div>

        <!-- Panel de info -->
        <div class="info-panel">
            <div class="current-bet">
                Apuesta: <span id="currentBetDisplay">$0</span>
            </div>
        </div>
    </div>
</div>

<!-- Side Menu -->
<div class="side-menu" id="sideMenu">
    <div class="menu-header">
        <h2><i class="fas fa-gamepad"></i> MENÚ</h2>
        <button class="close-menu-btn" id="closeMenuBtn">
            <i class="fas fa-times"></i>
        </button>
    </div>
    <div class="menu-content">
        <a href="/dashboard" class="menu-item">
            <i class="fas fa-home"></i>
            <span>Inicio</span>
        </a>
        <!-- Más items -->
    </div>
</div>

<!-- Toast -->
<div class="toast" id="toast">
    <i class="fas fa-info-circle"></i>
    <span class="toast-message"></span>
</div>

<!-- Win Overlay -->
<div class="win-overlay" id="winOverlay">
    <div class="win-content">
        <div class="win-icon"><i class="fas fa-trophy"></i></div>
        <div class="win-amount" id="winAmount"></div>
        <div class="win-message" id="winMessage"></div>
    </div>
</div>
```

## 🃏 Sistema de Cartas

### Estructura de una Carta

```html
<div class="card">
    <div class="card-back"></div>
</div>
```

### Carta con Frente

```html
<div class="card flip">
    <div class="card-front red">
        <div class="card-corner top-left">
            <div class="rank">A</div>
            <div class="suit">♥</div>
        </div>
        <div class="card-center">
            <div class="suit-large">♥</div>
        </div>
        <div class="card-corner bottom-right">
            <div class="rank">A</div>
            <div class="suit">♥</div>
        </div>
    </div>
</div>
```

### Tamaños de Cartas

```html
<!-- Pequeña -->
<div class="card sm"></div>

<!-- Mediana (default) -->
<div class="card"></div>

<!-- Grande -->
<div class="card lg"></div>
```

### Contenedor de Cartas

```html
<div class="cards-container">
    <div class="card"></div>
    <div class="card"></div>
    <div class="card"></div>
</div>
```

### JavaScript para Voltear Cartas

```javascript
function displayCard(cardElement, cardData) {
  const color = (cardData.suit === '♥' || cardData.suit === '♦') ? 'red' : 'black';
  
  cardElement.classList.add('flip');
  
  setTimeout(() => {
    cardElement.innerHTML = `
      <div class="card-front ${color}">
        <div class="card-corner top-left">
          <div class="rank">${cardData.rank}</div>
          <div class="suit">${cardData.suit}</div>
        </div>
        <div class="card-center">
          <div class="suit-large">${cardData.suit}</div>
        </div>
        <div class="card-corner bottom-right">
          <div class="rank">${cardData.rank}</div>
          <div class="suit">${cardData.suit}</div>
        </div>
      </div>
    `;
  }, 300);
}
```

## 🎮 Botones de Acción

```html
<!-- Botón primario -->
<button class="action-btn primary">
    <i class="fas fa-play"></i> JUGAR
</button>

<!-- Botón de éxito -->
<button class="action-btn success">
    <i class="fas fa-check"></i> CONFIRMAR
</button>

<!-- Botón de advertencia -->
<button class="action-btn warning">
    <i class="fas fa-coins"></i> APOSTAR
</button>

<!-- Botón de error -->
<button class="action-btn error">
    <i class="fas fa-times"></i> CANCELAR
</button>
```

## 🎯 Zonas de Apuesta

```html
<div class="betting-grid">
    <div class="betting-zone" data-bet="red">
        <span class="betting-zone-label">ROJO</span>
        <span class="betting-zone-payout">2:1</span>
    </div>
    <div class="betting-zone active" data-bet="black">
        <span class="betting-zone-label">NEGRO</span>
        <span class="betting-zone-payout">2:1</span>
        <span class="betting-zone-chips">$50</span>
    </div>
</div>
```

## 🔔 Sistema de Notificaciones

### Toast Básico

```javascript
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const messageEl = toast.querySelector('.toast-message');
  
  // Limpiar clases anteriores
  toast.className = 'toast';
  
  // Agregar tipo (success, error, warning)
  if (type !== 'info') {
    toast.classList.add(type);
  }
  
  messageEl.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
```

### Win Overlay

```javascript
function showWinOverlay(amount, message) {
  const overlay = document.getElementById('winOverlay');
  const amountEl = document.getElementById('winAmount');
  const messageEl = document.getElementById('winMessage');
  
  amountEl.textContent = `+$${amount.toLocaleString()}`;
  messageEl.textContent = message;
  overlay.classList.add('show');
  
  setTimeout(() => {
    overlay.classList.remove('show');
  }, 3000);
}
```

## 📊 Sidebar de Pagos

```html
<div class="payout-sidebar hidden" id="payoutSidebar">
    <button class="toggle-payout-btn" id="togglePayoutBtn">
        <i class="fas fa-chevron-left"></i>
    </button>
    <div class="payout-sidebar-content">
        <div class="payout-header">
            <h2><i class="fas fa-trophy"></i> PAGOS</h2>
        </div>
        <div class="payout-list">
            <div class="payout-item">
                <span class="hand-name">Royal Flush</span>
                <span class="hand-payout">100:1</span>
            </div>
            <div class="payout-item">
                <span class="hand-name">Straight Flush</span>
                <span class="hand-payout">50:1</span>
            </div>
        </div>
    </div>
</div>
```

```javascript
// Toggle sidebar
document.getElementById('togglePayoutBtn').addEventListener('click', () => {
  document.getElementById('payoutSidebar').classList.toggle('hidden');
});
```

## 🎨 Personalización

Para personalizar colores en un juego específico, crea un CSS adicional:

```css
/* mi-juego.css */
:root {
  /* Sobrescribir colores si es necesario */
  --game-primary: #ff6b6b;
  --game-primary-light: #ff8787;
}

/* Estilos específicos del juego */
.special-feature {
  /* ... */
}
```

## 📱 Responsive

Todos los componentes son responsive automáticamente:
- Desktop: Diseño completo
- Tablet (≤768px): Layout adaptado
- Mobile (≤480px): Vista mobile optimizada

## 🔧 Mejores Prácticas

1. **Usa las variables CSS**: No uses colores hardcoded
2. **Mantén la jerarquía**: Usa las clases base y extiéndelas si es necesario
3. **Consistencia**: Usa los mismos componentes en todos los juegos
4. **Animaciones**: Las animaciones ya están incluidas
5. **Accesibilidad**: Mantén los tamaños de botones (min 40px en mobile)

## 📝 Ejemplo Completo

Ver `poker.ejs` para un ejemplo completo de implementación.
