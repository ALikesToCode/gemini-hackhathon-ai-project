import React from "react";

interface BadgeProps {
    color?: "primary" | "secondary" | "success" | "warning" | "error";
    children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ color = "primary", children }) => {
    const styles: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    };

    const colorStyles = {
        primary: { backgroundColor: "rgba(251, 191, 36, 0.15)", color: "var(--primary)" },
        secondary: { backgroundColor: "var(--surface-3)", color: "var(--ink-secondary)" },
        success: { backgroundColor: "rgba(52, 211, 153, 0.15)", color: "var(--success)" },
        warning: { backgroundColor: "rgba(251, 191, 36, 0.15)", color: "var(--warning)" },
        error: { backgroundColor: "rgba(248, 113, 113, 0.15)", color: "var(--error)" },
    };

    return (
        <span style={{ ...styles, ...colorStyles[color] }}>
            {children}
        </span>
    );
};
