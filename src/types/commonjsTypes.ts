interface ValidationError {
    field: string;
    message: string;
}

interface ErrorResponse {
    message?: string;
    errors?: ValidationError[];
}