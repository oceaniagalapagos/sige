<?php
require_once "user.php";

function get_users()
{
    require_once 'config.php';

    $result = $conn->execute_query('SELECT * FROM `usuarios_app`');

    $clients = [];

    foreach ($result->fetch_all() as $user) {
        $client = new User();
        $client->id = (int) $user[0];
        $client->mocha_user_id = (string) $user[1];
        $client->email = (string) $user[2];
        $client->nombre = (string) $user[3];
        $client->rol = (string) $user[4];
        $client->is_active = ((int) $user[5]) == 1;
        $client->create_at = new DateTime((string) $user[6]);
        $client->update_at = new DateTime((int) $user[7]);
        $clients[] = $client;
    }

    return $clients;
}