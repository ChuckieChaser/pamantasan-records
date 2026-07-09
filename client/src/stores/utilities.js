export const action = (set, callback) => {
    return async (...args) => {
        set({
            isLoading: true,
            error: null,
        });

        try {
            const data = await callback(...args);
            set({ isLoading: false });

            return data;
        } catch (error) {
            set({
                isLoading: false,
                error: error.message,
            });

            // Re-throw so the calling component's try/catch can surface the error.
            throw error;
        }
    };
};
