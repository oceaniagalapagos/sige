<?php

final class User
{
    public int $id = 0;
    public string $mocha_user_id = '';
    public string $email = '';
    public string $nombre = '';
    public string $rol = 'cliente';
    public bool $is_active = false;
    public DateTime $create_at;
    public DateTime $update_at;

    public function __construct()
    {
        $this->create_at = new DateTime();
        $this->update_at = new DateTime();
    }
}
