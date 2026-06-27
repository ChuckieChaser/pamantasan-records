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

            return null;
        }
    };
};
