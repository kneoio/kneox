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

/**
 * Uniform error handler for form save operations
 * @param error - The error object from the failed save operation
 * @param messageInstance - The message instance from useMessage()
 * @param fallbackMessage - Default message if no specific error is available
 */
export const handleFormSaveError = (error: unknown, messageInstance: any): void => {
    // Prefer structured server validation
    if (isErrorWithResponse(error)) {
        const data: any = error.response?.data;
        if (error.response?.status === 400 && data) {
            if (Array.isArray((data as ErrorResponse)?.errors) && (data as ErrorResponse).errors!.length) {
                (data as ErrorResponse).errors!.forEach(err => {
                    messageInstance.error(`${capitalizeFirstLetter(err.field)}: ${err.message}`);
                });
                return;
            }
            if (typeof data.message === 'string' && data.message) {
                messageInstance.error(data.message);
                return;
            }
        }
        // Show raw server payload if available
        if (typeof data !== 'undefined') {
            try {
                messageInstance.error(JSON.stringify(data));
            } catch {
                messageInstance.error(String(data));
            }
            return;
        }
    }

    // Last resort: normalized error string (no fallback prefix)
    messageInstance.error(getErrorMessage(error));
};
