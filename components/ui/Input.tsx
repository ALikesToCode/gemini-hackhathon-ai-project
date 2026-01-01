import React, { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const baseInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    backgroundColor: "var(--surface)",
    fontSize: "1rem",
    color: "var(--ink)",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    fontFamily: "var(--font-sans)",
};

const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "var(--primary)";
    e.target.style.boxShadow = "0 0 0 3px rgba(15, 118, 110, 0.1)";
};

const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, hasError: boolean) => {
    e.target.style.borderColor = hasError ? "var(--error)" : "var(--border)";
    e.target.style.boxShadow = "none";
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, style, ...props }, ref) => {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                {label && (
                    <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ink)" }}>
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    style={{ ...baseInputStyle, borderColor: error ? "var(--error)" : "var(--border)", ...style }}
                    onFocus={focusStyle}
                    onBlur={(e) => blurStyle(e, !!error)}
                    {...props}
                />
                {error && <span style={{ fontSize: "0.85rem", color: "var(--error)" }}>{error}</span>}
            </div>
        );
    }
);

Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, style, ...props }, ref) => {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                {label && (
                    <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ink)" }}>
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    style={{
                        ...baseInputStyle,
                        minHeight: "120px",
                        resize: "vertical",
                        borderColor: error ? "var(--error)" : "var(--border)",
                        ...style
                    }}
                    onFocus={focusStyle}
                    onBlur={(e) => blurStyle(e, !!error)}
                    {...props}
                />
                {error && <span style={{ fontSize: "0.85rem", color: "var(--error)" }}>{error}</span>}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";
