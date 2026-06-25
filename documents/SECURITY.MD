# Security Assessment Report - ApiMedical

## Overview

Este documento describe el análisis de seguridad realizado sobre el proyecto ApiMedical utilizando la metodología STRIDE, identificando amenazas potenciales, controles existentes y mejoras implementadas para fortalecer la seguridad del sistema.

---

# Arquitectura del Sistema

El proyecto sigue una arquitectura basada en Domain Driven Design (DDD) separada en las siguientes capas:

```text
src
├── Application.Endpoint
├── Domain.Endpoint
├── Infrastructure.Endpoint
├── Shared
└── WebApi
```

### Componentes principales

* API REST desarrollada con Express y TypeScript.
* Arquitectura DDD.
* Inyección de dependencias mediante Tsyringe.
* Autenticación basada en JWT.
* Persistencia mediante Turso Database.
* Documentación OpenAPI / Scalar.

---

# Metodología STRIDE

STRIDE permite identificar amenazas en seis categorías:

| Categoría              | Descripción                     |
| ---------------------- | ------------------------------- |
| Spoofing               | Suplantación de identidad       |
| Tampering              | Manipulación de datos           |
| Repudiation            | Negación de acciones realizadas |
| Information Disclosure | Divulgación de información      |
| Denial of Service      | Denegación de servicio          |
| Elevation of Privilege | Escalación de privilegios       |

---

# S - Spoofing (Suplantación de identidad)

## Estado Inicial

El sistema ya implementaba autenticación basada en JSON Web Tokens (JWT) mediante middleware de validación.

### Controles existentes

* Verificación de firma JWT.
* Protección de endpoints mediante middleware.
* Uso de variables de entorno para la clave secreta.

### Riesgos identificados

* Posibilidad de envío del token mediante query string.
* Ausencia de validación estricta de issuer y audience.

### Impacto

Un token expuesto en URLs podría almacenarse en:

* Historial del navegador.
* Logs de servidores.
* Proxies inversos.
* Herramientas de monitoreo.

## Mitigaciones Implementadas

### Eliminación de token por Query String

Antes:

```typescript
if (!accessToken && req.query.token) {
 accessToken = req.query.token as string;
}
```

Después:

```typescript
const accessToken = req.headers["authorization"];
```

### Fortalecimiento JWT

Se agregó validación de:

* Expiration
* Issuer
* Audience

Beneficio:

Mayor protección frente a intentos de falsificación de tokens.

---

# T - Tampering (Manipulación de datos)

## Estado Inicial

La API aceptaba datos de entrada sin validaciones centralizadas.

### Riesgos identificados

* Datos inválidos.
* Alteración de información.
* Posible almacenamiento de contenido malicioso.

Ejemplos:

```json
{
  "email": "<script>alert(1)</script>"
}
```

```json
{
  "price": -999999
}
```

## Mitigaciones Implementadas

### Validaciones con Zod

Se creó la carpeta:

```text
WebApi/validators
```

Ejemplo:

```typescript
const loginSchema = z.object({
 email: z.string().email(),
 password: z.string().min(8)
});
```

### Beneficios

* Validación temprana.
* Protección contra datos corruptos.
* Mayor integridad de la información.

---

# R - Repudiation (Repudio)

## Estado Inicial

El sistema ya contaba con mecanismos propios de auditoría.

### Controles existentes

* Registro de acciones mediante servicios de auditoría.
* Trazabilidad de operaciones críticas.

### Evaluación

No se detectaron vulnerabilidades críticas relacionadas con repudio debido a que el sistema ya implementaba controles de auditoría.

### Estado

Mitigado mediante la solución existente.

---

# I - Information Disclosure (Divulgación de Información)

## Estado Inicial

Se identificaron posibles fugas de información sensible.

### Riesgos identificados

#### Exposición de errores internos

Antes:

```typescript
res.status(500).json({
 message: "Error",
 error
});
```

Esto podía revelar:

* Stack traces.
* Estructura interna.
* Información técnica sensible.

#### Exposición de documentación OpenAPI

La documentación podía encontrarse disponible públicamente.

## Mitigaciones Implementadas

### Sanitización de errores

Después:

```typescript
res.status(500).json({
 message: "Internal server error"
});
```

### Beneficios

* Menor exposición de información interna.
* Reducción de superficie de reconocimiento para atacantes.

---

# D - Denial of Service (Denegación de Servicio)

## Estado Inicial

No existían mecanismos específicos para limitar abuso de recursos.

### Riesgos identificados

#### Ataques por fuerza bruta

Miles de peticiones contra:

```text
/auth/login
```

#### Payloads excesivos

Solicitudes con cuerpos extremadamente grandes.

## Mitigaciones Implementadas

### Express Rate Limit

Implementado:

```typescript
app.use(apiLimiter);
```

Configuración:

```typescript
windowMs: 15 * 60 * 1000
max: 200
```

### Límite de tamaño JSON

```typescript
app.use(express.json({
 limit: "1mb"
}));
```

### Beneficios

* Protección frente a abuso automatizado.
* Reducción de consumo excesivo de memoria.
* Mayor disponibilidad del servicio.

---

# E - Elevation of Privilege (Escalación de Privilegios)

## Estado Inicial

El proyecto ya implementaba controles internos de autorización basados en roles.

### Controles existentes

* Validación de permisos.
* Restricción de acceso según perfil de usuario.
* Gestión de roles dentro de la lógica de negocio.

### Evaluación

No fue necesario implementar un middleware adicional de autorización debido a que el sistema ya aplicaba controles equivalentes.

### Estado

Mitigado mediante implementación existente.

---

# Hardening Adicional Implementado

## Helmet

Implementación:

```typescript
app.use(helmet());
```

Beneficios:

* Protección contra Clickjacking.
* Protección frente a MIME Sniffing.
* Configuración de cabeceras seguras.

---

## Dockerización

Se incorporó:

```text
Dockerfile
docker-compose.yml
```

Beneficios:

* Portabilidad.
* Consistencia entre entornos.
* Facilidad de despliegue.

---

## Variables de Entorno

Uso de:

```text
.env
.env.production
```

Protección:

```text
.gitignore
```

Beneficios:

* Evita exposición de secretos.
* Facilita despliegues seguros.

---

# Resultado Final

## Antes

| Categoría             | Estado      |
| --------------------- | ----------- |
| Validación de entrada | Deficiente  |
| Protección DoS        | Inexistente |
| Hardening HTTP        | Inexistente |
| Gestión de errores    | Mejorable   |
| JWT                   | Parcial     |

## Después

| Categoría          | Estado        |
| ------------------ | ------------- |
| JWT                | Fortalecido   |
| Validaciones       | Implementadas |
| Protección DoS     | Implementada  |
| Hardening HTTP     | Implementado  |
| Dockerización      | Implementada  |
| Gestión de errores | Mejorada      |
| Auditoría          | Existente     |
| Control de roles   | Existente     |

---

# Conclusión

Tras la aplicación de controles de seguridad basados en STRIDE, ApiMedical incrementó significativamente su nivel de protección frente a amenazas comunes en aplicaciones web modernas.

Las mejoras implementadas fortalecen la autenticación, validación de datos, disponibilidad del servicio y protección de información sensible, manteniendo la arquitectura DDD existente y respetando los principios de separación de responsabilidades definidos en el proyecto.
