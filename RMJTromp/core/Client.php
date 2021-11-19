<?php

    namespace RMJTromp\core;

    use http\Exception\InvalidArgumentException;
    use RMJTromp\exceptions\IllegalArgumentException;
    use RMJTromp\exceptions\IllegalStateException;
    use RMJTromp\exceptions\MySQLException;
    use RMJTromp\RMJTromp;
    use RMJTromp\utilities\File;
    use RMJTromp\utilities\JSON;

    require_once "RMJTromp/exceptions/IllegalArgumentException.php";
    require_once "RMJTromp/exceptions/IllegalStateException.php";
    require_once "RMJTromp/exceptions/InvalidArgumentException.php";
    require_once "RMJTromp/exceptions/MySQLException.php";

    class Client {

        /** @var Client[] clients */
        private static array $clients = [];
        /** @var string[] $cities */
        private static ?array $cities = null;
        /** @var string[] $lowerCities */
        private static ?array $lowerCities = null;

        private int $id;
        private string $name;
        private string $address;
        private string $postcode;
        private string $location;

        /**@throws MySQLException|IllegalArgumentException|IllegalStateException
         */
        public static function createClient(string $name, string $address, string $postcode, string $location) : Client {
            $name = trim($name);
            if(preg_match("/^[a-z ]{2,}$/i", $name) !== false) {
                $address = trim($address);
                if(preg_match("/^[a-z ]{2,}$/i", $address) !== false) {
                    $postcode = trim($postcode);
                    $postcode = preg_replace("/\s+/i", "", $postcode);
                    if(preg_match("/^\d{4}[a-z]{2}$/i", $postcode) !== false) {
                        $location = preg_replace("/[^a-z ]/i", "", $location);
                        $location = trim($location);

                        $location = Client::getCityFromString($location);
                        if($location == null) throw new InvalidArgumentException("Er is geen stad onder die naam gevonden");

                        $stmt = RMJTromp::getConnection()->prepare("INSERT INTO `klanten` (naam, adres, postcode, plaats) VALUES (?, ?, ?, ?)");
                        $stmt->bind_param("ssss", $name, $address, $postcode, $location);
                        if($stmt->execute()) {
                            return Client::getClient(RMJTromp::getConnection()->insert_id);
                        } else throw new MySQLException($stmt->error);
                    } else throw new IllegalArgumentException("Ongeldige postcode opgegeven");
                } else throw new IllegalArgumentException("Ongeldige adres opgegeven");
            } else throw new IllegalArgumentException("Ongeldige naam opgegeven");
        }

        /** @throws MySQLException|IllegalStateException */
        public static function getClient(int $id) : ?Client {
            foreach (Client::$clients as $client) {
                if($client->id === $id) return $client;
            }

            return new Client($id);
        }

        /** @throws MySQLException|IllegalStateException */
        private function __construct(int $id) {
            $stmt = RMJTromp::getConnection()->prepare("SELECT * FROM `klanten` WHERE `id` = ?");
            $stmt->bind_param("i", $id);
            if($stmt->execute()) {
                $res = $stmt->get_result();
                if($res->num_rows > 0) {
                    $row = $res->fetch_assoc();
                    $this->id = $row['id'];
                    $this->name = $row['naam'];
                    $this->address = $row['adres'];
                    $this->postcode = $row['postcode'];
                    $this->location = $row['plaats'];

                    array_push(Client::$clients, $this);
                } else throw new IllegalStateException("Klant met opgegeven ID bestaat niet");
            } else throw new MySQLException($stmt->error);
        }

        public function getId() : int {
            return $this->id;
        }

        public function getName() : string {
            return $this->name;
        }

        /**@throws MySQLException|IllegalArgumentException */
        public function setName(string $name) : void {
            $name = trim($name);
            if(preg_match("/^[a-z ]{2,}$/i", $name) !== false) {
                $stmt = RMJTromp::getConnection()->prepare("UPDATE `klanten` SET `naam` = ? WHERE `id` = ?");
                $stmt->bind_param("si", $name, $this->id);
                if($stmt->execute()) $this->name = $name;
                else throw new MySQLException($stmt->error);
            } else throw new IllegalArgumentException("Ongeldige naam opgegeven");
        }

        public function getAddress() : string {
            return $this->address;
        }

        /** @throws MySQLException|IllegalArgumentException */
        public function setAddress(string $address) : void {
            $address = trim($address);
            if(preg_match("/^[a-z ]{2,}$/i", $address) !== false) {
                $stmt = RMJTromp::getConnection()->prepare("UPDATE `klanten` SET `adres` = ? WHERE `id` = ?");
                $stmt->bind_param("si", $address, $this->id);
                if($stmt->execute()) $this->address = $address;
                else throw new MySQLException($stmt->error);
            } else throw new IllegalArgumentException("Ongeldige adres opgegeven");
        }

        public function getPostCode() : string {
            return $this->postcode;
        }

        /** @throws MySQLException|IllegalArgumentException */
        public function setPostCode(string $postcode) : void {
            $postcode = trim($postcode);
            $postcode = preg_replace("/\s+/i", "", $postcode);
            if(preg_match("/^\d{4}[a-z]{2}$/i", $postcode) !== false) {
                $stmt = RMJTromp::getConnection()->prepare("UPDATE `klanten` SET `postcode` = ? WHERE `id` = ?");
                $stmt->bind_param("si", $postcode, $this->id);
                if($stmt->execute()) $this->postcode = $postcode;
                else throw new MySQLException($stmt->error);
            } else throw new IllegalArgumentException("Ongeldige postcode opgegeven");
        }

        public function getLocation() : string {
            return $this->location;
        }

        /** @throws MySQLException|InvalidArgumentException */
        public function setLocation(string $location) : void {
            $location = preg_replace("/[^a-z ]/i", "", $location);
            $location = trim($location);

            $location = Client::getCityFromString($location);
            if($location == null) throw new InvalidArgumentException("Er is geen stad onder die naam gevonden");

            $stmt = RMJTromp::getConnection()->prepare("UPDATE `klanten` SET `plaats` = ? WHERE `id` = ?");
            $stmt->bind_param("si", $location, $this->id);
            if($stmt->execute()) $this->location = $location;
            else throw new MySQLException($stmt->error);
        }

        /** @throws MySQLException */
        public function delete() : void {
            $stmt = RMJTromp::getConnection()->prepare("DELETE FROM `klanten` WHERE `id` = ?");
            $stmt->bind_param("i", $this->id);
            if(!$stmt->execute()) throw new MySQLException($stmt->error);
        }

        private static function getCityFromString(string $query) : ?string {
            if(Client::$cities == null || Client::$lowerCities == null) {
                Client::$cities = JSON::decode(new File("assets/json/steden.json"), true);
                Client::$lowerCities = array_map(function($city) {
                    return strtolower($city);
                }, Client::$cities);
            }
            $query = strtolower($query);

            // search array for exact match
            $index = array_search($query, Client::$lowerCities);
            if($index !== false) return Client::$cities[$index];
            else {
                // calculate distance between query and state name
                $distances = [];
                foreach(Client::$lowerCities as $city) {
                    array_push($distances, [$city, distance($query, $city)]);
                }

                // sort array by similarity (distance)
                usort($distances, function ($a, $b){
                    return $a[1] < $b[1];
                });

                // return highest distance if higher than or equal to 50%
                if($distances[0][1] >= 50) return Client::$cities[array_search($distances[0][0], Client::$lowerCities)];
            }
            return null;
        }

    }

    function distance($a, $b): float|int {
        $max = max(strlen($a), strlen($b));
        return ($max - levenshtein($a, $b)) / $max;
    }