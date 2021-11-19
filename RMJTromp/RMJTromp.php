<?php

    namespace RMJTromp;

    use mysqli;
    use RMJTromp\utilities\JSON;

    final class RMJTromp {

        private function __construct() {}

        public static function getRequestMethod() : string {
            return $_SERVER['REQUEST_METHOD'] ?? "GET";
        }

        public static function getDirectoryPath() : array {
            $path = $_SERVER['REDIRECT_URL'] ?? "";
            $path = str_starts_with($path, "/") ? substr($path, 1) : $path;
            $path = str_ends_with($path, "/") ? substr($path, 0, strlen($path)-1) : $path;
            return array_filter(explode("/", $path));
        }

        private static ?mysqli $conn = null;
        public static function getConnection() : ?\mysqli {
            return RMJTromp::$conn;
        }

        public static function setConnection(mysqli $conn) {
            RMJTromp::$conn = $conn;
        }

        public static function getPHPInput() : mixed {
            $resource = fopen('php://input', 'r');
            $input = '';
            while($data = fread($resource, 1024))
                $input .= $data;
            fclose($resource);
            if(str_contains(getHeader("Content-Type"), "application/json")) return json_decode($input, true);
            return $input;
        }

    }

    function getHeader(string $key) : ?string {
        $headers = apache_request_headers();
        foreach($headers as $header => $value) {
            if(strtolower($header) == strtolower($key)) return $value;
        }
        return null;
    }

    function apiRespond($response) : void {
        header("Content-Type: application/json");
        exit(JSON::encode($response, JSON_PRETTY_PRINT));
    }