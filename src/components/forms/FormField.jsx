import { forwardRef } from "react";
import styles from "./FormField.module.css";

/**
 * Tipos soportados: text | number | email | password | tel | date | select | textarea
 */
const FormField = forwardRef(function FormField(
  { label, name, type = "text", options = [], error, placeholder, onChange, onMaxLengthReached, maxLength, ...rest },
  ref
) {
  const errorId = error ? `${name}-error` : undefined;
  const inputClass = `${styles.input} ${error ? styles.inputError : ""}`.trim();
  const selectClass = `${styles.select} ${error ? styles.inputError : ""}`.trim();
  const textareaClass = `${styles.textarea} ${styles.input} ${error ? styles.inputError : ""}`.trim();

  const handleInputChange = (event) => {
    if (type === "tel") {
      const sanitized = event.target.value.replace(/\D/g, "").slice(0, 10);
      if (event.target.value !== sanitized) {
        event.target.value = sanitized;
      }
      if (sanitized.length === 10) {
        onMaxLengthReached?.();
      }
    }

    if (maxLength && event.target.value.length >= maxLength) {
      onMaxLengthReached?.();
    }

    onChange?.(event);
  };

  return (
    <div className={styles.field}>
      {label && <label className={styles.label} htmlFor={name}>{label}</label>}

      {type === "select" ? (
        <select
          id={name}
          name={name}
          ref={ref}
          className={selectClass}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...rest}
        >
          {options[0]?.value === "" ? null : <option value="">— Seleccionar —</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          ref={ref}
          rows={3}
          placeholder={placeholder}
          className={textareaClass}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...rest}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          ref={ref}
          placeholder={placeholder}
          className={inputClass}
          aria-invalid={!!error}
          aria-describedby={errorId}
          maxLength={type === "tel" ? 10 : maxLength}
          onChange={handleInputChange}
          {...rest}
        />
      )}

      {error && (
        <span id={errorId} role="alert" className={styles.error}>
          {error.message}
        </span>
      )}
    </div>
  );
});

export default FormField;
