export interface ValidationError {
    field: string;
    message: string;
}

export interface ErrorResponse {
    message?: string;
    errors?: ValidationError[];
}

export const isErrorWithResponse = (error: unknown): error is { response: { status: number; data: unknown } } => {
    return typeof error === 'object' && error !== null && 'response' in error;
};

export const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'Unknown error';
};