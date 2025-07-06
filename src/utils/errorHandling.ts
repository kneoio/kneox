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
export const handleFormSaveError = (error: unknown, messageInstance: any, fallbackMessage: string = 'Save failed') => {
    if (isErrorWithResponse(error) && error.response?.status === 400) {
        const errorData = error.response.data as ErrorResponse;
        if (errorData.errors?.length) {
            errorData.errors.forEach(err => {
                messageInstance.error(`${capitalizeFirstLetter(err.field)}: ${err.message}`);
            });
        } else {
            messageInstance.error(errorData.message || "Validation failed");
        }
    } else {
        messageInstance.error(`${fallbackMessage}: ${getErrorMessage(error)}`);
    }
};
