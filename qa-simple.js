/**
  Script de QA - Nimetsu Casino
  
  Descripción:
  Este script evalúa automáticamente la funcionalidad principal del sistema de casino,
  incluyendo autenticación, validaciones de apuestas, lógica de juegos y manejo de balance.
 
 Puntos evaluados:
 
 1. AUTENTICACIÓN (4 pruebas)
    - Login con credenciales correctas (prueba@prueba.com / 12345678)
    - Validación de token JWT en endpoints protegidos
    - Rechazo de login con contraseña incorrecta
    - Rechazo de acceso sin token de autenticación
 
 2. BLACKJACK (6 pruebas)
    - Inicio de juego con apuesta válida (100 fichas)
    - Rechazo de apuestas negativas
    - Rechazo de apuestas en cero
    - Validación de apuesta mínima (5 fichas)
    - Validación de apuesta máxima (5000 fichas)
    - Flujo completo: Stand y resolución de juego
 
 3. RULETA (3 pruebas)
    - Apuesta simple en color (rojo/negro)
    - Rechazo de apuestas negativas
    - Rechazo de tipos de apuesta inválidos
 
 4. SLOTS (3 pruebas)
    - Spin con apuesta válida (50 fichas)
    - Rechazo de apuestas negativas
    - Validación de apuesta mínima (10 fichas)
 
 5. POKER (2 pruebas)
    - Unirse a mesa con buy-in válido (500 fichas)
    - Rechazo de buy-in negativo
 
 6. INTEGRIDAD DE BALANCE (2 pruebas)
    - Verificación de balance numérico válido
    - Validación de balance no negativo después de operaciones
 
 Total: 20 pruebas
 Resultado esperado: 100% de éxito (20/20)
 
 Ejecución: node qa-simple.js
 Credenciales de prueba: prueba@prueba.com / 12345678


 Resultado:

 root@Nimetu-Casino:~/Descargas/nimetsu-new/Casino$ node qa-simple.js

========================================
  PRUEBAS QA - NIMETSU CASINO
========================================
  URL: http://localhost:7000
  Usuario: prueba@prueba.com
  Fecha: 25-11-2025, 11:02:51 p. m.
========================================

[====] PRUEBAS DE AUTENTICACION

[PASS] Login con credenciales correctas
[INFO] Token obtenido - Usuario ID: 7
[PASS] Token de autenticacion valido
[INFO] Balance inicial: 58650 fichas
[PASS] Login con password incorrecta rechazado
[PASS] Acceso sin token rechazado

[====] PRUEBAS DE BLACKJACK

[PASS] Iniciar juego con apuesta valida (100 fichas)
[INFO] Cartas jugador: 2 | Valor: 12
[INFO] Cartas dealer: 2 | Valor: 13
[PASS] Apuesta negativa rechazada
[PASS] Apuesta cero rechazada
[PASS] Apuesta menor al minimo rechazada (1 < 5)
[PASS] Apuesta mayor al maximo rechazada (10000 > 5000)
[INFO] Probando accion Stand...
[PASS] Accion Stand ejecutada correctamente
[INFO] Resultado del juego: win
[INFO] Jugador: 19 | Dealer: 18

[====] PRUEBAS DE RULETA

[PASS] Apuesta en rojo aceptada
[INFO] Numero ganador: 19 (red)
[INFO] Resultado: win
[PASS] Apuesta negativa en ruleta rechazada
[PASS] Tipo de apuesta invalido rechazado

[====] PRUEBAS DE SLOTS

[PASS] Spin de slots con apuesta valida (50 fichas)
[INFO] Resultado: 5x3 grid
[INFO] Ganancia: 0 fichas
[PASS] Apuesta negativa en slots rechazada
[PASS] Apuesta menor al minimo rechazada (5 < 10)

[====] PRUEBAS DE POKER

[PASS] Unirse a mesa de poker con buy-in valido
[INFO] Mesa ID: table_1764122581680_7
[INFO] Fichas en mesa: 500
[PASS] Buy-in negativo rechazado

[====] PRUEBAS DE INTEGRIDAD DE BALANCE

[INFO] Balance inicial: 58650 fichas
[INFO] Balance final: 58600 fichas
[INFO] Diferencia: -50 fichas
[PASS] Balance es un numero valido
[PASS] Balance no es negativo

========================================
  RESUMEN DE PRUEBAS
========================================
  Total:    20 pruebas
  Exitosas: 20
  Fallidas:  0
  Tasa:     100.0%
  Duracion: 12.10s
========================================
  Todas las pruebas pasaron exitosamente
 */

