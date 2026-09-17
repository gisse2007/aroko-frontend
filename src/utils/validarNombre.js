// Letras (con tildes y ñ/Ñ) y espacios únicamente — sin números ni caracteres especiales.
export const NOMBRE_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;

export const MENSAJE_NOMBRE_INVALIDO = "Solo se permiten letras y espacios (sin números ni caracteres especiales).";

/** Regla lista para usar con react-hook-form: {...register("nombre", nombreValidationRule)} */
export const nombreValidationRule = {
  pattern: {
    value: NOMBRE_REGEX,
    message: MENSAJE_NOMBRE_INVALIDO,
  },
};
