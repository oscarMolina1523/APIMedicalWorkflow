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

## Comparativo: Entorno de Desarrollo vs Entorno Productivo

La severidad de una vulnerabilidad depende directamente del entorno donde se encuentra desplegada la aplicación. Durante la fase de desarrollo, el sistema opera bajo condiciones controladas y con acceso restringido, mientras que en producción se encuentra expuesto a usuarios reales y almacena información sensible.

### Entorno de Desarrollo

Características:

* Acceso limitado al equipo de desarrollo.
* Ambiente controlado y aislado.
* Menor volumen de usuarios concurrentes.
* Información utilizada principalmente para pruebas.
* Menor exposición a amenazas externas.

Impacto esperado ante una vulnerabilidad:

**Moderado**

Aunque una vulnerabilidad puede afectar el funcionamiento del sistema, el alcance suele estar limitado al entorno interno y no compromete directamente información de usuarios finales.

---

### Entorno Productivo

Características:

* Exposición a redes públicas o corporativas.
* Almacenamiento de información médica y administrativa.
* Acceso concurrente de múltiples usuarios.
* Dependencia operativa para procesos críticos del negocio.
* Mayor superficie de ataque.

Impacto esperado ante una vulnerabilidad:

**Crítico**

La explotación de una vulnerabilidad puede afectar la disponibilidad del servicio, comprometer información sensible o generar incumplimientos regulatorios.

---

### Comparativa de Impacto

| Vulnerabilidad                      | Desarrollo | Producción |
| ----------------------------------- | ---------- | ---------- |
| Token JWT comprometido              | Medio      | Crítico    |
| Exposición de datos                 | Medio      | Crítico    |
| Denegación de servicio (DoS)        | Medio      | Crítico    |
| Error de configuración              | Bajo       | Alto       |
| Fuga de información médica          | Alto       | Crítico    |
| Acceso no autorizado                | Medio      | Crítico    |
| Exposición de documentación técnica | Bajo       | Alto       |
| Manipulación de datos               | Medio      | Crítico    |

La comparación evidencia que vulnerabilidades consideradas aceptables o de impacto moderado durante el desarrollo pueden convertirse en incidentes críticos una vez que el sistema es desplegado en producción.

---

# Impacto Respecto a la Legislación

ApiMedical administra información relacionada con:

* Usuarios del sistema.
* Pacientes.
* Citas médicas.
* Medicamentos.
* Inventarios.
* Facturación y registros administrativos.

Debido a la naturaleza de estos datos, gran parte de la información procesada puede considerarse sensible o confidencial.

## Riesgos Legales Asociados

La explotación de vulnerabilidades podría provocar:

* Acceso no autorizado a información médica.
* Divulgación de datos personales.
* Alteración de registros clínicos.
* Pérdida de trazabilidad de acciones realizadas por los usuarios.
* Interrupción de servicios críticos.

## Contribución de las Medidas Implementadas

Las mejoras de seguridad incorporadas permiten reducir estos riesgos mediante:

* Protección de mecanismos de autenticación.
* Validación y control de datos de entrada.
* Limitación de solicitudes maliciosas.
* Reducción de exposición de información sensible.
* Fortalecimiento de la disponibilidad del servicio.
* Mejora de la trazabilidad y control de acceso.

## Alineación con Buenas Prácticas Regulatorias

Si bien el proyecto fue desarrollado con fines académicos y técnicos, las medidas implementadas siguen principios presentes en marcos regulatorios y estándares internacionales ampliamente utilizados:

* GDPR (General Data Protection Regulation).
* HIPAA (Health Insurance Portability and Accountability Act).
* Principios de Protección de Datos Personales.
* OWASP Top 10.
* OWASP API Security Top 10.
* NIST Cybersecurity Framework.

Estas prácticas contribuyen a fortalecer la confidencialidad, integridad y disponibilidad de la información, reduciendo la probabilidad de incidentes de seguridad y facilitando una futura adaptación a requisitos regulatorios más estrictos.

# Conclusión

Tras la aplicación de controles de seguridad basados en STRIDE, ApiMedical incrementó significativamente su nivel de protección frente a amenazas comunes en aplicaciones web modernas.

Las mejoras implementadas fortalecen la autenticación, validación de datos, disponibilidad del servicio y protección de información sensible, manteniendo la arquitectura DDD existente y respetando los principios de separación de responsabilidades definidos en el proyecto.
