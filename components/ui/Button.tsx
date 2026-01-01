import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {

        // Base styles
        const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

        // Size variants
        const sizeStyles = {
            sm: "px-3 py-1.5 text-sm rounded-lg",
            md: "px-5 py-2.5 text-base rounded-xl",
            lg: "px-6 py-3.5 text-lg rounded-2xl",
        };

        // Style variants using CSS variables defined in globals.css
        const variantStyles = {
            primary: `
        background-color: var(--primary);
        color: white;
        box-shadow: 0 4px 14px 0 rgba(15, 118, 110, 0.39);
      `,
            secondary: `
        background-color: var(--surface);
        color: var(--ink);
        border: 1px solid var(--border);
      `,
            ghost: `
        background-color: transparent;
        color: var(--ink-secondary);
      `,
            danger: `
        background-color: #fee2e2;
        color: #ef4444;
      `
        };

        // We can't use Tailwind utility classes for colors since we are using CSS variables directly in some cases,
        // or standard CSS. Given the project structure seems to mix CSS and potential Tailwind-like utility usage in classNames,
        // but the user's prompt implies a "lot of work" on frontend, I will stick to a clean style object or standard classes 
        // where appropriate.
        // However, to make this truly reusable and clean, I will use a combination of inline styles for the dynamic parts 
        // (since we are not using a full CSS-in-JS library) and standard class names for layout.

        // Actually, let's stick to standard class names that map to the CSS we wrote, or inline styles where specific variable usage is needed.
        // To keep it simple and given the existing codebase used vanilla CSS classes:

        let buttonClass = `button ${variant} ${size} ${className}`;

        // Since I can't easily rely on Tailwind classes being available (the user prompt said "modern and elegant", not necessarily Tailwind migration), 
        // I will use a scoped module approach or just style access.
        // BUT! I defined variables in globals.css. Let's use a style object for the specific variant colors to ensure they apply correctly
        // or rely on the classes I will define in a CSS module or global CSS.

        // Let's create a specific CSS file for components or use inline styles for now to be safe and portable.

        const style: React.CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: variant === "secondary" ? "1px solid var(--border)" : "none",
            backgroundColor: variant === "primary" ? "var(--primary)" :
                variant === "danger" ? "#fee2e2" :
                    variant === "secondary" ? "var(--surface)" : "transparent",
            color: variant === "primary" ? "white" :
                variant === "danger" ? "#b91c1c" :
                    variant === "secondary" ? "var(--ink)" : "var(--ink-secondary)",
            padding: size === "sm" ? "6px 12px" : size === "md" ? "10px 20px" : "14px 24px",
            fontSize: size === "sm" ? "0.875rem" : size === "md" ? "1rem" : "1.125rem",
            borderRadius: "var(--radius)",
            cursor: disabled || isLoading ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            transition: "all 0.2s ease",
            fontWeight: 600,
            boxShadow: variant === "primary" ? "0 4px 12px rgba(15, 118, 110, 0.3)" : "none",
            ...props.style
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                style={style}
                {...props}
                onMouseEnter={(e) => {
                    if (!disabled && !isLoading) {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        if (variant === "primary") e.currentTarget.style.boxShadow = "0 6px 16px rgba(15, 118, 110, 0.4)";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!disabled && !isLoading) {
                        e.currentTarget.style.transform = "translateY(0)";
                        if (variant === "primary") e.currentTarget.style.boxShadow = "0 4px 12px rgba(15, 118, 110, 0.3)";
                    }
                }}
                onMouseDown={(e) => {
                    if (!disabled && !isLoading) {
                        e.currentTarget.style.transform = "translateY(1px)";
                    }
                }}
                onMouseUp={(e) => {
                    if (!disabled && !isLoading) {
                        e.currentTarget.style.transform = "translateY(-1px)";
                    }
                }}
            >
                {isLoading ? (
                    <span style={{ marginRight: "8px", animation: "spin 1s linear infinite" }}>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </span>
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
