<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

require_once 'db.php';

const USER = [
    [
        'email' => 'software.consultant.bcn@gmail.com',
        'password' => 'admin',
    ]
];

$body_raw = file_get_contents('php://input');
$body_json = json_decode($body_raw, true);

$email = $body_json['email'];
$password = $body_json['password'];

foreach (get_users() as $user) {
    if ($user->email === $email /*&& $user->password === $password*/) {
        echo json_encode([
            'success' => true,
            'message' => 'Te has autenticado correctamente.'
        ]);
        exit;
    }
}

echo json_encode([
    'success' => false,
    'message' => 'No te has autenticado correctamente.'
]);