<?php
require_once __DIR__ . '/../models/User.php';

class AuthController {
    private $userModel;

    public function __construct($db = null) {
        if ($db === null) {
            require_once __DIR__ . '/../config/database.php';
            $db = (new Database())->getConnection();
        }

        $this->userModel = new User($db);
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function login($username, $password) {
        $user = $this->userModel->getByUsername($username);

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['authenticated'] = true;
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];

            return ['status' => 'success', 'message' => 'Logged in'];
        }

        return ['status' => 'error', 'message' => 'Invalid credentials'];
    }

	
	public function register($username, $password) {
		if ($this->userModel->getByUsername($username)) {
			return ['status' => 'error', 'message' => 'Username already exists'];
		}

		$passwordHash = password_hash($password, PASSWORD_DEFAULT);
		$success = $this->userModel->create($username, $passwordHash);

		if ($success) {
			return ['status' => 'success', 'message' => 'User created'];
		} else {
			return ['status' => 'error', 'message' => 'User creation failed'];
		}
	}

    public function logout() {
        session_destroy();
        return ['status' => 'success', 'message' => 'Logged out'];
    }

	public function isAuthenticated() {
        return isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true;
    }
}

