declare const pipe: {
    (...values: any[]): {
        through: (fn: any, ...args: any[]) => any;
    };
    through(fn: any, ...args: any[]): (...values: any[]) => any;
};
export { pipe };
