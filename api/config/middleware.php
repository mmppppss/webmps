<?php
declare(strict_types=1);

/**
 * Exige una sesion activa.
 *
 * IMPORTANTE: esta funcion NO retorna nunca cuando la sesion falta.
 * Antes hacia `return false` con un `exit` inalcanzable detras, y todos los
 * callers ignoraban el valor de retorno: eso permitia borrar y crear
 * articulos y anuncios sin autenticarse.
 */
function requireAuth(): bool
{
    if (isset($_SESSION['user_id'])) {
        return true;
    }

    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status'  => 'error',
        'message' => 'No autorizado. Debes iniciar sesion.',
    ], JSON_UNESCAPED_UNICODE);

    exit; // sin esto, el flujo continua y la accion se ejecuta igual
}

/**
 * Exige una sesion activa con un rol concreto.
 * Por ahora el panel usa un unico rol, pero deja el helper listo.
 */
function requireRole(string ...$roles): bool
{
    requireAuth();

    $rol = isset($_SESSION['rol']) ? (string) $_SESSION['rol'] : '';
    if (!in_array($rol, $roles, true)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status'  => 'error',
            'message' => 'No tienes permisos para esta accion.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    return true;
}