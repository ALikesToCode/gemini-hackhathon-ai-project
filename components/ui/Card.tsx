import React, { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "glass" | "flat";
    padding?: "none" | "sm" | "md" | "lg";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = "", variant = "default", padding = "md", children, style, ...props }, ref) => {

        let baseStyles: React.CSSProperties = {
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
        };

        if (variant === "default") {
            baseStyles.backgroundColor = "var(--surface)";
            baseStyles.boxShadow = "var(--shadow)";
            baseStyles.border = "1px solid var(--border)";
        } else if (variant === "glass") {
            baseStyles.backgroundColor = "rgba(255, 255, 255, 0.75)";
            baseStyles.backdropFilter = "blur(16px)";
            baseStyles.WebkitBackdropFilter = "blur(16px)";
            baseStyles.border = "1px solid rgba(255, 255, 255, 0.5)";
            baseStyles.boxShadow = "0 8px 32px 0 rgba(31, 38, 135, 0.05)";
        } else if (variant === "flat") {
            baseStyles.backgroundColor = "var(--surface-2)";
            baseStyles.border = "1px solid var(--border)";
        }

        const paddingStyles = {
            none: "0",
            sm: "12px",
            md: "24px",
            lg: "32px"
        };

        return (
            <div
                ref={ref}
                style={{ ...baseStyles, padding: paddingStyles[padding], ...style }}
                className={className}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";