'use strict';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7000';
const TEST_EMAIL = 'prueba@prueba.com';
const TEST_PASSWORD = '12345678';

const config = {
  colors: {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
  },
  delays: {
    betweenTests: 500,
    betweenSuites: 1000,
  }
};

const state = {
  token: null,
  userId: null,
  initialBalance: null,
  testsPassed: 0,
  testsFailed: 0,
  startTime: null,
};

function log(type, message, details = '') {
  const symbols = {
    pass: '[PASS]',
    fail: '[FAIL]',
    info: '[INFO]',
    warn: '[WARN]',
    section: '[====]',
  };
  
  const colors = {
    pass: config.colors.green,
    fail: config.colors.red,
    info: config.colors.cyan,
    warn: config.colors.yellow,
    section: config.colors.blue,
  };
  
  const color = colors[type] || config.colors.reset;
  const symbol = symbols[type] || '[    ]';
  const detailsStr = details ? ` - ${details}` : '';
  
  console.log(`${color}${symbol}${config.colors.reset} ${message}${detailsStr}`);
}

function section(title) {
  console.log('');
  log('section', title);
  console.log('');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(endpoint, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    return { response, data, error: null };
  } catch (error) {
    return { response: null, data: null, error };
  }
}

function assertTest(condition, testName, errorMessage = '') {
  if (condition) {
    state.testsPassed++;
    log('pass', testName);
    return true;
  } else {
    state.testsFailed++;
    log('fail', testName, errorMessage);
    return false;
  }
}

async function testAuthentication() {
  section('PRUEBAS DE AUTENTICACION');
  
  const { response, data, error } = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });
  
  if (error) {
    assertTest(false, 'Login con credenciales correctas', `Error: ${error.message}`);
    log('fail', 'No se puede continuar sin autenticacion. Abortando...');
    process.exit(1);
  }
  
  const loginSuccess = response.status === 200 && data.ok && data.token;
  assertTest(loginSuccess, 'Login con credenciales correctas', loginSuccess ? '' : data.message);
  
  if (loginSuccess) {
    state.token = data.token;
    state.userId = data.user?.userId;
    log('info', `Token obtenido - Usuario ID: ${state.userId}`);
  } else {
    log('fail', 'No se pudo obtener token. Abortando...');
    process.exit(1);
  }
  
  await sleep(config.delays.betweenTests);
  
  const { response: balanceResp, data: balanceData, error: balanceError } = await makeRequest('/user/balance', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
  });
  
  const tokenValid = balanceResp && balanceResp.status === 200 && balanceData && balanceData.ok;
  assertTest(tokenValid, 'Token de autenticacion valido', tokenValid ? '' : 'Token rechazado');
  
  if (tokenValid && balanceData.balance !== undefined) {
    state.initialBalance = balanceData.balance;
    log('info', `Balance inicial: ${state.initialBalance} fichas`);
  }
  
  await sleep(config.delays.betweenTests);
  
  const { response: badLoginResp, data: badLoginData } = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: 'passwordincorrecto',
    }),
  });
  
  assertTest(
    badLoginResp && badLoginResp.status === 401 && badLoginData && !badLoginData.ok,
    'Login con password incorrecta rechazado',
    badLoginResp && badLoginResp.status === 401 ? '' : 'Deberia rechazar password incorrecta'
  );
  
  await sleep(config.delays.betweenTests);
  
  const { response: noTokenResp } = await makeRequest('/user/balance', {
    method: 'GET',
  });
  
  assertTest(
    noTokenResp && noTokenResp.status === 401,
    'Acceso sin token rechazado',
    noTokenResp && noTokenResp.status === 401 ? '' : 'Deberia requerir autenticacion'
  );
}

