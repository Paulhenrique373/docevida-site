/** @type {import('tailwindcss').Config} */
module.exports = {
    blocklist: ["overline"],
    darkMode: ["class"],
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
    theme: {
        extend: {
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chocolate: '#2A1810',
                cocoa: '#1F120B',
                cream: '#FAF7F2',
                oat: '#F4EFE6',
                gold: { DEFAULT: '#C5A059', dark: '#A0823F', soft: '#E9DCBF' },
                moss: { DEFAULT: '#3E5239', dark: '#2E3E2A', light: '#EAF0E6' },
                caramel: '#8C5127',
                taupe: '#6E5B53'
            },
            fontFamily: {
                serif: ['Fraunces', 'Georgia', 'serif'],
                sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif']
            },
            keyframes: {
                'fade-up': {
                    from: { opacity: '0', transform: 'translateY(24px)' },
                    to: { opacity: '1', transform: 'translateY(0)' }
                }
            },
            animation: {
                'fade-up': 'fade-up 0.8s cubic-bezier(0.16,1,0.3,1) both'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
