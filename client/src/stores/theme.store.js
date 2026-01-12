import { create } from 'zustand';

export const useThemeStore = create((set) => {
    // Initial check
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');

    // Apply initially
    if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    return {
        theme: initialTheme,
        toggleTheme: () => set((state) => {
            const newTheme = state.theme === 'light' ? 'dark' : 'light';

            localStorage.setItem('theme', newTheme);
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            return { theme: newTheme };
        })
    };
});