async function testBlackjack() {
  section('PRUEBAS DE BLACKJACK');
  
  const { response, data } = await makeRequest('/api/blackjack/init', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({ bet: 100 }),
  });
  
  const gameStarted = response && response.status === 200 && data && data.ok;
  assertTest(gameStarted, 'Iniciar juego con apuesta valida (100 fichas)', gameStarted ? '' : (data ? data.message : 'Error de conexion'));
  
  if (gameStarted && data) {
    log('info', `Cartas jugador: ${data.playerHand?.length || 0} | Valor: ${data.playerValue || 0}`);
    log('info', `Cartas dealer: ${data.dealerHand?.length || 0} | Valor: ${data.dealerValue || 0}`);
  }
  
  await sleep(config.delays.betweenTests);
  
  const { response: negResp, data: negData } = await makeRequest('/api/blackjack/init', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({ bet: -100 }),
  });
  
  assertTest(
    negResp.status === 400 && !negData.ok,
    'Apuesta negativa rechazada',
    negResp.status === 400 ? '' : 'CRITICO: Apuesta negativa fue aceptada'
  );
  
  await sleep(config.delays.betweenTests);
  
  const { response: zeroResp, data: zeroData } = await makeRequest('/api/blackjack/init', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({ bet: 0 }),
  });
  
  assertTest(
    zeroResp.status === 400 && !zeroData.ok,
    'Apuesta cero rechazada',
    zeroResp.status === 400 ? '' : 'Apuesta cero deberia ser rechazada'
  );
  
  await sleep(config.delays.betweenTests);
  
  const { response: minResp, data: minData } = await makeRequest('/api/blackjack/init', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({ bet: 1 }),
  });
  
  assertTest(
    minResp.status === 400 && !minData.ok,
    'Apuesta menor al minimo rechazada (1 < 5)',
    minResp.status === 400 ? '' : 'Deberia rechazar apuestas menores a 5'
  );
  
  await sleep(config.delays.betweenTests);
  
  const { response: maxResp, data: maxData } = await makeRequest('/api/blackjack/init', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({ bet: 10000 }),
  });
  
  assertTest(
    maxResp.status === 400 && !maxData.ok,
    'Apuesta mayor al maximo rechazada (10000 > 5000)',
    maxResp.status === 400 ? '' : 'Deberia rechazar apuestas mayores a 5000'
  );
  
  await sleep(config.delays.betweenTests);
  
  const { response: initResp, data: initData } = await makeRequest('/api/blackjack/init', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({ bet: 50 }),
  });
  
  if (initResp.status === 200 && initData.ok && !initData.playerBlackjack && !initData.dealerBlackjack) {
    log('info', 'Probando accion Stand...');
    
    const { response: standResp, data: standData } = await makeRequest('/api/blackjack/stand', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.token}`,
      },
      body: JSON.stringify({
        playerHand: initData.playerHand,
        dealerHand: initData.dealerHand,
        bet: 50,
      }),
    });
    
    const standWorks = standResp && standResp.status === 200 && standData && standData.ok && standData.result;
    assertTest(standWorks, 'Accion Stand ejecutada correctamente', standWorks ? `Resultado: ${standData.result}` : (standData ? standData.message : 'Error de conexion'));
    
    if (standWorks && standData) {
      log('info', `Resultado del juego: ${standData.result}`);
      log('info', `Jugador: ${standData.playerValue} | Dealer: ${standData.dealerValue}`);
    }
  } else {
    log('warn', 'Salteando test de Stand - juego termino con Blackjack natural');
  }
}

async function testRoulette() {
  section('PRUEBAS DE RULETA');
  
  const { response, data } = await makeRequest('/api/roulette/bet', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({
      betType: 'red',
      betAmount: 50,
    }),
  });
  
  const betPlaced = response && response.status === 200 && data && data.ok;
  assertTest(betPlaced, 'Apuesta en rojo aceptada', betPlaced ? '' : (data ? data.message : 'Error de conexion'));
  
  if (betPlaced && data) {
    log('info', `Numero ganador: ${data.winningNumber} (${data.color})`);
    log('info', `Resultado: ${data.result}`);
  }
  
  await sleep(config.delays.betweenTests);
  
  const { response: negResp, data: negData } = await makeRequest('/api/roulette/bet', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({
      betType: 'black',
      betAmount: -50,
    }),
  });
  
  assertTest(
    negResp && negResp.status === 400 && negData && !negData.ok,
    'Apuesta negativa en ruleta rechazada',
    negResp && negResp.status === 400 ? '' : 'CRITICO: Apuesta negativa aceptada'
  );
  
  await sleep(config.delays.betweenTests);
  
  const { response: invResp, data: invData } = await makeRequest('/api/roulette/bet', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({
      betType: 'invalidType',
      betAmount: 50,
    }),
  });
  
  assertTest(
    invResp && invResp.status === 400 && invData && !invData.ok,
    'Tipo de apuesta invalido rechazado',
    invResp && invResp.status === 400 ? '' : 'Deberia rechazar tipos de apuesta invalidos'
  );
}

async function testSlots() {
  section('PRUEBAS DE SLOTS');
  
  const { response, data } = await makeRequest('/slots/spin', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({ betAmount: 50 }),
  });
  
  const spinSuccess = response && response.status === 200 && data && data.ok;
  assertTest(spinSuccess, 'Spin de slots con apuesta valida (50 fichas)', spinSuccess ? '' : (data ? data.message : 'Error de conexion'));
  
  if (spinSuccess && data) {
    const resultGrid = data.result?.grid || [];
    const gridDisplay = resultGrid.length > 0 ? `${resultGrid.length}x${resultGrid[0]?.length || 0} grid` : 'N/A';
    log('info', `Resultado: ${gridDisplay}`);
    log('info', `Ganancia: ${data.winAmount || 0} fichas`);
  }
  
  await sleep(config.delays.betweenTests);
  
  const { response: negResp, data: negData } = await makeRequest('/slots/spin', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({ betAmount: -50 }),
  });
  
  assertTest(
    negResp && negResp.status === 400 && negData && !negData.ok,
    'Apuesta negativa en slots rechazada',
    negResp && negResp.status === 400 ? '' : 'CRITICO: Apuesta negativa aceptada'
  );
  
  await sleep(config.delays.betweenTests);
  
  const { response: minResp, data: minData } = await makeRequest('/slots/spin', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({ betAmount: 5 }),
  });
  
  assertTest(
    minResp && minResp.status === 400 && minData && !minData.ok,
    'Apuesta menor al minimo rechazada (5 < 10)',
    minResp && minResp.status === 400 ? '' : 'Deberia rechazar apuestas menores a 10'
  );
}

async function testPoker() {
  section('PRUEBAS DE POKER');
  
  const { response, data } = await makeRequest('/poker/join', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({ buyIn: 500 }),
  });
  
  const joinSuccess = response && response.status === 200 && data && data.ok;
  assertTest(joinSuccess, 'Unirse a mesa de poker con buy-in valido', joinSuccess ? '' : (data ? data.message : 'Error de conexion'));
  
  if (joinSuccess && data) {
    log('info', `Mesa ID: ${data.tableId || 'N/A'}`);
    log('info', `Fichas en mesa: ${data.chips || 500}`);
  }
  
  await sleep(config.delays.betweenTests);
  
  const { response: negResp, data: negData } = await makeRequest('/poker/join', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
    body: JSON.stringify({ buyIn: -500 }),
  });
  
  assertTest(
    negResp && negResp.status === 400 && negData && !negData.ok,
    'Buy-in negativo rechazado',
    negResp && negResp.status === 400 ? '' : 'CRITICO: Buy-in negativo aceptado'
  );
}

async function testBalanceIntegrity() {
  section('PRUEBAS DE INTEGRIDAD DE BALANCE');
  
  const { response, data } = await makeRequest('/user/balance', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${state.token}`,
    },
  });
  
  if (response && response.status === 200 && data && data.ok) {
    const finalBalance = data.balance;
    log('info', `Balance inicial: ${state.initialBalance} fichas`);
    log('info', `Balance final: ${finalBalance} fichas`);
    log('info', `Diferencia: ${finalBalance - state.initialBalance} fichas`);
    
    const balanceIsNumber = typeof finalBalance === 'number';
    assertTest(balanceIsNumber, 'Balance es un numero valido', balanceIsNumber ? '' : 'Balance no es numerico');
    
    const balanceNotNegative = finalBalance >= 0;
    assertTest(balanceNotNegative, 'Balance no es negativo', balanceNotNegative ? '' : `Balance negativo: ${finalBalance}`);
  } else {
    assertTest(false, 'Obtener balance final', 'No se pudo obtener balance');
  }
}

