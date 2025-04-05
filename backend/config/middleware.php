<?php
function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "No autorizado. Debes iniciar sesión."
		]);
		return false;
        exit;
	}
	return true;
}
