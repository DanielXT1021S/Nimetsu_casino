// src/middlewares/authMiddleware.js
'use strict';

const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  try {
   
    let authHeader = req.headers['authorization'];
    if (!authHeader) {
      authHeader = req.headers['Authorization'];
    }

    if (!authHeader) {
      return res.status(401).json({
        ok     : false,
        message: 'Falta header Authorization. Por favor, incluye: Authorization: Bearer <token>',
      });
    }

    const parts = authHeader.trim().split(' ');
    
    if (parts.length !== 2) {
      return res.status(401).json({
        ok     : false,
        message: `Formato de autorización inválido. Recibido: "${authHeader}". Usa: Bearer <token>`,
      });
    }

    if (parts[0] !== 'Bearer') {
      return res.status(401).json({
        ok     : false,
        message: `Tipo de autorización inválido. Recibido: "${parts[0]}". Usa: Bearer`,
      });
    }

    const token = parts[1];

    if (!token) {
      return res.status(401).json({
        ok     : false,
        message: 'Token vacío',
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId  : payload.userId,
      nickname: payload.nickname,
      email   : payload.email,
      role    : payload.role || 'user',
    };

    return next();
  } catch (err) {
    console.error('Error en authRequired middleware:', err);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok     : false,
        message: 'Token expirado. Inicia sesión de nuevo.',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        ok     : false,
        message: 'Token inválido',
      });
    }

    return res.status(401).json({
      ok     : false,
      message: 'Error de autenticación: ' + err.message,
    });
  }
}

function authRequiredPage(req, res, next) {

  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  try {
    let token = null;
    
    if (req.cookies && req.cookies.nimetsuCasinoToken) {
      token = req.cookies.nimetsuCasinoToken;
    }
    
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      
      if (cookies.nimetsuCasinoToken) {
        token = cookies.nimetsuCasinoToken;
      }
    }
    
    if (!token) {
      let authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (authHeader) {
        const parts = authHeader.trim().split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }
    }
    
    if (!token) {
      console.log('authRequiredPage: No token found, redirecting to login');
      return res.redirect('/login');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
  
    req.user = {
      userId  : payload.userId,
      nickname: payload.nickname,
      email   : payload.email,
      role    : payload.role,
    };
    
    return next();
  } catch (err) {
    console.error('Error en authRequiredPage:', err.message);
 
    const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.secure;
    res.clearCookie('nimetsuCasinoToken', {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      path: '/',
      domain: req.hostname === 'localhost' ? undefined : '.nimetsu.com'
    });
  
    return res.redirect('/login');
  }
}


function mustBeAdminPage(req, res, next) {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  try {
   
    let token = null;
    
  
    if (req.cookies && req.cookies.nimetsuCasinoToken) {
      token = req.cookies.nimetsuCasinoToken;
    }
    
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      
      if (cookies.nimetsuCasinoToken) {
        token = cookies.nimetsuCasinoToken;
      }
    }
    
    if (!token) {
      let authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (authHeader) {
        const parts = authHeader.trim().split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }
    }
    
    if (!token) {
      return res.redirect('/login');
    }
    
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!['admin', 'superadmin'].includes(payload.role)) {
      return res.redirect('/dashboard');
    }
    
    req.user = {
      userId  : payload.userId,
      nickname: payload.nickname,
      email   : payload.email,
      role    : payload.role,
    };
    
    return next();
  } catch (err) {
    console.error('Error en mustBeAdminPage:', err);
    
    if (err.name === 'TokenExpiredError') {
      return res.redirect('/login?error=expired');
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.redirect('/login?error=invalid');
    }
    
    return res.redirect('/login');
  }
}


function mustBeAdmin(req, res, next) {
  try {
  
    let authHeader = req.headers['authorization'];
    if (!authHeader) {
      authHeader = req.headers['Authorization'];
    }

    if (!authHeader) {
    
      if (req.headers.accept?.includes('application/json')) {
        return res.status(401).json({
          ok: false,
          message: 'No autenticado',
        });
      }
      return res.redirect('/login');
    }

    const parts = authHeader.trim().split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      if (req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ ok: false, message: 'Token inválido' });
      }
      return res.redirect('/login');
    }

    const token = parts[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

   
    if (!['admin', 'superadmin'].includes(payload.role)) {
      if (req.headers.accept?.includes('application/json')) {
        return res.status(403).json({
          ok: false,
          message: 'Acceso denegado. Requiere permisos de administrador.',
        });
      }
     
      return res.redirect('/dashboard');
    }

    req.user = {
      userId  : payload.userId,
      nickname: payload.nickname,
      email   : payload.email,
      role    : payload.role,
    };

    return next();
  } catch (err) {
    console.error('Error en mustBeAdmin middleware:', err);
    
    if (req.headers.accept?.includes('application/json')) {
      return res.status(401).json({
        ok: false,
        message: 'Error de autenticación',
      });
    }
    return res.redirect('/login');
  }
}





function optionalAuth(req, res, next) {
  try {
    let authHeader = req.headers['authorization'];
    if (!authHeader) {
      authHeader = req.headers['Authorization'];
    }

    if (!authHeader) {
      req.user = null;
      return next();
    }

    const parts = authHeader.trim().split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      req.user = null;
      return next();
    }

    const token = parts[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId  : payload.userId,
      nickname: payload.nickname,
      email   : payload.email,
      role    : payload.role || 'user',
    };

    return next();
  } catch (err) {
    req.user = null;
    return next();
  }
}

module.exports = {
  authRequired,
  authRequiredPage,
  mustBeAdmin,
  mustBeAdminPage,
  optionalAuth,
};