async function runAllTests() {
  state.startTime = Date.now();
  
  console.log('');
  console.log('========================================');
  console.log('  PRUEBAS QA - NIMETSU CASINO');
  console.log('========================================');
  console.log(`  URL: ${BASE_URL}`);
  console.log(`  Usuario: ${TEST_EMAIL}`);
  console.log(`  Fecha: ${new Date().toLocaleString('es-CL')}`);
  console.log('========================================');
  
  try {
    await testAuthentication();
    await sleep(config.delays.betweenSuites);
    
    await testBlackjack();
    await sleep(config.delays.betweenSuites);
    
    await testRoulette();
    await sleep(config.delays.betweenSuites);
    
    await testSlots();
    await sleep(config.delays.betweenSuites);
    
    await testPoker();
    await sleep(config.delays.betweenSuites);
    
    await testBalanceIntegrity();
    
  } catch (error) {
    log('fail', 'Error inesperado durante las pruebas', error.message);
    console.error(error);
  }
  
  const duration = ((Date.now() - state.startTime) / 1000).toFixed(2);
  const total = state.testsPassed + state.testsFailed;
  const passRate = total > 0 ? ((state.testsPassed / total) * 100).toFixed(1) : 0;
  
  console.log('');
  console.log('========================================');
  console.log('  RESUMEN DE PRUEBAS');
  console.log('========================================');
  console.log(`  Total:    ${total} pruebas`);
  console.log(`  ${config.colors.green}Exitosas: ${state.testsPassed}${config.colors.reset}`);
  console.log(`  ${config.colors.red}Fallidas:  ${state.testsFailed}${config.colors.reset}`);
  console.log(`  Tasa:     ${passRate}%`);
  console.log(`  Duracion: ${duration}s`);
  console.log('========================================');
  
  if (state.testsFailed === 0) {
    console.log(`${config.colors.green}  Todas las pruebas pasaron exitosamente${config.colors.reset}`);
  } else {
    console.log(`${config.colors.yellow}  Se encontraron ${state.testsFailed} problemas${config.colors.reset}`);
    console.log(`${config.colors.yellow}  Revisar los detalles arriba${config.colors.reset}`);
  }
  
  console.log('========================================');
  console.log('');
  
  process.exit(state.testsFailed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
