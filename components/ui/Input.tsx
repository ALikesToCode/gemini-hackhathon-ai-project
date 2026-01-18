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
    border: "1px solid rgba(255, 255, 255, 0.1)", // Light border for dark theme
    backgroundColor: "rgba(0, 0, 0, 0.2)", // Dark semi-transparent
    fontSize: "1rem",
    color: "#fff", // White text
    transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
    outline: "none",
    fontFamily: "var(--font-sans)",
};

const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = "var(--primary)";
    e.target.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    e.target.style.boxShadow = "0 0 0 3px rgba(251, 191, 36, 0.15)";
};

const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, hasError: boolean) => {
    e.target.style.borderColor = hasError ? "var(--error)" : "rgba(255, 255, 255, 0.1)";
    e.target.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
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
