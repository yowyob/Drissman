package com.drissman.api.exception;

import com.drissman.api.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handles validation errors from @Valid annotations.
     */
    @ExceptionHandler(WebExchangeBindException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(WebExchangeBindException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("Erreur de validation");

        log.warn("Validation error: {}", message);
        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .error(message)
                        .status(HttpStatus.BAD_REQUEST.value())
                        .build());
    }

    /**
     * Handles IllegalArgumentException (bad input, wrong password, etc.).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ErrorResponse.builder()
                        .error(ex.getMessage())
                        .status(HttpStatus.BAD_REQUEST.value())
                        .build());
    }

    /**
     * Handles RuntimeException with contextual mapping:
     * - "non trouvé" / "not found" → 404
     * - "déjà" / "already" → 409 Conflict
     * - "Authentification" / "credentials" → 401 Unauthorized
     * - Everything else → 400 Bad Request (business logic errors)
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Erreur interne";
        HttpStatus status;

        if (message.toLowerCase().contains("non trouvé") || message.toLowerCase().contains("not found")) {
            status = HttpStatus.NOT_FOUND;
            log.warn("Not found: {}", message);
        } else if (message.toLowerCase().contains("déjà") || message.toLowerCase().contains("already")) {
            status = HttpStatus.CONFLICT;
            log.warn("Conflict: {}", message);
        } else if (message.toLowerCase().contains("authentification") || message.toLowerCase().contains("credentials")
                || message.toLowerCase().contains("invalid")) {
            status = HttpStatus.UNAUTHORIZED;
            log.warn("Unauthorized: {}", message);
        } else {
            status = HttpStatus.BAD_REQUEST;
            log.warn("Bad request: {}", message);
        }

        return ResponseEntity.status(status)
                .body(ErrorResponse.builder()
                        .error(message)
                        .status(status.value())
                        .build());
    }

    /**
     * Catch-all for unexpected errors.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.builder()
                        .error("Erreur interne du serveur")
                        .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                        .build());
    }
}
