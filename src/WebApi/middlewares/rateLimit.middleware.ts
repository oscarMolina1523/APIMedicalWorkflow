import rateLimit from "express-rate-limit";

//rate limiting para aceptar maximo de consultas
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 200,

  message: {
    message: "Too many requests",
  },
});
